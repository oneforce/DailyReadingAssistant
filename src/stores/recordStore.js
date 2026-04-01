import { create } from 'zustand'
import { saveRecording, loadAllRecordings } from '../utils/db'
import { uploadToQiniu } from '../utils/qiniu'

const useRecordStore = create((set, get) => ({
  recordings: {},
  loaded: false,
  uploading: {},

  // Load all recordings from IndexedDB on app start
  loadFromDB: async () => {
    if (get().loaded) return
    try {
      const map = await loadAllRecordings()
      set({ recordings: map, loaded: true })
    } catch (e) {
      console.error('Failed to load recordings from DB:', e)
      set({ loaded: true })
    }
  },

  addRecording: async (taskId, reqId, blob, duration = 0) => {
    const key = `${taskId}-${reqId}`
    const localUrl = URL.createObjectURL(blob)

    // Immediately available with local URL
    set((s) => ({
      recordings: {
        ...s.recordings,
        [key]: { blob, url: localUrl, remoteUrl: null, uploading: true, duration, timestamp: Date.now() },
      },
      uploading: { ...s.uploading, [key]: true },
    }))

    // Save to IndexedDB for offline persistence
    try {
      await saveRecording(key, blob, duration)
    } catch (e) {
      console.error('Failed to save recording to DB:', e)
    }

    // Upload to Qiniu
    try {
      const result = await uploadToQiniu(blob, taskId, reqId)
      if (result) {
        set((s) => ({
          recordings: {
            ...s.recordings,
            [key]: { ...s.recordings[key], remoteUrl: result.url, qiniuKey: result.key, uploading: false },
          },
          uploading: { ...s.uploading, [key]: false },
        }))
        console.log(`[Qiniu] Uploaded: ${result.url}`)
      } else {
        set((s) => ({
          recordings: {
            ...s.recordings,
            [key]: { ...s.recordings[key], uploading: false },
          },
          uploading: { ...s.uploading, [key]: false },
        }))
      }
    } catch (e) {
      console.error('[Qiniu] Upload failed:', e)
      set((s) => ({
        uploading: { ...s.uploading, [key]: false },
      }))
    }

    return localUrl
  },

  getRecording: (taskId, reqId) => {
    return get().recordings[`${taskId}-${reqId}`] || null
  },

  hasRecording: (taskId, reqId) => {
    return !!get().recordings[`${taskId}-${reqId}`]
  },

  isUploading: (taskId, reqId) => {
    return !!get().uploading[`${taskId}-${reqId}`]
  },
}))

export default useRecordStore
