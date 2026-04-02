/**
 * restore-data.mjs
 * Restores PocketBase collections and records from exported JSON files.
 *
 * Environment variables (restore target takes priority):
 *   PB_RESTORE_API_URL    → PB_API_URL         (fallback)
 *   PB_RESTORE_ADMIN_EMAIL → PB_ADMIN_EMAIL    (fallback)
 *   PB_RESTORE_ADMIN_PASSWORD → PB_ADMIN_PASSWORD (fallback)
 *   RESTORE_DATA_DIR      - Directory containing exported JSON files
 */
import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';

// Prefer PB_RESTORE_* (target B), fallback to PB_* (source A)
const PB_URL = process.env.PB_RESTORE_API_URL || process.env.PB_API_URL;
const EMAIL = process.env.PB_RESTORE_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL;
const PASSWORD = process.env.PB_RESTORE_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD;
const DATA_DIR = process.env.RESTORE_DATA_DIR;

if (!PB_URL || !EMAIL || !PASSWORD || !DATA_DIR) {
  console.error('❌ Missing env: PB_API_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, RESTORE_DATA_DIR');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

async function run() {
  console.log(`Restoring data from: ${DATA_DIR}`);
  console.log(`Target PocketBase: ${PB_URL}\n`);

  // Authenticate
  await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
  console.log('✅ Authentication successful\n');

  // Step 1: Restore schemas (create missing collections)
  const schemasPath = path.join(DATA_DIR, '_schemas.json');
  if (fs.existsSync(schemasPath)) {
    console.log('--- Restoring Collection Schemas ---');
    const schemas = JSON.parse(fs.readFileSync(schemasPath, 'utf8'));

    const existingCollections = await pb.collections.getFullList();
    const existingNames = new Set(existingCollections.map(c => c.name));

    for (const schema of schemas) {
      if (existingNames.has(schema.name)) {
        console.log(`  ⏭️  Collection "${schema.name}" already exists, skipping schema`);
        continue;
      }

      try {
        await pb.collections.create({
          name: schema.name,
          type: schema.type,
          fields: schema.fields,
          indexes: schema.indexes,
          listRule: schema.listRule ?? '',
          viewRule: schema.viewRule ?? '',
          createRule: schema.createRule ?? '',
          updateRule: schema.updateRule ?? '',
          deleteRule: schema.deleteRule ?? '',
        });
        console.log(`  ✅ Created collection: ${schema.name}`);
      } catch (err) {
        console.error(`  ❌ Failed to create "${schema.name}": ${err.message}`);
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
      // Build the record data (exclude system fields)
      const data = {};
      for (const [key, value] of Object.entries(record)) {
        // Skip PocketBase system fields
        if (['id', 'created', 'updated', 'collectionId', 'collectionName', 'expand'].includes(key)) {
          continue;
        }
        data[key] = value;
      }

      try {
        // Try to create with original ID to maintain references
        await pb.collection(collectionName).create({
          id: record.id,
          ...data,
        });
        restored++;
      } catch (err) {
        if (err?.status === 400 || err?.message?.includes('unique')) {
          skipped++;
        } else {
          failed++;
          if (failed <= 3) {
            console.error(`    ❌ Record ${record.id}: ${err.message}`);
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
