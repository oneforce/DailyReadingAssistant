import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../stores/userStore'
import useTaskStore from '../stores/taskStore'

const taskRouteMap = {
  chinese_poem: '/task/poem/',
  chinese_text: '/task/textbook/',
  english_word: '/task/word/',
  english_sentence: '/task/sentence/',
  english_article: '/task/article/',
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
  const tasks = useTaskStore((s) => s.getTodayTasks())
  const getCompletedCount = useTaskStore((s) => s.getCompletedCount)
  const getTotalCount = useTaskStore((s) => s.getTotalCount)
  const completedCount = getCompletedCount()
  const totalCount = getTotalCount()
  
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'returned', 'completed'
  const [displayCount, setDisplayCount] = useState(5);

  const pendingTasks = tasks.filter((t) => !t.completed && (!t.returnHistory || t.returnHistory.length === 0));
  const returnedTasks = tasks.filter((t) => !t.completed && t.returnHistory && t.returnHistory.length > 0);
  const completedTasks = tasks.filter((t) => t.completed).sort((a, b) => {
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
  }

  const renderTask = (task, isCompleted) => (
    <div key={task.taskId} onClick={() => navigate(`${taskRouteMap[task.type]}${task.taskId}`)}
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
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
            今日 {completedCount}/{totalCount} 项任务
          </p>
        </div>
      </section>
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
          onClick={() => setDisplayCount(prev => prev + 5)}
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
