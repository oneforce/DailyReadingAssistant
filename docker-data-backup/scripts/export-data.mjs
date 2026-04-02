/**
 * export-data.mjs
 * Exports all PocketBase collections and records to JSON files.
 *
 * Uses raw fetch() for record queries to avoid SDK/server version mismatch.
 * PB SDK is only used for auth and collection schema listing.
 *
 * Environment variables:
 *   PB_API_URL       - PocketBase API endpoint
 *   PB_ADMIN_EMAIL   - Superuser email
 *   PB_ADMIN_PASSWORD - Superuser password
 *   EXPORT_DIR       - Directory to write JSON files (default: /app/backup-repo/data)
 */
import PocketBase from 'pocketbase';
import fs from 'fs';
import path from 'path';

const PB_URL = process.env.PB_API_URL;
const EMAIL = process.env.PB_ADMIN_EMAIL;
const PASSWORD = process.env.PB_ADMIN_PASSWORD;
const EXPORT_DIR = process.env.EXPORT_DIR || '/app/backup-repo/data';

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error('❌ Missing required env: PB_API_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD');
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// System collections that should be skipped
const SYSTEM_PREFIXES = ['_', 'pb_'];

function isSystemCollection(name) {
  return SYSTEM_PREFIXES.some(prefix => name.startsWith(prefix));
}

/**
 * Fetch all records from a collection using raw HTTP API.
 * Bypasses PB SDK to avoid version mismatch issues.
 * @param {string} collectionName
 * @param {string} authToken - superuser auth token
 */
async function fetchAllRecords(collectionName, authToken) {
  const allRecords = [];
  let page = 1;
  const perPage = 200;
  const baseUrl = PB_URL.replace(/\/$/, '');

  while (true) {
    const url = `${baseUrl}/api/collections/${encodeURIComponent(collectionName)}/records?page=${page}&perPage=${perPage}`;
    const headers = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }

    const data = await res.json();
    allRecords.push(...data.items);

    if (data.items.length < perPage) break;
    page++;
  }

  return allRecords;
}

async function run() {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  PocketBase Data Export`);
  console.log(`  Time : ${new Date().toISOString()}`);
  console.log(`  Target: ${PB_URL}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Authenticate (SDK used only for auth + schema listing)
  console.log('[1/4] Authenticating as superuser...');
  await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
  const authToken = pb.authStore.token;
  console.log('✅ Authentication successful');

  // Step 2: Fetch all collections (via SDK - works fine)
  console.log('\n[2/4] Fetching collection list...');
  const allCollections = await pb.collections.getFullList();
  const userCollections = allCollections.filter(c => !isSystemCollection(c.name));
  console.log(`  Found ${allCollections.length} total collections, ${userCollections.length} user collections`);

  // Step 3: Prepare output directory
  if (fs.existsSync(EXPORT_DIR)) {
    fs.rmSync(EXPORT_DIR, { recursive: true });
  }
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  // Step 4: Export each collection
  console.log('\n[3/4] Exporting collection data...');

  const metadata = {
    exportTime: new Date().toISOString(),
    pbUrl: PB_URL,
    collections: [],
  };

  // Save collection schemas
  const schemas = userCollections.map(c => ({
    id: c.id,
    name: c.name,
    type: c.type,
    fields: c.fields,
    indexes: c.indexes,
    listRule: c.listRule,
    viewRule: c.viewRule,
    createRule: c.createRule,
    updateRule: c.updateRule,
    deleteRule: c.deleteRule,
  }));
  fs.writeFileSync(
    path.join(EXPORT_DIR, '_schemas.json'),
    JSON.stringify(schemas, null, 2),
  );
  console.log(`  📋 Saved ${schemas.length} collection schemas → _schemas.json`);

  for (const collection of userCollections) {
    const name = collection.name;
    try {
      // Use raw fetch with auth token (avoids SDK/server version mismatch)
      const allRecords = await fetchAllRecords(name, authToken);

      const filePath = path.join(EXPORT_DIR, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(allRecords, null, 2));

      metadata.collections.push({
        name,
        recordCount: allRecords.length,
        type: collection.type,
      });

      console.log(`  ✅ ${name}: ${allRecords.length} records`);
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
      metadata.collections.push({
        name,
        recordCount: 0,
        error: err.message,
      });
    }
  }

  // Save metadata
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  metadata.durationSeconds = parseFloat(elapsed);
  fs.writeFileSync(
    path.join(EXPORT_DIR, '_metadata.json'),
    JSON.stringify(metadata, null, 2),
  );

  console.log(`\n[4/4] Export complete in ${elapsed}s`);
  console.log(`  📁 Output directory: ${EXPORT_DIR}`);
  console.log(`  📊 Total collections: ${metadata.collections.length}`);
  const totalRecords = metadata.collections.reduce((sum, c) => sum + c.recordCount, 0);
  console.log(`  📊 Total records: ${totalRecords}`);
}

run().catch(err => {
  console.error('\n💥 Fatal error:', err.message || err);
  process.exit(1);
});
