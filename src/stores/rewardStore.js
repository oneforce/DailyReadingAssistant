import { create } from 'zustand'

const useRewardStore = create((set, get) => ({
  points: 12500,
  level: 25,
  title: '传奇战士',
  unlockedEquipment: 12,
  totalEquipment: 48,
  rank: 1402,
  xpProgress: 75,
  xpNeeded: 2500,

  equipment: [
    { id: 'eq1', name: '不屈者头盔', cost: 2400, rarity: '史诗级别', rarityColor: '#2b9dee', description: '由传说中的铁匠打造，能为佩戴者提供精神防御加成。', icon: '🛡️', owned: false },
    { id: 'eq2', name: '龙鳞重铠', cost: 8500, rarity: '传奇级别', rarityColor: '#f97316', description: '取自深渊之龙的背鳞，能够抵御绝大部分物理伤害。', icon: '🧥', owned: false },
    { id: 'eq3', name: '星辉法杖', cost: 1800, rarity: '稀有级别', rarityColor: '#a855f7', description: '顶部镶嵌了坠落之星，能将思绪转化为实质性的魔法能量。', icon: '✨', owned: true },
    { id: 'eq4', name: '月影坚盾', cost: 3600, rarity: '史诗级别', rarityColor: '#2b9dee', description: '如月光般轻盈却如山岳般坚固，甚至能反弹魔法投射物。', icon: '🛡️', owned: false },
    { id: 'eq5', name: '疾行之靴', cost: 900, rarity: '普通级别', rarityColor: '#64748b', description: '穿上它，你的脚步将像风一样轻盈，长途旅行也不再疲惫。', icon: '👟', owned: false },
  ],

  bossData: {
    name: '狂暴位元',
    level: 99,
    rarity: '狂暴级别',
    hp: 6500,
    maxHp: 10000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPewChFCnB_Xpao9VyyKxdXfd1Gyw3rTh1DD_jYf0OlawuShosk0W5O0BFLjIZEdhQyO4GuKYC9hHhaWHukIHKXhYzP4Vr8ptuN28pi46mkySARG61W96wIbzVkIyzbheIZBDfW2aIKztjO-iAajgFkP1C0uwU0KHl31hsIsHYT3-cGxKQgISLd4ztWvFIKPpuDd6c_0Y46uCQE7I9kzKYlj2H0aL9Y49sLXLlSNT3LM2sMBBEXtnQKryiLdCPiX-Ie-fbAW5Rh4VA',
    timeLeft: '2天 14小时',
  },

  playerStats: {
    readingPower: 2450,
    shieldEnergy: 1820,
    mathPower: 3100,
    languagePower: 1240,
    equipment: [
      { slot: '头盔', name: '逻辑头盔', icon: '🛡️' },
      { slot: '武器', name: '阅读之剑', icon: '⚔️' },
      { slot: '护盾', name: '自律盾', icon: '🛡️' },
    ],
  },

  redeemEquipment: (id) => {
    const eq = get().equipment.find((e) => e.id === id)
    if (!eq || eq.owned || get().points < eq.cost) return false
    set((s) => ({
      points: s.points - eq.cost,
      unlockedEquipment: s.unlockedEquipment + 1,
      equipment: s.equipment.map((e) => e.id === id ? { ...e, owned: true } : e),
    }))
    return true
  },

  attackBoss: (damage) => set((s) => ({
    bossData: {
      ...s.bossData,
      hp: Math.max(0, s.bossData.hp - damage),
    },
  })),
}))

export default useRewardStore
