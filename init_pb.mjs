import PocketBase from 'pocketbase';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 简易读取 .env 文件（避免引入 dotenv 额外包）
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
} catch (e) {
  // .env 不存在或解析失败
}

// 支持环境变量兜底
email = email || process.env.PB_ADMIN_EMAIL;
password = password || process.env.PB_ADMIN_PASSWORD;
apiUrl = apiUrl || process.env.VITE_PB_API_URL;

const pb = new PocketBase(apiUrl);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function run() {
  console.log('=============== 修复并初始化 PocketBase 数据库 ===============');

  try {
    console.log('\n[1/3] 正在连接与验证...');
    await pb.collection('_superusers').authWithPassword(email, password);
    console.log('✅ 登录成功！');

    console.log('\n[2/3] 清理上次未包含字段的空表...');
    try { await pb.collections.delete('tasks'); console.log('  - 删除旧 tasks 表'); } catch (e) { }
    try { await pb.collections.delete('recordings'); console.log('  - 删除旧 recordings 表'); } catch (e) { }

    console.log('\n[3/3] 正在使用新版语法 (fields) 重新建表...');

    await pb.collections.create({
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
        { name: 'returnHistory', type: 'json' }
      ]
    });
    console.log('✅ tasks 表重新创建成功！(包含 16 个字段)');

    await pb.collections.create({
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
    console.log('✅ recordings 表重新创建成功！(包含 4 个字段)');

    // --- events collection ---
    try { await pb.collections.delete('events'); console.log('  - 删除旧 events 表'); } catch (e) { }

    await pb.collections.create({
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
    console.log('✅ events 表创建成功！(包含 11 个字段)');

    console.log('\n🎉 所有自动化建表流程结束，字段已完美生成！');

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
