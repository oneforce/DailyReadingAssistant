const UPLOAD_URL = 'https://up-z0.qiniup.com'
const CDN_DOMAIN = 'https://tbtyij8je.hd-bkt.clouddn.com'
const APP_NAME = 'reading-app'

function getConfig() {
  const ak = import.meta.env.VITE_QINIU_AK
  const sk = import.meta.env.VITE_QINIU_SK
  const bucket = import.meta.env.VITE_QINIU_BUCKET
  if (!ak || ak.startsWith('your_') || !sk || sk.startsWith('your_') || !bucket || bucket.startsWith('your_')) {
    console.warn('[Qiniu] AK/SK/Bucket not configured. Set them in .env file.')
    return null
  }
  return { ak, sk, bucket }
}

// Base64 URL-safe encode
function base64UrlSafe(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlSafeFromBytes(bytes) {
  let binary = ''
  const uint8 = new Uint8Array(bytes)
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

// Generate upload token using AK + SK
async function generateUploadToken(config) {
  const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
  const putPolicy = JSON.stringify({ scope: config.bucket, deadline })
  const encodedPolicy = base64UrlSafe(putPolicy)

  // HMAC-SHA1 sign
  const encoder = new TextEncoder()
  const keyData = encoder.encode(config.sk)
  const msgData = encoder.encode(encodedPolicy)

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const encodedSign = base64UrlSafeFromBytes(signature)

  return `${config.ak}:${encodedSign}:${encodedPolicy}`
}

function buildKey(filename) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${APP_NAME}/${y}/${m}/${d}/${filename}`
}

export function getFileUrl(key) {
  return `${CDN_DOMAIN}/${key}`
}

/**
 * Upload a blob to Qiniu
 * @param {Blob} blob - audio blob
 * @param {string} taskId
 * @param {string} reqId
 * @returns {Promise<{key: string, url: string} | null>}
 */
export async function uploadToQiniu(blob, taskId, reqId) {
  const config = getConfig()
  if (!config) return null

  const token = await generateUploadToken(config)
  const ext = blob.type?.includes('webm') ? 'webm' : blob.type?.includes('mp4') ? 'mp4' : 'webm'
  const ts = Date.now()
  const filename = `${taskId}-${reqId}-${ts}.${ext}`
  const key = buildKey(filename)

  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('token', token)
  formData.append('key', key)

  try {
    const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
    if (!res.ok) {
      const text = await res.text()
      console.error('[Qiniu] Upload failed:', res.status, text)
      return null
    }
    const data = await res.json()
    return { key: data.key, url: getFileUrl(data.key) }
  } catch (e) {
    console.error('[Qiniu] Upload error:', e)
    return null
  }
}
