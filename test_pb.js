import PocketBase from 'pocketbase';
const pb = new PocketBase('http://106.54.239.44:9002');
async function run() {
  try {
    const list = await pb.collection('books').getFullList({ sort: '-created' });
    console.log("Success! Items:", list.length);
  } catch (e) {
    console.log("Error!", e.message, e.response);
  }
}
run();
