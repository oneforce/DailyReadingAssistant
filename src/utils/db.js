const DB_NAME = 'DailyReadingDB'
const DB_VERSION = 1
const STORE_NAME = 'recordings'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRecording(key, blob, duration = 0) {
  // Convert to Uint8Array for reliable storage + keep MIME type
  const arrayBuffer = await blob.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({
      data: Array.from(uint8), // plain array for max compatibility
      type: blob.type || 'audio/webm',
      duration,
      savedAt: Date.now(),
    }, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function reconstructBlob(raw) {
  // New format: { data: number[], type: string }
  if (raw && raw.data && Array.isArray(raw.data)) {
    const uint8 = new Uint8Array(raw.data)
    return new Blob([uint8], { type: raw.type || 'audio/webm' })
  }
  // New format variant: { buffer: ArrayBuffer, type: string }
  if (raw && raw.buffer) {
    return new Blob([raw.buffer], { type: raw.type || 'audio/webm' })
  }
  // Old format: raw Blob
  if (raw instanceof Blob) {
    return raw.type ? raw : new Blob([raw], { type: 'audio/webm' })
  }
  return null
}

export async function loadAllRecordings() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const keys = store.getAllKeys()
    const vals = store.getAll()
    tx.oncomplete = () => {
      const map = {}
      keys.result.forEach((k, i) => {
        const raw = vals.result[i]
        const blob = reconstructBlob(raw)
        if (!blob) return
        const url = URL.createObjectURL(blob)
        map[k] = { blob, url, duration: raw?.duration || 0, timestamp: Date.now() }
      })
      resolve(map)
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteRecording(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
