import { useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useRecordStore from '../stores/recordStore'
import { AudioRecorder, formatTime } from '../utils/recorder'
import { speakEN } from '../utils/speech'
import BackButton from '../components/BackButton'
export default function EnWordPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const isViewOnly = query.get('viewOnly') === 'true'

  const task = useTaskStore((s) => s.getTaskById(taskId))
  const completeTask = useTaskStore((s) => s.completeTask)
  const addRecording = useRecordStore((s) => s.addRecording)
  const getRecording = useRecordStore((s) => s.getRecording)
  const hasRecording = useRecordStore((s) => s.hasRecording)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recorded, setRecorded] = useState(() => {
    if (!task) return {}
    const init = {}
    task.content.words.forEach((_, i) => { if (hasRecording(taskId, `word-${i}`)) init[i] = true })
    return init
  })
  const recorderRef = useRef(new AudioRecorder())

  if (!task) return <div style={{ padding: 40, textAlign: 'center' }}>任务未找到</div>

  const words = task.content.words
  const word = words[currentIndex]
  const progress = Math.round(((currentIndex + 1) / words.length) * 100)

  const handleRecord = async () => {
    if (isRecording) {
      const blob = await recorderRef.current.stop()
      setIsRecording(false)
      if (blob) {
        await addRecording(taskId, `word-${currentIndex}`, blob)
        setRecorded({ ...recorded, [currentIndex]: true })
      }
    } else {
      const ok = await recorderRef.current.start(() => {})
      if (ok) setIsRecording(true)
    }
  }

  const goNext = () => {
    if (currentIndex < words.length - 1) setCurrentIndex(currentIndex + 1)
    else {
      if (!isViewOnly) completeTask(taskId)
      navigate(-1)
    }
  }
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>口语跟读练习</h2>
          {task?.completed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669', borderRadius: 20, fontWeight: 800, fontSize: 12, boxShadow: '0 2px 8px rgba(16,185,129,0.15)' }}>
              <span>已完成</span>
            </div>
          ) : task?.returnHistory?.length > 0 ? (
            <span style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
              被退回重读
            </span>
          ) : null}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 800, margin: '0 auto', width: '100%', padding: '24px 16px', paddingBottom: 80 }}>
        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#94a3b8' }}>当前任务进度</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2b9dee' }}>{currentIndex + 1} / {words.length}</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#2b9dee', borderRadius: 9999, width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Word Card */}
        <div onClick={() => speakEN(word.word)} style={{
          background: '#fff', borderRadius: 20, padding: '48px 32px', flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 24, minHeight: 280, cursor: 'pointer',
        }}>
          <div style={{ 
            background: '#fff', borderRadius: 24, padding: 40,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }}>
            <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 12 }}>{word.word}</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, color: '#94a3b8', fontStyle: 'italic' }}>{word.phonetic}</span>
              <button onClick={(e) => { e.stopPropagation(); speakEN(word.word); }} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(43,157,238,0.1)', color: '#2b9dee', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>volume_up</span>
              </button>
            </div>
            <p style={{ fontSize: 18, color: '#475569', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#2b9dee', fontWeight: 600, background: 'rgba(43,157,238,0.1)', padding: '2px 8px', borderRadius: 6 }}>{word.partOfSpeech}</span>
              {word.meaning}
            </p>
            {word.plural && (
              <div style={{ marginTop: 12, padding: '6px 16px', background: '#f8fafc', borderRadius: 100, border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>💡 提示：复数形式为 <strong style={{ color: '#0f172a' }}>{word.plural}</strong></p>
              </div>
            )}
            {(word.pastTense || word.pastParticiple) && (
              <div style={{ marginTop: 12, padding: '6px 16px', background: '#f8fafc', borderRadius: 100, border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  💡 提示：过去式 <strong style={{ color: '#0f172a' }}>{word.pastTense || '-'}</strong>，过去分词 <strong style={{ color: '#0f172a' }}>{word.pastParticiple || '-'}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Record Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          {!isViewOnly && (
            <>
              <button onClick={handleRecord} style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none',
                background: isRecording ? '#ef4444' : '#2b9dee', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${isRecording ? 'rgba(239,68,68,0.4)' : 'rgba(43,157,238,0.3)'}`,
                position: 'relative',
              }} className={isRecording ? 'recording-pulse' : ''}>
                <span className="material-symbols-outlined" style={{ fontSize: 36 }}>{isRecording ? 'stop' : 'mic'}</span>
              </button>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>{isRecording ? '正在录音...' : recorded[currentIndex] ? '已录音 - 点击重录' : '点击开始录音'}</p>
            </>
          )}
          {recorded[currentIndex] && !isRecording && (
            <button onClick={() => { const r = getRecording(taskId, `word-${currentIndex}`); if (r) new Audio(r.url).play() }} style={{
              padding: '8px 20px', background: '#d1fae5', color: '#059669', border: 'none',
              borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span> 播放录音
            </button>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={goPrev} disabled={currentIndex === 0} style={{
            flex: 1, padding: '14px 0', borderRadius: 12,
            background: currentIndex === 0 ? '#f1f5f9' : '#fff',
            border: '1px solid #e2e8f0', cursor: currentIndex === 0 ? 'default' : 'pointer',
            fontWeight: 600, fontSize: 15, color: currentIndex === 0 ? '#cbd5e1' : '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>skip_previous</span> 上一个
          </button>
          <button onClick={goNext} style={{
            flex: 1, padding: '14px 0', borderRadius: 12,
            background: '#2b9dee', color: '#fff', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            {currentIndex === words.length - 1 ? '完成' : '下一个'} <span className="material-symbols-outlined" style={{ fontSize: 18 }}>skip_next</span>
          </button>
        </div>
      </main>

      {/* Bottom Word List */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff',
        borderTop: '1px solid #e2e8f0', padding: '12px 16px', zIndex: 40,
        display: 'flex', gap: 8, overflowX: 'auto',
      }}>
        {words.map((w, i) => (
          <button key={i} onClick={() => setCurrentIndex(i)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
            background: currentIndex === i ? '#2b9dee' : recorded[i] ? '#d1fae5' : '#f1f5f9',
            color: currentIndex === i ? '#fff' : recorded[i] ? '#10b981' : '#64748b',
            fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
          }}>{w.word}</button>
        ))}
      </div>
    </div>
  )
}
