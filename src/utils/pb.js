import PocketBase from 'pocketbase';

// 在生产环境下 (HTTPS PWA)，由于浏览器会阻止请求非 HTTPS 的资源，必须利用 Nginx 将 API 代理为同源或 HTTPS。
// 如果指定了具体地址 (VITE_PB_API_URL) 则优先使用；否则进行智能保底：开发模式默认为本地通信，生产部署默认变为相对路径 `/` 以吃 Nginx 的反代。
const fallbackEndpoint = import.meta.env.DEV ? 'http://106.54.239.44:9001' : '/';
const apiEndpoint = import.meta.env.VITE_PB_API_URL || fallbackEndpoint;

const pb = new PocketBase(apiEndpoint);

// Enable auto cancellation of pending requests to not overload the server
pb.autoCancellation(false);

export default pb;
