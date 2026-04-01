import { create } from 'zustand'

const useUserStore = create((set) => ({
  user: {
    name: '小明',
    level: 5,
    title: 'Epic Explorer',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&hair=short16&backgroundColor=b6e3f4',
    totalPoints: 1240,
    readingMinutes: 25,
    xp: 7500,
    xpToNext: 10000,
  },
  addPoints: (pts) => set((s) => ({ user: { ...s.user, totalPoints: s.user.totalPoints + pts } })),
  addMinutes: (min) => set((s) => ({ user: { ...s.user, readingMinutes: s.user.readingMinutes + min } })),
  addXp: (xp) => set((s) => ({ user: { ...s.user, xp: Math.min(s.user.xp + xp, s.user.xpToNext) } })),
}))

export default useUserStore
