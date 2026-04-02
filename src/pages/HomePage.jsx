import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../stores/userStore'
import useTaskStore from '../stores/taskStore'
import useEventStore from '../stores/eventStore'
import useBookStore from '../stores/bookStore'

const taskRouteMap = {
  chinese_poem: '/task/poem/',
  chinese_text: '/task/textbook/',
  english_word: '/task/word/',
  english_sentence: '/task/sentence/',
  english_article: '/task/article/',
}

const TASK_TYPE_LABELS = {
  all: '全部',
  chinese_poem: '古诗',
  chinese_text: '语文课文',
  english_word: '英语单词',
  english_sentence: '英语句型',
  english_article: '英语文章',
}


function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return isToday ? `今天 ${hours}:${minutes}` : `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
}

export default function HomePage() {
  const user = useUserStore((s) => s.user)
  const books = useBookStore((s) => s.books)
  const allTasks = useTaskStore((s) => s.tasks)
  const tasks = useTaskStore((s) => s.getTodayTasks())
  const getCompletedCount = useTaskStore((s) => s.getCompletedCount)
  const getTotalCount = useTaskStore((s) => s.getTotalCount)
  const completedCount = getCompletedCount()
  const totalCount = getTotalCount()
  
  const navigate = useNavigate()
  const trackClick = useEventStore((s) => s.trackClick)

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'returned', 'completed'
  const [typeFilter, setTypeFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(5);
  const [activeBook, setActiveBook] = useState(null);
  const [isShelfCollapsed, setIsShelfCollapsed] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (activeBook && t.bookId !== activeBook.bookId && t.bookId !== activeBook.id) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter((t) => !t.completed && (!t.returnHistory || t.returnHistory.length === 0));
  const returnedTasks = filteredTasks.filter((t) => !t.completed && t.returnHistory && t.returnHistory.length > 0);
  const completedTasks = filteredTasks.filter((t) => t.completed).sort((a, b) => {
    // Sort by completion time descending (newest first)
    if (!a.completedAt) return 1;
    if (!b.completedAt) return -1;
    return new Date(b.completedAt) - new Date(a.completedAt);
  })

  // Determine current active list and slicing
  const pendingDisplayed = pendingTasks.slice(0, displayCount);
  
  const isToday = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString).toDateString() === new Date().toDateString();
  };
  
  const todayCompletedTasks = completedTasks.filter(t => isToday(t.completedAt));
  const historyCompletedTasks = completedTasks.filter(t => !isToday(t.completedAt));
  const historyDisplayed = historyCompletedTasks.slice(0, displayCount);

  const hasMore = activeTab === 'pending' 
    ? pendingTasks.length > displayCount 
    : historyCompletedTasks.length > displayCount;

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setDisplayCount(5) // Reset count on tab switch
    trackClick('HomePage', `Tab_${tab}`, 'tab_switch')
  }

  const renderTask = (task, isCompleted) => (
    <div key={task.taskId} onClick={() => {
      trackClick('HomePage', task.title, isCompleted ? 'review_task' : 'start_task')
      navigate(`${taskRouteMap[task.type]}${task.taskId}`)
    }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isCompleted ? 12 : 16, 
        background: '#fff', 
        borderRadius: isCompleted ? 12 : 16,
        boxShadow: isCompleted ? '0 1px 2px rgba(0,0,0,0.05)' : '0 4px 12px rgba(43,157,238,0.12)',
        border: isCompleted ? '1px solid #e2e8f0' : '2px solid rgba(43,157,238,0.2)',
        opacity: isCompleted ? 0.85 : 1,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompleted ? 12 : 16 }}>
        <div style={{
          width: isCompleted ? 44 : 56, 
          height: isCompleted ? 44 : 56, 
          background: isCompleted ? '#f1f5f9' : task.iconBg, 
          borderRadius: isCompleted ? 10 : 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isCompleted ? '#94a3b8' : task.iconColor,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: isCompleted ? 22 : 28 }}>{task.icon}</span>
        </div>
        <div>
          <p style={{ 
            margin: isCompleted ? '0 0 2px' : '0 0 4px', 
            fontWeight: isCompleted ? 600 : 700, 
            fontSize: isCompleted ? 14 : 15, 
            color: isCompleted ? '#475569' : 'inherit', 
            textDecoration: isCompleted ? 'line-through' : 'none' 
          }}>
            {task.title}
          </p>
          {isCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                  {formatTime(task.completedAt) || '已完成'}
                </p>
                <span style={{ 
                  background: task.reviewed ? 'linear-gradient(135deg, #d1fae5, #6ee7b7)' : 'linear-gradient(135deg, #fef3c7, #fcd34d)',
                  color: task.reviewed ? '#065f46' : '#92400e', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 2
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{task.reviewed ? 'verified' : 'pending'}</span>
                  {task.reviewed ? '已评审' : '待评审'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: task.type.startsWith('english') ? 'italic' : 'normal' }}>
                {task.subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompleted ? 8 : 12 }}>
        {!isCompleted ? (
          <>
            <span className="material-symbols-outlined" style={{ color: '#cbd5e1', fontSize: 24 }}>radio_button_unchecked</span>
            <button style={{
              padding: '8px 24px', background: '#2b9dee', color: '#fff',
              fontSize: 13, fontWeight: 900, borderRadius: 12, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(43,157,238,0.3)',
            }}>开始</button>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 20 }}>check_circle</span>
            <button style={{
              padding: '6px 16px', background: '#f1f5f9', color: '#64748b',
              fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer',
            }}>复习</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* User Welcome + Flame Points */}
      <section style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: 20,
        background: 'linear-gradient(135deg, rgba(43,157,238,0.15), rgba(43,157,238,0.05))',
        borderRadius: 24, marginBottom: 24, border: '1px solid rgba(43,157,238,0.1)',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            background: `center/cover no-repeat url(${user.avatar})`,
            border: '3px solid white',
          }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#2b9dee', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>欢迎回来！</p>
          <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>你好，{user.name}！</p>
          {completedCount > 0 && (
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              今日已完成 <span style={{ color: '#10b981', fontWeight: 800 }}>{completedCount}</span> 项任务
            </p>
          )}
        </div>
      </section>

      {/* Books Shelf */}
      {books.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div 
            onClick={() => setIsShelfCollapsed(!isShelfCollapsed)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '12px', padding: '0 4px', userSelect: 'none' }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>我的书架</h3>
            <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: 22, transition: 'transform 0.3s', transform: isShelfCollapsed ? 'rotate(180deg)' : 'rotate(0)' }}>
              expand_less
            </span>
          </div>
          
          <div className="hide-scroll-x" style={{ display: isShelfCollapsed ? 'none' : 'flex', gap: 16, overflowX: 'auto', width: '100%', paddingBottom: 8, msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <style dangerouslySetInnerHTML={{__html: `.hide-scroll-x::-webkit-scrollbar { display: none; }`}} />
            {books.map(b => {
               // Calculate progress: completed items in THIS book
               const bookTasks = allTasks.filter(t => t.bookId === b.bookId || t.bookId === b.id)
               const completedTasks = bookTasks.filter(t => t.completed)
               const bookCompleted = completedTasks.length
               const totalBookTasks = bookTasks.length || 1 // Avoid divide by zero
               const progressVal = Math.round((bookCompleted / totalBookTasks) * 100)
               
               const dates = completedTasks.map(t => new Date(t.completedAt).getTime()).filter(t => !isNaN(t))
               let lastOpenText = '尚未开始'
               if (dates.length > 0) {
                 const maxDate = new Date(Math.max(...dates))
                 const now = new Date()
                 const diffDays = Math.floor((now - maxDate) / (1000 * 60 * 60 * 24))
                 if (diffDays === 0) lastOpenText = '今天阅读过'
                 else if (diffDays === 1) lastOpenText = '昨天阅读过'
                 else lastOpenText = `${diffDays}天前阅读过`
               }
               
               const isSelected = activeBook?.id === b.id
               
               return (
                 <div key={b.id} onClick={() => setActiveBook(isSelected ? null : b)} style={{ 
                   minWidth: 116, maxWidth: 116, background: isSelected ? '#f8fafc' : '#fff',
                   borderRadius: '4px 12px 12px 4px', padding: '8px',
                   border: isSelected ? '2px solid #2b9dee' : '1px solid #e2e8f0', 
                   borderLeft: isSelected ? '6px solid #2b9dee' : '6px solid #cbd5e1',
                   boxShadow: isSelected ? '0 6px 16px rgba(43,157,238,0.2)' : '2px 4px 12px rgba(0,0,0,0.04)',
                   flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                   display: 'flex', flexDirection: 'column'
                 }}>
                    <div style={{ width: '100%', height: 136, borderRadius: 6, background: 'rgba(43,157,238,0.05)', color: '#2b9dee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 }}>
                       {b.cover?.startsWith('http') || b.cover?.startsWith('/') ? (
                          <img src={b.cover} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>{b.cover || 'book'}</span>
                       )}
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 12, fontWeight: 800, color: '#1e293b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{b.title}</h4>
                    
                    <div style={{ marginTop: 'auto' }}>
                      <p style={{ margin: '4px 0 6px', fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{lastOpenText}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>完成 {progressVal}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${progressVal}%`, height: '100%', background: '#10b981', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Type Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
        {['all', ...Array.from(new Set(tasks.map(t => t.type)))].map(t => (
          <button key={t} onClick={() => {
             trackClick('home', `filter_${t}`, 'switch_filter')
             setTypeFilter(t)
          }} style={{
            padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
            background: typeFilter === t ? '#1e293b' : '#f1f5f9',
            color: typeFilter === t ? '#fff' : '#64748b',
            border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {TASK_TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => handleTabChange('pending')}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '3px solid #2b9dee' : '3px solid transparent',
            color: activeTab === 'pending' ? '#2b9dee' : '#64748b',
            fontWeight: activeTab === 'pending' ? 800 : 700,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: -1,
            position: 'relative'
          }}>
          待完成任务
          {pendingTasks.length > 0 && (
            <span style={{ 
              background: activeTab === 'pending' ? 'rgba(43,157,238,0.1)' : '#f1f5f9',
              color: activeTab === 'pending' ? '#2b9dee' : '#94a3b8',
              marginLeft: 6, padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 800 
            }}>
              {pendingTasks.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => handleTabChange('returned')}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'returned' ? '3px solid #ef4444' : '3px solid transparent',
            color: activeTab === 'returned' ? '#ef4444' : '#64748b',
            fontWeight: activeTab === 'returned' ? 800 : 700,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: -1,
            position: 'relative'
          }}>
          被退回
          {returnedTasks.length > 0 && (
            <span style={{ 
              background: activeTab === 'returned' ? 'rgba(239,68,68,0.1)' : '#f1f5f9',
              color: activeTab === 'returned' ? '#ef4444' : '#94a3b8',
              marginLeft: 6, padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 800 
            }}>
              {returnedTasks.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => handleTabChange('completed')}
          style={{
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'completed' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'completed' ? '#10b981' : '#64748b',
            fontWeight: activeTab === 'completed' ? 800 : 700,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: -1,
            position: 'relative'
          }}>
          已完成
          {completedTasks.length > 0 && (
            <span style={{ 
              background: activeTab === 'completed' ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
              color: activeTab === 'completed' ? '#10b981' : '#94a3b8',
              marginLeft: 6, padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 800 
            }}>
              {completedTasks.length}
            </span>
          )}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {activeTab === 'pending' && pendingTasks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1', opacity: 0.8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 8 }}>
              celebration
            </span>
            <p style={{ margin: 0, color: '#64748b', fontSize: 15, fontWeight: 600 }}>
              太棒了！所有任务已完成 🎉
            </p>
          </div>
        )}
        
        {activeTab === 'completed' && completedTasks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1', opacity: 0.8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 8 }}>
              inventory_2
            </span>
            <p style={{ margin: 0, color: '#64748b', fontSize: 15, fontWeight: 600 }}>
              暂无已完成的任务
            </p>
          </div>
        )}

        {activeTab === 'returned' && returnedTasks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1', opacity: 0.8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 8 }}>
              check_circle
            </span>
            <p style={{ margin: 0, color: '#64748b', fontSize: 15, fontWeight: 600 }}>
              暂无被退回的任务
            </p>
          </div>
        )}

        {/* Pending tasks */}
        {activeTab === 'pending' && pendingDisplayed.map((task) => renderTask(task, false))}

        {/* Returned tasks */}
        {activeTab === 'returned' && returnedTasks.slice(0, displayCount).map((task) => renderTask(task, false))}

        {/* Completed tasks */}
        {activeTab === 'completed' && completedTasks.length > 0 && (
          <>
            {todayCompletedTasks.length > 0 && (
              <>
                <div style={{ padding: '0 4px', marginBottom: 4, marginTop: 4, fontSize: 14, fontWeight: 800, color: '#64748b' }}>今日完成</div>
                {todayCompletedTasks.map((task) => renderTask(task, true))}
              </>
            )}
            
            {historyCompletedTasks.length > 0 && (
              <>
                <div style={{ padding: '0 4px', marginBottom: 4, marginTop: todayCompletedTasks.length > 0 ? 16 : 4, fontSize: 14, fontWeight: 800, color: '#64748b' }}>历史完成</div>
                {historyDisplayed.map((task) => renderTask(task, true))}
              </>
            )}
          </>
        )}
      </div>

      {hasMore && (
        <button 
          onClick={() => { trackClick('HomePage', '加载更多', 'load_more'); setDisplayCount(prev => prev + 5) }}
          style={{
            width: '100%', padding: '14px', background: 'rgba(43,157,238,0.05)', color: '#2b9dee',
            borderRadius: 16, border: '1px dashed rgba(43,157,238,0.3)', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', marginBottom: 40, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
          加载更多任务
        </button>
      )}
      <div style={{ height: 40 }}></div>
    </div>
  )
}
