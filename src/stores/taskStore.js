import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const sampleTasks = [
  {
    taskId: 'cn-poem-001',
    type: 'chinese_poem',
    title: '静夜思',
    subject: '语文',
    icon: 'brush',
    iconBg: '#fee2e2',
    iconColor: '#ef4444',
    subtitle: "Li Bai's Masterpiece",
    content: {
      text: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
      author: '李白',
      dynasty: '唐代',
      authorIntro: '李白（701-762），字太白，号青莲居士，是唐代伟大的浪漫主义诗人，被后人誉为"诗仙"。',
      translation: '床前洒满明亮的月光，地上好似铺了一层白霜。\n抬头仰望明月，低头思念故乡。',
    },
    difficulty: '中级',
    requirements: [
      { id: 'r1', label: '古诗朗读', type: 'recording', required: true },
      { id: 'r2', label: '翻译朗读', type: 'recording', required: true },
    ],
    reward: { points: 10, bonusCondition: '全部完成额外 +5' },
    completed: true,
    completedAt: '2026-03-17T09:30:00.000Z',
  },
  {
    taskId: 'en-word-001',
    type: 'english_word',
    title: '英语单词',
    subject: '英语',
    icon: 'translate',
    iconBg: '#dbeafe',
    iconColor: '#2b9dee',
    subtitle: '10/10 New Words',
    content: {
      words: [
        { word: 'Apple', phonetic: '/ˈæpl/', meaning: 'n. 苹果', partOfSpeech: '名词词形', plural: 'apples' },
        { word: 'Banana', phonetic: '/bəˈnænə/', meaning: 'n. 香蕉', partOfSpeech: '名词词形', plural: 'bananas' },
        { word: 'Orange', phonetic: '/ˈɔːrɪndʒ/', meaning: 'n. 橙子', partOfSpeech: '名词词形', plural: 'oranges' },
        { word: 'Grape', phonetic: '/ɡreɪp/', meaning: 'n. 葡萄', partOfSpeech: '名词词形', plural: 'grapes' },
        { word: 'Peach', phonetic: '/piːtʃ/', meaning: 'n. 桃子', partOfSpeech: '名词词形', plural: 'peaches' },
        { word: 'Melon', phonetic: '/ˈmelən/', meaning: 'n. 瓜', partOfSpeech: '名词词形', plural: 'melons' },
        { word: 'Cherry', phonetic: '/ˈtʃeri/', meaning: 'n. 樱桃', partOfSpeech: '名词词形', plural: 'cherries' },
        { word: 'Mango', phonetic: '/ˈmæŋɡoʊ/', meaning: 'n. 芒果', partOfSpeech: '名词词形', plural: 'mangoes' },
        { word: 'Lemon', phonetic: '/ˈlemən/', meaning: 'n. 柠檬', partOfSpeech: '名词词形', plural: 'lemons' },
        { word: 'Berry', phonetic: '/ˈberi/', meaning: 'n. 浆果', partOfSpeech: '名词词形', plural: 'berries' },
      ],
    },
    reward: { points: 15, bonusCondition: '全部完成额外 +10' },
    completed: true,
    completedAt: '2026-03-17T10:15:00.000Z',
  },
  {
    taskId: 'en-word-002',
    type: 'english_word',
    title: '英语动词',
    subject: '英语',
    icon: 'directions_run',
    iconBg: '#fce7f3',
    iconColor: '#ec4899',
    subtitle: '10/10 Action Words',
    content: {
      words: [
        { word: 'Run', phonetic: '/rʌn/', meaning: 'v. 跑', partOfSpeech: '不规则动词', pastTense: 'ran', pastParticiple: 'run' },
        { word: 'Eat', phonetic: '/iːt/', meaning: 'v. 吃', partOfSpeech: '不规则动词', pastTense: 'ate', pastParticiple: 'eaten' },
        { word: 'Go', phonetic: '/ɡoʊ/', meaning: 'v. 去', partOfSpeech: '不规则动词', pastTense: 'went', pastParticiple: 'gone' },
        { word: 'Write', phonetic: '/raɪt/', meaning: 'v. 写', partOfSpeech: '不规则动词', pastTense: 'wrote', pastParticiple: 'written' },
        { word: 'Speak', phonetic: '/spiːk/', meaning: 'v. 说', partOfSpeech: '不规则动词', pastTense: 'spoke', pastParticiple: 'spoken' },
        { word: 'Play', phonetic: '/pleɪ/', meaning: 'v. 玩耍', partOfSpeech: '规则动词', pastTense: 'played', pastParticiple: 'played' },
        { word: 'Study', phonetic: '/ˈstʌdi/', meaning: 'v. 学习', partOfSpeech: '规则动词', pastTense: 'studied', pastParticiple: 'studied' },
        { word: 'Watch', phonetic: '/wɑːtʃ/', meaning: 'v. 观看', partOfSpeech: '规则动词', pastTense: 'watched', pastParticiple: 'watched' },
        { word: 'Swim', phonetic: '/swɪm/', meaning: 'v. 游泳', partOfSpeech: '不规则动词', pastTense: 'swam', pastParticiple: 'swum' },
        { word: 'Drink', phonetic: '/drɪŋk/', meaning: 'v. 喝', partOfSpeech: '不规则动词', pastTense: 'drank', pastParticiple: 'drunk' },
      ],
    },
    completed: false,
  },
  {
    taskId: 'en-article-001',
    type: 'english_article',
    title: '英语长文',
    subject: '英语',
    icon: 'menu_book',
    iconBg: '#e0e7ff',
    iconColor: '#6366f1',
    subtitle: 'The Deep Sea Wonders',
    content: {
      title: 'The Magic Garden',
      text: `Once upon a time, in a hidden corner of the world, there existed a Magic Garden. This was no ordinary garden; the flowers hummed soft melodies, and the trees whispered secrets of old.

Every morning, the dew drops would sparkle like diamonds under the gentle sun. Children who visited the garden found that their laughter made the roses bloom brighter.

It was a place where imagination took flight and every breath felt like a dream come true. The air smelled of jasmine and honey, and the path beneath your feet felt as soft as velvet.

In the center of the garden stood an ancient oak tree with silver leaves that glowed in the twilight. It was said that if you told the tree your deepest wish, it would carry it to the stars on the wings of a firefly.`,
    },
    reward: { points: 20, bonusCondition: '全部完成额外 +15' },
    completed: false,
  },
  {
    taskId: 'cn-text-001',
    type: 'chinese_text',
    title: '课文朗读',
    subject: '语文',
    icon: 'auto_stories',
    iconBg: '#fef3c7',
    iconColor: '#f59e0b',
    subtitle: '《小英雄雨来》',
    content: {
      title: '小英雄雨来',
      type: '节选',
      author: '管桦',
      text: '晋察冀边区的北部有一条还乡河，河边有个小村庄。河里长着很多芦苇。雨来仰浮在水面上，露出个小脑袋，他在那里耍水呢。\n\n雨来最喜欢在还乡河里游泳。他不仅会狗刨，还会扎猛子。他在水里憋气，能憋好半天。他钻进水里，过了一会儿，就在十几丈远的地方露出了脑袋。他的游泳技术在村子里是数一数二的。\n\n秋天，庄稼收割完了，还乡河的水也变得冰冷。雨来依然每天到河里去。妈妈总是在岸上喊："雨来，别耍啦，快回来！"雨来总是调皮地笑着，把头一扎，又钻进水底去了。\n\n有一天，雨来正在屋里读书，忽然听见外面传来嘈杂的声音。他推开窗户往外看，只见一群日本兵气势汹汹地冲进了村子。雨来的爸爸还没回来，妈妈去邻居家了。他想起爸爸曾经说过，鬼子杀人不眨眼，一定要机灵点。\n\n雨来赶忙把书藏在怀里，轻手轻脚地从后窗翻了出去，钻进了那片熟悉的芦苇丛。芦苇长得密密层层的，那是他最好的屏障。他潜入水中，只露出一根细小的芦管用来呼吸，静静地观察着岸上的动静...',
      totalReadCount: 3,
    },
    reward: { points: 25, bonusCondition: '3遍全读完 +20' },
    completed: false,
  },
  {
    taskId: 'cn-text-002',
    type: 'chinese_text',
    title: '课文朗读',
    subject: '语文',
    icon: 'auto_stories',
    iconBg: '#fef3c7',
    iconColor: '#f59e0b',
    subtitle: '《草船借箭》',
    content: {
      title: '草船借箭',
      type: '节选',
      author: '罗贯中',
      text: '周瑜看到诸葛亮挺有才干，心里很妒忌。\n\n有一天，周瑜请诸葛亮商议军事，说："我们就要跟曹军交战。水上交战，用什么兵器最好？"诸葛亮说："用弓箭最好。"周瑜说："对，先生跟我想的一样。现在军中缺箭，想请先生负责赶造十万支。这是公事，希望先生不要推却。"诸葛亮说："都督委托，当然照办。不知道这十万支箭什么时候用？"周瑜问："十天造得好吗？"诸葛亮说："既然就要交战，十天造好，必然误了大事。"周瑜问："先生预计几天可以造好？"诸葛亮说："只要三天。"周瑜说："军情紧急，可不能开玩笑。"诸葛亮说："怎么敢跟都督开玩笑？我愿意立下军令状，三天造不好，甘受惩罚。"周瑜很高兴，叫诸葛亮当面立下军令状。又摆了酒席招待他。\n\n诸葛亮说："今天来不及了。从明天起，到第三天，请派五百个军士到江边来搬箭。"诸葛亮喝了几杯酒就走了。\n\n鲁肃对周瑜说："十万支箭，三天怎么造得成呢？诸葛亮说的是假话吧？"周瑜说："是他自己说的，我可没逼他。我得吩咐军匠们，叫他们故意延迟，造箭用的材料不给他准备齐全。到时候造不成，定他的罪，他就没话可说了。你去探听探听，看他怎么打算，回来报告我。"\n\n鲁肃见了诸葛亮。诸葛亮说："三天之内要造十万支箭，得请你帮帮我的忙。"鲁肃说："都是你自己找的，我怎么帮得了你的忙？"诸葛亮说："你借给我二十条船，每条船上要三十名军士。船用青布幔子遮起来，还要一千多个草把子，排在船的两边。我自有妙用。第三天管保有十万支箭。不过不能让都督知道。他要是知道了，我的计划就完了。"\n\n鲁肃答应了。他不知道诸葛亮借船有什么用，回来报告周瑜，果然不提借船的事，只说诸葛亮不用竹子、翎毛、胶漆这些材料。周瑜疑惑起来，说："到了第三天，看他怎么办！"\n\n鲁肃私自拨了二十条快船，每条船上配三十名军士，照诸葛亮说的，布置好青布幔子和草把子。等诸葛亮调度。\n\n第一天，不见诸葛亮有什么动静；第二天，仍然不见诸葛亮有什么动静。直到第三天四更时候，诸葛亮秘密地把鲁肃请到船里。鲁肃问他："你叫我来做什么？"诸葛亮说："请你一起去取箭。"鲁肃惊讶地说："到哪里去取？"诸葛亮说："不用问，去了就知道。"诸葛亮吩咐把二十条船用绳索连接起来，朝北岸开去。\n\n这时候大雾漫天，江上连面对面都看不清。天还没亮，船已经靠近曹军的水寨。诸葛亮下令把船尾朝东，一字摆开，又叫船上的军士一边擂鼓，一边大声呐喊。鲁肃吃惊地说："如果曹兵出来，怎么办？"诸葛亮笑着说："雾这样大，曹操一定不敢派兵出来。我们只管饮酒取乐，天亮了就回去。"\n\n曹操听到鼓声和呐喊声，就下令说："江上雾很大，敌人忽然来攻，我们看不清虚实，不要轻易出动。只叫弓弩手朝他们射箭，不让他们近前。"他派人去旱寨调来六千名弓弩手，到江边支援水军。一万多名弓弩手一齐朝江中放箭，箭好像下雨一样。诸葛亮又下令把船掉过来，船头朝东，船尾朝西，仍旧擂鼓呐喊，逼近曹军水寨去受箭。\n\n天渐渐亮了，雾还没有散。这时候，船两边的草把子上都插满了箭。诸葛亮吩咐军士们齐声高喊："谢谢曹丞相的箭！"接着叫二十条船驶回南岸。曹操知道上了当，可是这边的船顺风顺水，已经驶出二十多里，要追也来不及了。\n\n二十条船靠了岸,周瑜派来的五百个军士正好来到江边搬箭。每条船大约有五六千支箭，二十条船总共有十万多支。鲁肃见了周瑜，告诉他借箭的经过。周瑜长叹一声，说："诸葛亮神机妙算，我真比不上他！"',
      totalReadCount: 2,
    },
    reward: { points: 30, bonusCondition: '全文流畅 +10' },
    completed: false,
  },
  {
    taskId: 'en-sentence-001',
    type: 'english_sentence',
    title: '英语单句',
    subject: '英语',
    icon: 'record_voice_over',
    iconBg: '#d1fae5',
    iconColor: '#10b981',
    subtitle: '5 Sentences Practice',
    content: {
      sentences: [
        { text: 'How are you today?', phonetic: '[haʊ ɑːr juː təˈdeɪ]', translation: '你今天好吗？', score: 98, recorded: true },
        { text: 'I love reading books.', phonetic: '[aɪ lʌv ˈriːdɪŋ bʊks]', translation: '我喜欢读书。', score: 85, recorded: true },
        { text: 'The weather is nice.', phonetic: '[ðə ˈweðər ɪz naɪs]', translation: '天气很好。', score: null, recorded: false },
        { text: 'See you later!', phonetic: '[siː juː ˈleɪtər]', translation: '待会见！', score: null, recorded: false },
        { text: 'Good morning, teacher!', phonetic: '[ɡʊd ˈmɔːrnɪŋ ˈtiːtʃər]', translation: '老师早上好！', score: null, recorded: false },
        { text: 'Although the weather was extremely cold and the wind was blowing fiercely through the narrow streets, the brave little girl continued walking towards the old library at the end of the village.', phonetic: '', translation: '尽管天气极其寒冷，狂风在狭窄的街道上猛烈地吹着，那个勇敢的小女孩继续朝着村子尽头的旧图书馆走去。', score: null, recorded: false },
      ],
    },
    reward: { points: 12, bonusCondition: '全部90分以上 +8' },
    completed: false,
  },
]

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: sampleTasks.map(t => ({ ...t, reviewed: false })),
      getTodayTasks: () => get().tasks,
      getTaskById: (id) => get().tasks.find((t) => t.taskId === id),
      // Daily task limits (configurable in settings)
      dailyLimits: { maxPerType: 2, maxDailyTasks: 6 },
      setDailyLimits: (limits) => set({ dailyLimits: { ...get().dailyLimits, ...limits } }),

      // Check if a task type can still be added today
      canCompleteTaskType: (type) => {
        const s = get()
        const today = new Date().toISOString().split('T')[0]
        const todayCompleted = s.tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === today)
        const typeCount = todayCompleted.filter(t => t.type === type).length
        const totalCount = todayCompleted.length
        return typeCount < s.dailyLimits.maxPerType && totalCount < s.dailyLimits.maxDailyTasks
      },

      // Get today's completed task count
      getTodayCompletedCount: () => {
        const s = get()
        const today = new Date().toISOString().split('T')[0]
        return s.tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === today).length
      },

      completeTask: (id, duration = 0) => set((s) => {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toTimeString().slice(0, 5) // HH:MM
        
        const isEarly = timeStr >= s.earlyReadingConfig.start && timeStr <= s.earlyReadingConfig.end
        const durationMins = duration / 60
        
        // Update History Object
        const hList = { ...s.history }
        if (!hList[dateStr]) {
          hList[dateStr] = { 
            totalMinutes: 0, earlyMinutes: 0, tasks: [], 
            uniqueMedals: []
          }
        }
        
        hList[dateStr].totalMinutes += durationMins
        if (isEarly) hList[dateStr].earlyMinutes += durationMins
        if (!hList[dateStr].tasks.includes(id)) hList[dateStr].tasks.push(id)

        // Award progressive task bonus medal
        const todayCompletedCount = hList[dateStr].tasks.length
        const maxMedals = 5
        const bonusMedalKey = `TaskBonus-${todayCompletedCount}`
        if (todayCompletedCount <= maxMedals && !hList[dateStr].uniqueMedals.includes(bonusMedalKey)) {
          hList[dateStr].uniqueMedals.push(bonusMedalKey)
        }
        
        // Check for Daily Combo (Chinese + English Task completion)
        const todayTasks = s.tasks.map(t => t.taskId === id ? { ...t, completed: true } : t)
            .filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === dateStr || t.taskId === id);
        const hasChinese = todayTasks.some(t => t.type.startsWith('chinese'));
        const hasEnglish = todayTasks.some(t => t.type.startsWith('english'));
        
        if (hasChinese && hasEnglish && !hList[dateStr].uniqueMedals.includes('Daily-Combo')) {
            hList[dateStr].uniqueMedals.push('Daily-Combo');
        }

        // Streak Update (if today is a new active day)
        let newStreak = { ...s.streak }
        if (newStreak.lastActiveDate !== dateStr) {
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          
          if (newStreak.lastActiveDate !== yesterdayStr && newStreak.lastActiveDate !== null) {
            newStreak.currentDays = 0
            newStreak.currentEarlyDays = 0
          }
          
          newStreak.currentDays += 1
          if (isEarly) newStreak.currentEarlyDays += 1
          newStreak.lastActiveDate = dateStr
        }
        
        return {
          tasks: s.tasks.map((t) => t.taskId === id ? { ...t, completed: true, completedAt: now.toISOString(), completedDuration: duration } : t),
          history: hList,
          streak: newStreak
        }
      }),
  // Get total completed tasks count
  getCompletedCount: () => get().tasks.filter((t) => t.completed).length,
  getTotalCount: () => get().tasks.length,

  getAllMedals: () => {
    const s = get();
    const history = s.history;
    const dates = Object.keys(history).sort();
    
    let allMedals = [];
    
    dates.forEach(date => {
        const dayData = history[date];
        const isTodayStr = new Date().toISOString().split('T')[0];
        const isToday = date === isTodayStr;
        
        if (isToday) {
            // "Today's Medals" = the actual tasks completed today
            const todayTasks = s.tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === isTodayStr);
            todayTasks.forEach(t => {
                allMedals.push({
                   id: `task-${t.taskId}`,
                   name: t.title,
                   icon: t.icon,
                   bgColor: t.iconBg,
                   color: t.iconColor,
                   border: t.iconColor,
                   date,
                   isToday,
                   reviewed: t.reviewed,
                   type: 'task'
                });
            });
            // Still push today's streak/unique medals, but they act like normal historical medals (reviewed = true)
            (dayData.uniqueMedals || []).forEach(m => {
                allMedals.push({ id: `${date}-${m}`, name: m, date, isToday: false, reviewed: true, type: 'unique' });
            });
        } else {
            (dayData.uniqueMedals || []).forEach(m => {
                allMedals.push({ id: `${date}-${m}`, name: m, date, isToday, reviewed: true, type: 'unique' });
            });
        }
    });
    
    return allMedals.reverse();
  },

  // Speed Evaluation Config (Default: 100 words per 100 seconds)
  speedConfig: { words: 100, seconds: 100 },
  setSpeedConfig: (config) => set({ speedConfig: config }),
  
  // Early Reading Config (Default: 06:30 - 07:30)
  earlyReadingConfig: { start: '06:30', end: '07:30' },
  setEarlyReadingConfig: (config) => set({ earlyReadingConfig: config }),

  // TTS Engine Config (default: 'browser' or 'youdao')
  ttsEngine: 'browser',
  setTtsEngine: (engine) => set({ ttsEngine: engine }),

  // History Data
  // Struct: { [dateString]: { totalMinutes: number, earlyMinutes: number, tasks: [], dailyMedals: [], uniqueMedals: [], points: number, bonus: number } }
  history: {}, 

  // Track Streak Data
  streak: {
    currentDays: 0,
    currentEarlyDays: 0,
    lastActiveDate: null,
  },

  // Parent review: Set star rating (1-5) 
  reviewTask: (id) => set((s) => {
    return {
      tasks: s.tasks.map((t) => t.taskId === id ? { ...t, reviewed: true } : t),
    }
  }),

      // Recalculate historically the 3/5/8 day streak rewards
  generateHistoricalStreakRewards: () => set((s) => {
    const dates = Object.keys(s.history).sort();
    
    let currentDays = 0;
    let currentEarlyDays = 0;
    let lastActiveDate = null;
    let lastEarlyDate = null;

    const availableStreaks = [3, 5, 8, 15, 30, 100];

    const newHistory = { ...s.history };

    dates.forEach(d => {
       if (newHistory[d].uniqueMedals) {
           newHistory[d].uniqueMedals = newHistory[d].uniqueMedals.filter(m => !m.includes('Streak') && m !== 'Daily-Combo');
       } else {
           newHistory[d].uniqueMedals = [];
       }
    });

    dates.forEach(dateStr => {
      const dayData = newHistory[dateStr];
      const dayTasks = dayData.tasks.map(tid => s.tasks.find(t => t.taskId === tid)).filter(Boolean);
      
      const hasChinese = dayTasks.some(t => t.type.startsWith('chinese') && t.reviewed);
      const hasEnglish = dayTasks.some(t => t.type.startsWith('english') && t.reviewed);
      
      const isValidDay = hasChinese && hasEnglish;
      const isValidEarlyDay = isValidDay && dayData.earlyMinutes > 0;
      
      if (isValidDay && !dayData.uniqueMedals.includes('Daily-Combo')) {
          dayData.uniqueMedals.push('Daily-Combo');
      }

      if (isValidDay) {
        if (lastActiveDate) {
          const expectedNext = new Date(lastActiveDate);
          expectedNext.setDate(expectedNext.getDate() + 1);
          if (expectedNext.toISOString().split('T')[0] === dateStr) {
            currentDays++;
          } else {
            currentDays = 1;
          }
        } else {
          currentDays = 1;
        }
        lastActiveDate = dateStr;

        if (availableStreaks.includes(currentDays)) {
          dayData.uniqueMedals.push(`Streak-${currentDays}d`);
        }
      }

      if (isValidEarlyDay) {
         if (lastEarlyDate) {
            const expectedNext = new Date(lastEarlyDate);
            expectedNext.setDate(expectedNext.getDate() + 1);
            if (expectedNext.toISOString().split('T')[0] === dateStr) {
              currentEarlyDays++;
            } else {
              currentEarlyDays = 1;
            }
         } else {
            currentEarlyDays = 1;
         }
         lastEarlyDate = dateStr;

         if (availableStreaks.includes(currentEarlyDays)) {
           dayData.uniqueMedals.push(`EarlyStreak-${currentEarlyDays}d`);
         }
      }
    });

    return {
      history: newHistory,
      streak: {
        currentDays,
        currentEarlyDays,
        lastActiveDate,
        lastEarlyDate: lastEarlyDate || null
      }
    };
  }),

  // Inject mock 3 days of historical records for testing
  injectMock3DayStreak: () => {
    set((s) => {
      const today = new Date();
      const history = { ...s.history };
      
      const cnTask = s.tasks.find(t => t.type === 'chinese_text');
      const enTask = s.tasks.find(t => t.type === 'english_article' || t.type === 'english_sentence');
      
      if (!cnTask || !enTask) return s;
      
      const tasks = s.tasks.map(t => {
        if (t.taskId === cnTask.taskId || t.taskId === enTask.taskId) {
          return { ...t, completed: true, reviewed: true };
        }
        return t;
      });

      for (let i = 3; i >= 1; i--) {
         const d = new Date(today);
         d.setDate(d.getDate() - i);
         const dateStr = d.toISOString().split('T')[0];
         
         history[dateStr] = {
           totalMinutes: 15,
           earlyMinutes: 15,
           tasks: [cnTask.taskId, enTask.taskId],
           dailyMedals: ['Daily-10m'],
           uniqueMedals: []
         };
      }
      
      return { history, tasks };
    });
    get().generateHistoricalStreakRewards();
  },

  // Return task: Move task back to pending, save current attempt to history
  returnTask: (id) => set((s) => {
    return {
      tasks: s.tasks.map((t) => {
        if (t.taskId === id) {
          // create a history record of this attempt
          const historyRecord = {
            completedAt: t.completedAt,
            completedDuration: t.completedDuration,
            returnedAt: new Date().toISOString(),
          }
          return {
            ...t,
            completed: false,
            completedAt: null,
            completedDuration: 0,
            reviewed: false,
            returnHistory: [...(t.returnHistory || []), historyRecord]
          }
        }
        return t
      })
    }
  }),
      // Course Management
      importTasks: (newTasks) => set((s) => {
        const tasksToAdd = Array.isArray(newTasks) ? newTasks : [newTasks]
        const currentTasks = [...s.tasks]
        
        tasksToAdd.forEach(newTask => {
          // Initialize required fields if missing
          const taskObj = { 
            ...newTask, 
            completed: newTask.completed || false,
            completedAt: newTask.completedAt || null,
            completedDuration: newTask.completedDuration || 0,
            reviewed: newTask.reviewed || false,
            returnHistory: newTask.returnHistory || []
          }
          
          const existingIndex = currentTasks.findIndex(t => t.taskId === newTask.taskId)
          if (existingIndex !== -1) {
            // Overwrite existing task
            currentTasks[existingIndex] = taskObj
          } else {
            // Append new task
            currentTasks.push(taskObj)
          }
        })
        return { tasks: currentTasks }
      }),
      deleteTask: (id) => set((s) => ({
        tasks: s.tasks.filter((t) => t.taskId !== id)
      })),
      clearAllTasks: () => set(() => ({ tasks: [] })),
    }),
    {
      name: 'daily-reading-tasks',
    }
  )
)

export default useTaskStore
