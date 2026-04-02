/**
 * restore-data.mjs
 * Restores PocketBase collections and records from exported JSON files.
 * Uses raw fetch() for all API calls to avoid SDK/server version mismatch.
 *
 * Environment variables (restore target takes priority):
 *   PB_RESTORE_API_URL    → PB_API_URL         (fallback)
 *   PB_RESTORE_ADMIN_EMAIL → PB_ADMIN_EMAIL    (fallback)
 *   PB_RESTORE_ADMIN_PASSWORD → PB_ADMIN_PASSWORD (fallback)
 *   RESTORE_DATA_DIR      - Directory containing exported JSON files
 */
import fs from 'fs';
import path from 'path';

// Prefer PB_RESTORE_* (target B), fallback to PB_* (source A)
const PB_URL = (process.env.PB_RESTORE_API_URL || process.env.PB_API_URL || '').replace(/\/$/, '');
const EMAIL = process.env.PB_RESTORE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const PASSWORD = process.env.PB_RESTORE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;
const DATA_DIR = process.env.RESTORE_DATA_DIR;

if (!PB_URL || !EMAIL || !PASSWORD || !DATA_DIR) {
  console.error('❌ Missing env: PB_RESTORE_API_URL/PB_API_URL, email, password, RESTORE_DATA_DIR');
  process.exit(1);
}

/** Authenticate as superuser, return token */
async function authenticate() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Auth failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.token;
}

/** List existing collections */
async function listCollections(token) {
  const res = await fetch(`${PB_URL}/api/collections?perPage=200`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`List collections failed: ${res.status}`);
  const data = await res.json();
  return data.items || data;
}

/** Create a collection from schema */
async function createCollection(schema, token) {
  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({
      name: schema.name,
      type: schema.type,
      schema: schema.fields || schema.schema,
      indexes: schema.indexes,
      listRule: schema.listRule ?? '',
      viewRule: schema.viewRule ?? '',
      createRule: schema.createRule ?? '',
      updateRule: schema.updateRule ?? '',
      deleteRule: schema.deleteRule ?? '',
    }),
  });
  return res;
}

/** Create a record in a collection */
async function createRecord(collectionName, recordData, token) {
  const res = await fetch(`${PB_URL}/api/collections/${encodeURIComponent(collectionName)}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(recordData),
  });
  return res;
}

async function run() {
  console.log(`Restoring data from: ${DATA_DIR}`);
  console.log(`Target PocketBase: ${PB_URL}\n`);

  // Authenticate
  const token = await authenticate();
  console.log('✅ Authentication successful\n');

  // Step 1: Restore schemas (create missing collections)
  const schemasPath = path.join(DATA_DIR, '_schemas.json');
  if (fs.existsSync(schemasPath)) {
    console.log('--- Restoring Collection Schemas ---');
    const schemas = JSON.parse(fs.readFileSync(schemasPath, 'utf8'));

    const existing = await listCollections(token);
    const existingNames = new Set(existing.map(c => c.name));

    for (const schema of schemas) {
      if (existingNames.has(schema.name)) {
        console.log(`  ⏭️  Collection "${schema.name}" already exists, skipping`);
        continue;
      }

      const res = await createCollection(schema, token);
      if (res.ok) {
        console.log(`  ✅ Created collection: ${schema.name}`);
      } else {
        const body = await res.text();
        console.error(`  ❌ Failed to create "${schema.name}": ${body}`);
      }
    }
    console.log('');
  }

  // Step 2: Restore records
  console.log('--- Restoring Records ---');
  const files = fs.readdirSync(DATA_DIR).filter(
    f => f.endsWith('.json') && !f.startsWith('_'),
  );

  let totalRestored = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const file of files) {
    const collectionName = path.basename(file, '.json');
    const records = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

    console.log(`\n  📦 ${collectionName} (${records.length} records)`);

    let restored = 0;
    let skipped = 0;
    let failed = 0;

    for (const record of records) {
      // Build record data (exclude system fields, keep id)
      const data = { id: record.id };
      for (const [key, value] of Object.entries(record)) {
        if (['created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(key)) {
          continue;
        }
        data[key] = value;
      }

      const res = await createRecord(collectionName, data, token);
      if (res.ok) {
        restored++;
      } else {
        const status = res.status;
        if (status === 400) {
          skipped++; // likely duplicate
        } else {
          failed++;
          if (failed <= 3) {
            const body = await res.text();
            console.error(`    ❌ Record ${record.id}: HTTP ${status} - ${body}`);
          }
        }
      }
    }

    console.log(`    ✅ ${restored} restored | ⏭️ ${skipped} skipped | ❌ ${failed} failed`);
    totalRestored += restored;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Restore Summary:`);
  console.log(`    ✅ Restored: ${totalRestored}`);
  console.log(`    ⏭️  Skipped:  ${totalSkipped}`);
  console.log(`    ❌ Failed:   ${totalFailed}`);
  console.log(`${'='.repeat(50)}`);
}

run().catch(err => {
  console.error('\n💥 Fatal error:', err.message || err);
  process.exit(1);
});
