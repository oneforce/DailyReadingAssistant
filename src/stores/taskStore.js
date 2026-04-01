import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import pb from '../utils/pb'
import useEventStore from './eventStore'

const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      
      // Data fetching
      fetchTasks: async () => {
        try {
          const records = await pb.collection('tasks').getFullList();
          // Ensure structure is clean for frontend mapped logic
          set({ tasks: records.map(r => ({ ...r, reviewed: r.reviewed || false })) });
        } catch (e) {
          console.error('Failed to fetch tasks from PocketBase', e);
        }
      },
      
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

      completeTask: async (id, duration = 0) => {
        const s = get()
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
        
        // Instantly update UI locally
        set({
          tasks: s.tasks.map((t) => t.taskId === id ? { ...t, completed: true, completedAt: now.toISOString(), completedDuration: duration } : t),
          history: hList,
          streak: newStreak
        })

        // Track special event: Task Completion
        try {
          useEventStore.getState().trackTaskCompletion(id, '任务处理')
        } catch (e) {
          console.warn('Silent failure tracking task completion event', e)
        }

        // Remote Sync to pocketbase
        try {
          const taskObj = get().tasks.find(t => t.taskId === id);
          if (taskObj && taskObj.id) {
            await pb.collection('tasks').update(taskObj.id, {
              completed: true,
              completedAt: now.toISOString(),
              completedDuration: duration
            });
          }
        } catch (e) {
          console.error('Failed to sync completeTask to server:', e);
        }
      },
      
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

      // Parent review (Assume local for now unless synced to PB)
      reviewTask: async (id) => {
         set((s) => ({ tasks: s.tasks.map((t) => t.taskId === id ? { ...t, reviewed: true } : t) }))
         
         const taskObj = get().tasks.find((t) => t.taskId === id);
         if (taskObj && taskObj.id) {
           try {
             await pb.collection('tasks').update(taskObj.id, { reviewed: true });
           } catch(e) {}
         }
      },

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
      returnTask: async (id) => {
        const s = get();
        const taskObj = s.tasks.find((t) => t.taskId === id);
        if(!taskObj) return;

        const historyRecord = {
          completedAt: taskObj.completedAt,
          completedDuration: taskObj.completedDuration,
          returnedAt: new Date().toISOString(),
        }

        const updatedHistory = [...(taskObj.returnHistory || []), historyRecord];

        set({
          tasks: s.tasks.map((t) => {
            if (t.taskId === id) {
              return {
                ...t,
                completed: false,
                completedAt: null,
                completedDuration: 0,
                reviewed: false,
                returnHistory: updatedHistory,
              }
            }
            return t
          })
        });

        // Sync to remote PocketBase
        try {
          if (taskObj.id) {
            await pb.collection('tasks').update(taskObj.id, {
              completed: false,
              completedAt: null,
              completedDuration: 0,
              reviewed: false,
              returnHistory: updatedHistory,
            });
          }
        } catch (e) {
          console.error("Failed to sync returnTask to server", e);
        }
      },
      
      // Course Management - Import Tasks
      importTasks: async (newTasks) => {
        const tasksToAdd = Array.isArray(newTasks) ? newTasks : [newTasks]
        const currentTasks = [...get().tasks]
        
        for (let newTask of tasksToAdd) {
          const pbPayload = { 
            taskId: newTask.taskId,
            type: newTask.type,
            title: newTask.title,
            subject: newTask.subject,
            icon: newTask.icon,
            iconBg: newTask.iconBg,
            iconColor: newTask.iconColor,
            subtitle: newTask.subtitle,
            content: newTask.content || {},
            difficulty: newTask.difficulty || '',
            requirements: newTask.requirements || [],
            completed: newTask.completed || false,
            completedAt: newTask.completedAt || null,
            completedDuration: newTask.completedDuration || 0,
            reviewed: newTask.reviewed || false,
            returnHistory: newTask.returnHistory || []
          }
          
          const existingIndex = currentTasks.findIndex(t => t.taskId === newTask.taskId)
          try {
            if (existingIndex !== -1) {
              // Update existing remote task
              const remoteMatched = currentTasks[existingIndex];
              if (remoteMatched.id) {
                const updated = await pb.collection('tasks').update(remoteMatched.id, pbPayload);
                currentTasks[existingIndex] = updated;
              }
            } else {
              // Create new remote task
              const created = await pb.collection('tasks').create(pbPayload);
              currentTasks.push(created);
            }
          } catch(e) {
            console.error('Import Task Error', e)
          }
        }
        
        set({ tasks: currentTasks })
      },

      deleteTask: async (id) => {
        const s = get();
        const taskObj = s.tasks.find(t => t.taskId === id);
        if (taskObj && taskObj.id) {
           try {
              await pb.collection('tasks').delete(taskObj.id);
           } catch(e) { console.error('Delete Task Error', e) }
        }
        set({ tasks: s.tasks.filter((t) => t.taskId !== id) })
      },

      clearAllTasks: async () => {
        const s = get();
        try {
          for (let taskObj of s.tasks) {
            if (taskObj.id) await pb.collection('tasks').delete(taskObj.id);
          }
        } catch(e) { console.error('Clear Tasks Error', e) }
        set(() => ({ tasks: [] }));
      },
      
    }),
    {
      name: 'daily-reading-tasks-v3', // bump persistence name to start fresh cache
      partialize: (state) => ({ 
        history: state.history, 
        streak: state.streak, 
        dailyLimits: state.dailyLimits, 
        speedConfig: state.speedConfig, 
        earlyReadingConfig: state.earlyReadingConfig, 
        ttsEngine: state.ttsEngine 
      }), // ONLY persist config and user settings locally. 'tasks' is exclusively fetched from PocketBase.
    }
  )
)

export default useTaskStore
