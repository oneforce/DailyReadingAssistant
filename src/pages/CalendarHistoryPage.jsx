import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useEventStore from '../stores/eventStore'
import BackButton from '../components/BackButton'
export default function CalendarHistoryPage() {
  const navigate = useNavigate()
  const history = useTaskStore((s) => s.history) || {}
  
  const fetchEvents = useEventStore((s) => s.fetchEvents)
  const events = useEventStore((s) => s.events)
  const eventsPage = useEventStore((s) => s.eventsPage)
  const eventsTotalPages = useEventStore((s) => s.eventsTotalPages)
  const isLoadingEvents = useEventStore((s) => s.loading)
  
  // Very simple current month view
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0])
  const [eventFilter, setEventFilter] = useState('all') // 'all', 'normal', 'special'

  useEffect(() => {
    fetchEvents({ date: selectedDate, eventFilter }, 1, 15)
  }, [selectedDate, eventFilter, fetchEvents])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day) => {
    const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dStr)
  }

  const renderCalendarDays = () => {
    const cells = []
    
    // Empty cells before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
        cells.push(<div key={`empty-${i}`} style={{ padding: '10px' }}></div>)
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const hasData = history[dStr] && history[dStr].tasks.length > 0
      const isSelected = selectedDate === dStr
      const isToday = today.toISOString().split('T')[0] === dStr

      cells.push(
        <div 
          key={dStr} 
          onClick={() => handleDateClick(i)}
          style={{ 
            padding: '10px 5px', 
            textAlign: 'center', 
            cursor: 'pointer',
            borderRadius: '8px',
            background: isSelected ? '#3b82f6' : 'transparent',
            color: isSelected ? '#fff' : '#1e293b',
            border: isToday ? '1px solid #3b82f6' : '1px solid transparent',
            position: 'relative',
            fontWeight: isSelected || isToday ? '600' : '400'
          }}
        >
          {i}
          {hasData && !isSelected && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981', margin: '2px auto 0' }} />
          )}
          {hasData && isSelected && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', margin: '2px auto 0' }} />
          )}
        </div>
      )
    }

    return cells
  }

  const selectedData = history[selectedDate]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }} className="animate-fade-in">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <div style={{ width: 32, height: 32, background: '#f59e0b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>荣誉日历</h2>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '20px auto', padding: '0 16px' }}>
        
        {/* Calendar Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </div>
            <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {renderCalendarDays()}
          </div>
        </div>

        {/* Selected Day Stats */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', marginBottom: '16px' }}>
          {selectedDate} 的成就
        </h3>

        {!selectedData || selectedData.tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#e2e8f0', marginBottom: '10px' }}>nights_stay</span>
            <p>这一天没有学习记录～</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>阅读时长</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#2b9dee' }}>
                   {Math.floor(selectedData.totalMinutes)}<span style={{ fontSize:'14px', fontWeight:'500'}}> 分钟</span>
                </div>
              </div>
            </div>


             <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
               <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>✅ 完成任务 ({selectedData.tasks.length}个)</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {selectedData.tasks.map(taskId => (
                   <div key={taskId} style={{ fontSize: '14px', color: '#334155', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                      ID: {taskId}
                   </div>
                 ))}
               </div>
            </div>

          </div>
        )}

        {/* Detailed Event Logs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: 0 }}>
            行为轨迹记录
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['all', '全部'], ['normal', '普通'], ['special', '额外奖励']].map(([k, lbl]) => (
              <button key={k} onClick={() => setEventFilter(k)} style={{
                padding: '4px 12px', borderRadius: '14px', border: 'none',
                fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                background: eventFilter === k ? '#2b9dee' : '#f1f5f9',
                color: eventFilter === k ? '#fff' : '#64748b',
                transition: 'all 0.2s'
              }}>{lbl}</button>
            ))}
          </div>
        </div>
        
        {(() => {
          return isLoadingEvents ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>加载中...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>
              没有相关事件记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map((ev) => {
              const timeStr = new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              let icon = 'touch_app'
              let color = '#3b82f6'
              let bg = '#eff6ff'
              
              if (ev.eventType === 'special') {
                icon = 'star'
                color = '#f59e0b'
                bg = '#fef3c7'
              } else if (ev.eventType === 'recording') {
                icon = 'mic'
                color = '#10b981'
                bg = '#ecfdf5'
              }

              return (
                <div key={ev.id} style={{ 
                  display: 'flex', alignItems: 'flex-start', gap: '12px', 
                  background: '#fff', padding: '16px', borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', 
                    background: bg, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                        {ev.eventType === 'recording' ? '录音完成' : 
                         ev.eventType === 'click' ? '页面交互' : 
                         ev.eventType === 'special' ? '🌟 特殊成就' : '其他行为'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{timeStr}</span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                      {ev.eventType === 'recording' ? (
                        <>完成对 <b>{ev.page}</b> 的朗读任务，共计 <b>{ev.duration}秒</b></>
                      ) : ev.eventType === 'click' ? (
                        <>在 <b>{ev.page}</b> 触发交互：<i>{ev.action}</i></>
                      ) : (
                        <>{ev.specialReason || '达成一项神秘成就'}</>
                      )}
                    </div>
                    
                    {ev.recordingUrl && (
                      <div style={{ marginTop: '8px' }}>
                        <audio src={ev.recordingUrl} controls style={{ width: '100%', height: '32px' }} />
                      </div>
                    )}
                  </div>

                  {ev.pointsAwarded > 0 && (
                    <div style={{ 
                      padding: '4px 8px', borderRadius: '6px',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      color: '#fff', fontSize: '12px', fontWeight: 'bold',
                      flexShrink: 0, boxShadow: '0 2px 4px rgba(245,158,11,0.3)',
                      display: 'flex', alignItems: 'center', gap: '2px'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>stars</span>
                      +{ev.pointsAwarded}
                    </div>
                  )}
                </div>
              )
            })}

            {eventsPage < eventsTotalPages && (
              <button 
                onClick={() => fetchEvents({ date: selectedDate, eventFilter }, eventsPage + 1, 15)}
                style={{
                  margin: '10px auto', padding: '8px 24px', borderRadius: '20px',
                  background: '#f1f5f9', color: '#64748b', border: 'none',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s', width: 'fit-content'
                }}>
                {isLoadingEvents ? '加载中...' : '加载更多记录'}
              </button>
            )}
          </div>
          )
        })()}
      </main>
    </div>
  )
}
