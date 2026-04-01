import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useRecordStore from '../stores/recordStore'
import BackButton from '../components/BackButton'
const taskRouteMap = {
  chinese_poem: '/task/poem/',
  chinese_text: '/task/textbook/',
  english_word: '/task/word/',
  english_sentence: '/task/sentence/',
  english_article: '/task/article/',
}

export default function ParentDashboard() {
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const reviewTask = useTaskStore((s) => s.reviewTask)
  const returnTask = useTaskStore((s) => s.returnTask)
  const getRecording = useRecordStore((s) => s.getRecording)

  const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'reviewed'
  const [playingState, setPlayingState] = useState(null) // { taskId, items: [{url, text, index}], currentIndex: 0 }
  const [audioRef] = useState({ current: null })
  const playSeqRef = useRef({ stop: false, currentIndex: 0, requestedIndex: null })

  const completedCount = tasks.filter(t => t.completed).length

  const handleSubmitReview = (id) => {
    reviewTask(id)
  }

  const handleReturnTask = (id) => {
    if (window.confirm('确定要退回此任务让孩子重新朗读吗？')) {
      returnTask(id)
    }
  }

  const handleSubmitAll = () => {
    tasks.filter(t => t.completed && !t.reviewed).forEach(t => {
      reviewTask(t.taskId)
    })
  }

  const handlePlayRecording = async (taskId, t) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    playSeqRef.current.stop = true
    playSeqRef.current.requestedIndex = null
    
    if (playingState?.taskId === taskId) {
      setPlayingState(null)
      return
    }
    const items = []
    if (t.type === 'english_word') {
      for (let i = 0; i < (t.content?.words?.length || 0); i++) {
        const rec = getRecording(taskId, `word-${i}`)
        if (rec && rec.url) items.push({ url: rec.url, text: t.content.words[i].word })
      }
    } else if (t.type === 'english_sentence') {
      for (let i = 0; i < (t.content?.sentences?.length || 0); i++) {
        const rec = getRecording(taskId, `s-${i}`)
        if (rec && rec.url) items.push({ url: rec.url, text: t.content.sentences[i].text })
      }
    } else {
      // Multi-round recording (textbook-1/2/3, poem-1/2/3) or legacy single key
      const baseKey = getRecSubKey(t)
      if (baseKey) {
        // Try multi-round first
        for (let i = 1; i <= 3; i++) {
          const rec = getRecording(taskId, `${baseKey}-${i}`)
          if (rec && rec.url) items.push({ url: rec.url, text: `第${i}遍朗读` })
        }
        // Fallback to legacy single key
        if (items.length === 0) {
          const rec = getRecording(taskId, baseKey)
          if (rec && rec.url) items.push({ url: rec.url, text: '全文朗读' })
        }
      }
    }

    if (items.length === 0) return

    setPlayingState({ taskId, items, currentIndex: 0 })
    playSeqRef.current.stop = false
    playSeqRef.current.currentIndex = 0

    const executePlay = async () => {
      while (playSeqRef.current.currentIndex >= 0 && playSeqRef.current.currentIndex < items.length) {
        if (playSeqRef.current.stop) break;
        
        let i = playSeqRef.current.currentIndex
        setPlayingState(prev => prev ? { ...prev, currentIndex: i } : null)
        
        await new Promise(resolve => {
          const audio = new Audio(items[i].url)
          audioRef.current = audio
          audio.onended = resolve
          audio.onerror = resolve
          audio.play().catch(resolve)
        })
        
        if (playSeqRef.current.stop) break;
        
        if (playSeqRef.current.requestedIndex !== null) {
           playSeqRef.current.currentIndex = playSeqRef.current.requestedIndex
           playSeqRef.current.requestedIndex = null
        } else {
           playSeqRef.current.currentIndex++
        }
      }
      
      if (!playSeqRef.current.stop) {
        setPlayingState(null)
        audioRef.current = null
      }
    }
    
    executePlay()
  }

  const handlePlayControl = (controlType) => {
    if (!playingState) return
    const { currentIndex, items } = playingState
    if (controlType === 'prev') {
      if (currentIndex > 0) {
        if (audioRef.current) { audioRef.current.pause() }
        playSeqRef.current.requestedIndex = currentIndex - 1
        // Need to resolve the current promise to continue the while loop 
        if (audioRef.current?.onended) audioRef.current.onended() 
      }
    } else if (controlType === 'next') {
      if (currentIndex < items.length - 1) {
        if (audioRef.current) { audioRef.current.pause() }
        playSeqRef.current.requestedIndex = currentIndex + 1
        if (audioRef.current?.onended) audioRef.current.onended()
      }
    } else if (controlType === 'stop') {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
        playSeqRef.current.stop = true
        setPlayingState(null)
    }
  }

  // Map task type to recording subKey (for non-array types)
  const getRecSubKey = (t) => {
    const m = {
      chinese_poem: 'poem', english_article: 'article',
      chinese_text: 'textbook',
    }
    return m[t.type] || null
  }

  const hasRecordingForTask = (t) => {
    if (t.type === 'english_word') {
      return t.content?.words?.some((_, i) => getRecording(t.taskId, `word-${i}`))
    } else if (t.type === 'english_sentence') {
      return t.content?.sentences?.some((_, i) => getRecording(t.taskId, `s-${i}`))
    } else {
      const subKey = getRecSubKey(t)
      if (!subKey) return false
      // Check multi-round first
      for (let i = 1; i <= 3; i++) {
        if (getRecording(t.taskId, `${subKey}-${i}`)) return true
      }
      // Fallback to legacy
      return !!getRecording(t.taskId, subKey)
    }
  }

  // Filter tasks based on the active tab
  const displayTasks = tasks.filter(t => {
    if (activeTab === 'pending') {
      return !t.reviewed && (t.completed || t.returnHistory?.length > 0)
    } else {
      return t.reviewed
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8' }} className="animate-fade-in">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#2b9dee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>家长评价</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/history')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', color: '#d97706', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <span className="material-icons" style={{ fontSize: 16 }}>calendar_month</span> 荣誉日历
          </button>
          <button onClick={() => navigate('/courses')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <span className="material-icons" style={{ fontSize: 16 }}>library_books</span> 课程管理
          </button>
          <button onClick={() => navigate('/settings')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(241,245,249,0.8)', color: '#475569', borderRadius: 12, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <span className="material-icons" style={{ fontSize: 16 }}>settings</span> 系统设置
          </button>
          <BackButton />
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>
        {/* Summary */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20,
          border: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'center', textAlign: 'center',
        }}>
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>整体完成进度</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{completedCount}<span style={{fontSize: 20, fontWeight: 700, color: '#94a3b8'}}>/{tasks.length}</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '8px 4px', background: 'none', border: 'none',
              borderBottom: activeTab === 'pending' ? '3px solid #2b9dee' : '3px solid transparent',
              color: activeTab === 'pending' ? '#2b9dee' : '#64748b',
              fontWeight: activeTab === 'pending' ? 800 : 700, fontSize: 16, cursor: 'pointer',
              marginBottom: -1
            }}>
            待评价
          </button>
          <button 
            onClick={() => setActiveTab('reviewed')}
            style={{
              padding: '8px 4px', background: 'none', border: 'none',
              borderBottom: activeTab === 'reviewed' ? '3px solid #10b981' : '3px solid transparent',
              color: activeTab === 'reviewed' ? '#10b981' : '#64748b',
              fontWeight: activeTab === 'reviewed' ? 800 : 700, fontSize: 16, cursor: 'pointer',
              marginBottom: -1
            }}>
            已评价
          </button>
        </div>

        {/* Task review cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {displayTasks.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>
              {activeTab === 'pending' ? '暂无待评价的内容' : '暂无已评价的内容'}
            </p>
          )}

          {displayTasks.map((t) => {
            const hasRec = hasRecordingForTask(t)
            const isPlaying = playingState?.taskId === t.taskId
            
            return (
              <div key={t.taskId} style={{
                background: '#fff', borderRadius: 14, padding: 16,
                border: t.reviewed ? '2px solid #10b981' : '1px solid #f1f5f9',
              }}>
                {/* Task info row */}
                <div 
                  onClick={() => navigate(`${taskRouteMap[t.type]}${t.taskId}?viewOnly=true`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: t.completed ? 10 : 0, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: t.iconColor }}>{t.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 2px' }}>{t.title}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      {t.subject}
                      {t.completed && t.completedDuration > 0 && ` · 用时 ${t.completedDuration}s`}
                    </p>
                  </div>
                  {t.completed && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#d1fae5', color: '#059669' }}>✅ 已完成</span>
                    </div>
                  )}
                  {!t.completed && t.returnHistory?.length > 0 && (
                     <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#fef2f2', color: '#ef4444' }}>已被退回重新朗读</span>
                  )}
                </div>

                {t.completed && (
                  <>
                    {/* Play recording if exists */}
                    {hasRec && (
                      <div style={{ marginBottom: 10, paddingLeft: 52 }}>
                        {!isPlaying ? (
                          <button onClick={() => handlePlayRecording(t.taskId, t)} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px',
                            borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: '#f1f5f9', color: '#64748b',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                            听录音
                          </button>
                        ) : (
                          <div style={{ 
                            background: '#ecfdf5', border: '1px solid #10b981', borderRadius: 8, 
                            padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                                正在播放 <span style={{color:'#64748b', fontWeight:500, marginLeft:4}}>({playingState.currentIndex + 1}/{playingState.items.length})</span>
                              </span>
                              <button onClick={() => handlePlayControl('stop')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display:'flex' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                              </button>
                            </div>
                            
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', textAlign: 'center', margin: '4px 0' }}>
                              {playingState.items[playingState.currentIndex]?.text}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                              <button 
                                onClick={() => handlePlayControl('prev')}
                                disabled={playingState.currentIndex === 0}
                                style={{
                                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                                  background: playingState.currentIndex === 0 ? '#d1fae5' : '#10b981', 
                                  color: '#fff', cursor: playingState.currentIndex === 0 ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>skip_previous</span>
                              </button>
                              
                              <button onClick={() => handlePlayControl('stop')} style={{
                                width: 40, height: 40, borderRadius: '50%', border: 'none',
                                background: '#10b981', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>pause</span>
                              </button>
                              
                              <button 
                                onClick={() => handlePlayControl('next')}
                                disabled={playingState.currentIndex === playingState.items.length - 1}
                                style={{
                                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                                  background: playingState.currentIndex === playingState.items.length - 1 ? '#d1fae5' : '#10b981', 
                                  color: '#fff', cursor: playingState.currentIndex === playingState.items.length - 1 ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>skip_next</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, paddingLeft: 52, marginTop: 16 }}>
                      {!t.reviewed && (
                        <button onClick={() => handleReturnTask(t.taskId)} style={{
                          padding: '6px 16px', borderRadius: 8, border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}>
                          退回重新朗读
                        </button>
                      )}

                      {!t.reviewed && (
                        <button onClick={() => handleSubmitReview(t.taskId)} style={{
                          padding: '6px 16px', borderRadius: 8, border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                        }}>
                          确认完成
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* Return History */}
                {t.returnHistory && t.returnHistory.length > 0 && (
                  <div style={{ paddingLeft: t.completed ? 52 : 0, marginTop: 12, borderTop: t.completed ? '1px dashed #e2e8f0' : 'none', paddingTop: t.completed ? 12 : 0 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#ef4444' }}>退回历史记录 ({t.returnHistory.length}次)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {t.returnHistory.map((history, idx) => {
                        const date = new Date(history.returnedAt)
                        return (
                          <div key={idx} style={{ padding: '6px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                            <span>第 {idx + 1} 次完成于: {new Date(history.completedAt).toLocaleTimeString()} ({history.completedDuration}s)</span>
                            <span>被退回于: {date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit All - only show in pending tab */}
        {activeTab === 'pending' && displayTasks.length > 0 && (
          <button onClick={handleSubmitAll} style={{
            width: '100%', padding: 14, background: '#2b9dee', color: '#fff',
            border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(43,157,238,0.3)',
          }}>
            全部提交评价
          </button>
        )}
      </main>
    </div>
  )
}
