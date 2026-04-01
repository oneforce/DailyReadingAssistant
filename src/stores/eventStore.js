import { create } from 'zustand'
import pb from '../utils/pb'

// Daily normal-points cap tracker (localStorage)
function getTodayKey() {
  return `event_pts_${new Date().toISOString().slice(0, 10)}`
}

function getTodayNormalPoints() {
  try {
    return parseInt(localStorage.getItem(getTodayKey()) || '0', 10)
  } catch { return 0 }
}

function setTodayNormalPoints(val) {
  try { localStorage.setItem(getTodayKey(), String(val)) } catch { }
}

const useEventStore = create((set, get) => ({
  events: [],
  eventsPage: 1,
  eventsTotalPages: 1,
  loading: false,
  pendingReward: null, // { amount: 10 | 100, type: 'normal' | 'special' }

  clearReward: () => set({ pendingReward: null }),

  // ========== Core: track a click event ==========
  trackClick: async (page, target, action) => {
    const now = new Date()
    const eventData = {
      eventType: 'click',
      page,
      target,
      action,
      taskId: '',
      recordingUrl: '',
      startTime: now.toISOString(),
      duration: 0,
      isSpecial: false,
      specialReason: '',
      pointsAwarded: 0,
    }

    // Roll for normal reward
    const points = get()._rollNormalReward()
    if (points > 0) {
      eventData.pointsAwarded = points
    }

    try {
      await pb.collection('events').create(eventData)
    } catch (e) {
      console.warn('Event tracking failed:', e)
    }
  },

  // ========== Core: track a recording event ==========
  trackRecording: async (taskId, page, startTime, duration, recordingUrl) => {
    const now = new Date(startTime)
    const hour = now.getHours()
    const isEarlyBird = hour === 7 && duration > 60
    const isLongRecording = duration > 300
    const isSpecial = isEarlyBird || isLongRecording

    const specialReason = isEarlyBird ? 'early_bird' : isLongRecording ? 'long_recording' : ''

    const eventData = {
      eventType: isSpecial ? 'special' : 'recording',
      page,
      target: 'recording',
      action: 'record_complete',
      taskId: taskId || '',
      recordingUrl: recordingUrl || '',
      startTime: now.toISOString(),
      duration: Math.round(duration),
      isSpecial,
      specialReason,
      pointsAwarded: 0,
    }

    // Roll for reward
    if (isSpecial) {
      const points = get()._rollSpecialReward()
      if (points > 0) eventData.pointsAwarded = points
    } else {
      const points = get()._rollNormalReward()
      if (points > 0) eventData.pointsAwarded = points
    }

    try {
      await pb.collection('events').create(eventData)
    } catch (e) {
      console.warn('Recording event tracking failed:', e)
    }
  },

  // ========== Core: track a task completion event ==========
  trackTaskCompletion: async (taskId, page) => {
    const now = new Date()
    const eventData = {
      eventType: 'special',
      page: page || 'Tasks',
      target: 'task',
      action: 'complete',
      taskId: taskId || '',
      recordingUrl: '',
      startTime: now.toISOString(),
      duration: 0,
      isSpecial: true,
      specialReason: '完成一项学习任务',
      pointsAwarded: 10,
    }

    // Always reward 10 points for completing a task
    set({ pendingReward: { amount: 10, type: 'special' } })

    try {
      await pb.collection('events').create(eventData)
    } catch (e) {
      console.warn('Task completion event tracking failed:', e)
    }
  },

  // ========== Reward rolling logic ==========
  _rollNormalReward: () => {
    const todayPts = getTodayNormalPoints()
    if (todayPts >= 100) return 0 // daily cap reached

    const roll = Math.random()
    if (roll < 0.01) { // 100% chance (Temporary for testing)
      const newTotal = todayPts + 10
      setTodayNormalPoints(newTotal)
      set({ pendingReward: { amount: 10, type: 'normal' } })
      return 10
    }
    return 0
  },

  _rollSpecialReward: () => {
    const roll = Math.random()
    if (roll < 0.20) { // 20% chance
      set({ pendingReward: { amount: 100, type: 'special' } })
      return 100
    }
    return 0
  },

  // ========== Fetch events for display ==========
  fetchEvents: async (filters = {}, pageNum = 1, limit = 15) => {
    set({ loading: pageNum === 1 })
    try {
      const filterParts = []
      
      if (filters.date) {
        // Filter for a specific day
        const dayStart = `${filters.date} 00:00:00`
        const dayEnd = `${filters.date} 23:59:59`
        filterParts.push(`startTime>="${dayStart}" && startTime<="${dayEnd}"`)
      }

      if (filters.eventFilter === 'special') {
        filterParts.push(`(isSpecial=true || eventType="special")`)
      } else if (filters.eventFilter === 'normal') {
        filterParts.push(`(isSpecial=false && eventType!="special")`)
      }

      const filterStr = filterParts.join(' && ')

      const result = await pb.collection('events').getList(pageNum, limit, {
        filter: filterStr || undefined,
        sort: '-startTime',
      })

      set((state) => ({ 
        events: pageNum === 1 ? result.items : [...state.events, ...result.items],
        eventsPage: result.page,
        eventsTotalPages: result.totalPages,
        loading: false 
      }))
      return result.items
    } catch (e) {
      console.warn('Failed to fetch events:', e)
      set({ loading: false })
      return []
    }
  },

  // ========== Stats for a given day ==========
  getDayStats: (events) => {
    const totalEvents = events.length
    const totalPoints = events.reduce((sum, e) => sum + (e.pointsAwarded || 0), 0)
    const specialCount = events.filter(e => e.isSpecial).length
    const recordingCount = events.filter(e => e.eventType === 'recording' || e.eventType === 'special').length
    const clickCount = events.filter(e => e.eventType === 'click').length
    return { totalEvents, totalPoints, specialCount, recordingCount, clickCount }
  },
}))

export default useEventStore
