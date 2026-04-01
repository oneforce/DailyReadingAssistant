import { create } from 'zustand'
import pb from '../utils/pb'

const useRecordStore = create((set, get) => ({
  recordings: {},
  loaded: false,
  uploading: {},

  // Load all recordings from PocketBase on app start
  loadFromDB: async () => {
    if (get().loaded) return
    try {
      const records = await pb.collection('recordings').getFullList();
      const map = {};
      records.forEach(r => {
         const key = `${r.taskId}-${r.subKey}`;
         const remoteUrl = pb.files.getUrl(r, r.audio);
         // Keep blob null for remote records, just use remoteUrl as the `url` for audio playback
         map[key] = { 
           url: remoteUrl, 
           remoteUrl, 
           duration: r.duration, 
           timestamp: new Date(r.updated).getTime() 
         }
      });
      set({ recordings: map, loaded: true })
    } catch (e) {
      console.error('Failed to load recordings from PB:', e)
      set({ loaded: true })
    }
  },

  addRecording: async (taskId, reqId, blob, duration = 0) => {
    const key = `${taskId}-${reqId}`
    const localUrl = URL.createObjectURL(blob)

    // Immediately available for UI feedback
    set((s) => ({
      recordings: {
        ...s.recordings,
        [key]: { blob, url: localUrl, remoteUrl: null, uploading: true, duration, timestamp: Date.now() },
      },
      uploading: { ...s.uploading, [key]: true },
    }))

    // Upload blob to PocketBase
    try {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('subKey', reqId);
      formData.append('duration', duration || 0);

      // WebM is default for browser MediaRecorder
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', blob, `${key}.${ext}`);

      // Optional: Check and remove existing record to prevent duplicates
      const existing = await pb.collection('recordings').getList(1, 1, { 
        filter: `taskId="${taskId}" && subKey="${reqId}"` 
      });
      if (existing.items.length > 0) {
        await pb.collection('recordings').delete(existing.items[0].id);
      }

      // Create new record
      const created = await pb.collection('recordings').create(formData);
      const pbUrl = pb.files.getUrl(created, created.audio);

      set((s) => ({
        recordings: {
          ...s.recordings,
          [key]: { ...s.recordings[key], remoteUrl: pbUrl, uploading: false },
        },
        uploading: { ...s.uploading, [key]: false },
      }))
    } catch (e) {
      console.error('Failed to upload recording to PB:', e)
      set((s) => ({ uploading: { ...s.uploading, [key]: false } }))
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
