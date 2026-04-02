import PocketBase from 'pocketbase';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 简易读取 .env 文件
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env');
let email = '';
let password = '';
let apiUrl = '';

try {
  const envData = fs.readFileSync(envPath, 'utf8');
  envData.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) {
      if (k.trim() === 'PB_ADMIN_EMAIL') email = v.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (k.trim() === 'PB_ADMIN_PASSWORD') password = v.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (k.trim() === 'VITE_PB_API_URL') apiUrl = v.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
} catch (e) {}

email = email || process.env.PB_ADMIN_EMAIL;
password = password || process.env.PB_ADMIN_PASSWORD;
apiUrl = apiUrl || process.env.VITE_PB_API_URL;

const pb = new PocketBase(apiUrl);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Helper to ensure collection exists and has all fields
async function ensureCollection(name, defaultData) {
  try {
    const existing = await pb.collections.getOne(name);
    console.log(`  - 发现现有 ${name} 表，由于保留数据要求，我们尝试更新增量字段...`);
    const existingFieldNames = existing.fields.map(f => f.name);
    let changed = false;
    for (const f of defaultData.fields) {
      if (!existingFieldNames.includes(f.name)) {
         existing.fields.push(f);
         changed = true;
      }
    }
    if (changed) {
       await pb.collections.update(name, existing);
       console.log(`✅ ${name} 表结构更新成功！`);
    } else {
       console.log(`✅ ${name} 表结构已是最新的，无须更新。`);
    }
  } catch(e) {
    console.log(`  - 未发现 ${name} 表，准备新建...`);
    await pb.collections.create(defaultData);
    console.log(`✅ ${name} 表创建成功！`);
  }
}

async function run() {
  console.log('=============== 初始化/更新 PocketBase 数据库 ===============');

  try {
    console.log('\n[1/3] 正在连接与验证...');
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('✅ 登录成功！');

    console.log('\n[2/3] 开始检查和创建 books 表...');
    await ensureCollection('books', {
      name: 'books',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'bookId', type: 'text', required: true },
        { name: 'title', type: 'text' },
        { name: 'cover', type: 'text' },
        { name: 'subject', type: 'text' },
        { name: 'desc', type: 'text' },
        { name: 'rewardPoints', type: 'number' },
        { name: 'isArchived', type: 'bool' }
      ]
    });

    console.log('\n[3/3] 开始检查和更新其余表...');

    await ensureCollection('tasks', {
      name: 'tasks',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'taskId', type: 'text', required: true, unique: true },
        { name: 'type', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'subject', type: 'text' },
        { name: 'icon', type: 'text' },
        { name: 'iconBg', type: 'text' },
        { name: 'iconColor', type: 'text' },
        { name: 'subtitle', type: 'text' },
        { name: 'content', type: 'json' },
        { name: 'difficulty', type: 'text' },
        { name: 'requirements', type: 'json' },
        { name: 'completed', type: 'bool' },
        { name: 'completedAt', type: 'date' },
        { name: 'completedDuration', type: 'number' },
        { name: 'reviewed', type: 'bool' },
        { name: 'returnHistory', type: 'json' },
        // 新增字段
        { name: 'bookId', type: 'text' },
        { name: 'chapterIndex', type: 'number' },
        { name: 'isArchived', type: 'bool' }
      ]
    });

    await ensureCollection('recordings', {
      name: 'recordings',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'taskId', type: 'text', required: true },
        { name: 'subKey', type: 'text', required: true },
        { name: 'audio', type: 'file', required: true },
        { name: 'duration', type: 'number' }
      ]
    });

    await ensureCollection('events', {
      name: 'events',
      type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
      fields: [
        { name: 'eventType', type: 'text', required: true },
        { name: 'page', type: 'text' },
        { name: 'target', type: 'text' },
        { name: 'action', type: 'text' },
        { name: 'taskId', type: 'text' },
        { name: 'recordingUrl', type: 'text' },
        { name: 'startTime', type: 'date' },
        { name: 'duration', type: 'number' },
        { name: 'isSpecial', type: 'bool' },
        { name: 'specialReason', type: 'text' },
        { name: 'pointsAwarded', type: 'number' }
      ]
    });

    console.log('\n🎉 所有自动化建表/更新流程结束，未删除任何数据！');

  } catch (err) {
    if (err?.data?.data) {
      console.error('\n❌ 详情报错：', JSON.stringify(err.data.data, null, 2));
    } else {
      console.error('\n❌ 发生错误：', err.message || err);
    }
  } finally {
    rl.close();
  }
}

run();
