import PocketBase from 'pocketbase';

// 在生产环境下 (HTTPS PWA)，由于浏览器会阻止请求非 HTTPS 的资源，必须利用 Nginx 将 API 代理为同源或 HTTPS。
// 如果本地开发，自动退回到您的远程 IP。如果是部署到生产（也就是在 yuxi.uyhnm.cn 下），则直接使用相对路径，让请求由 Nginx 处理转发。
const apiEndpoint = import.meta.env.DEV ? 'http://106.54.239.44:9001' : '/';

const pb = new PocketBase(apiEndpoint);

// Enable auto cancellation of pending requests to not overload the server
pb.autoCancellation(false);

export default pb;
