import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import BackButton from '../components/BackButton'
export default function CourseManagerPage() {
  const navigate = useNavigate()
  const tasks = useTaskStore((s) => s.tasks)
  const importTasks = useTaskStore((s) => s.importTasks)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const clearAllTasks = useTaskStore((s) => s.clearAllTasks)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [activeTab, setActiveTab] = useState('全部')
  const fileInputRef = useRef(null)

  const handleImport = (e) => {
    setErrorMsg('')
    setSuccessMsg('')
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target.result)
          importTasks(content)
          setSuccessMsg(`成功导入课程！`)
        } catch (err) {
          setErrorMsg(`解析文件 ${file.name} 失败: JSON格式不正确。`)
        }
      }
      reader.readAsText(file)
    })
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个课程吗？')) {
      deleteTask(id)
    }
  }

  const handleClear = () => {
    if (window.confirm('警告：这会清空所有课程（包含内置样本）。确定要继续吗？')) {
      clearAllTasks()
    }
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "taskId": "template-word-001",
        "type": "english_word",
        "title": "英语单词模板",
        "subject": "英语",
        "icon": "translate",
        "iconBg": "#dbeafe",
        "iconColor": "#2b9dee",
        "subtitle": "单词练习",
        "content": {
          "words": [
            { "word": "Apple", "phonetic": "/ˈæpl/", "meaning": "n. 苹果", "partOfSpeech": "名词词形", "plural": "apples" },
            { "word": "Eat", "phonetic": "/iːt/", "meaning": "v. 吃", "partOfSpeech": "不规则动词", "pastTense": "ate", "pastParticiple": "eaten" }
          ]
        }
      },
      {
        "taskId": "template-sentence-001",
        "type": "english_sentence",
        "title": "英语单句模板",
        "subject": "英语",
        "icon": "record_voice_over",
        "iconBg": "#d1fae5",
        "iconColor": "#10b981",
        "subtitle": "单句练习",
        "content": {
          "sentences": [
            { "text": "How are you today?", "phonetic": "[haʊ ɑːr juː təˈdeɪ]", "translation": "你今天好吗？" }
          ]
        }
      },
      {
        "taskId": "template-article-001",
        "type": "english_article",
        "title": "英语长文模板",
        "subject": "英语",
        "icon": "menu_book",
        "iconBg": "#e0e7ff",
        "iconColor": "#6366f1",
        "subtitle": "长文朗读",
        "content": {
          "title": "文章标题",
          "text": "文章的具体内容段落...\n第二段内容..."
        }
      },
      {
        "taskId": "template-poem-001",
        "type": "chinese_poem",
        "title": "古诗模板",
        "subject": "语文",
        "icon": "brush",
        "iconBg": "#fee2e2",
        "iconColor": "#ef4444",
        "subtitle": "古诗背诵",
        "difficulty": "中级",
        "content": {
          "text": "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。",
          "author": "李白",
          "dynasty": "唐代",
          "authorIntro": "作者简介...",
          "translation": "诗词翻译..."
        },
        "requirements": [
          { "id": "r1", "label": "古诗朗读", "type": "recording", "required": true },
          { "id": "r2", "label": "翻译朗读", "type": "recording", "required": true }
        ]
      },
      {
        "taskId": "template-text-001",
        "type": "chinese_text",
        "title": "课文朗读模板",
        "subject": "语文",
        "icon": "auto_stories",
        "iconBg": "#fef3c7",
        "iconColor": "#f59e0b",
        "subtitle": "课文朗读",
        "content": {
          "title": "文章标题",
          "type": "节选",
          "author": "作者",
          "text": "第一段文字...\n\n第二段文字...",
          "totalReadCount": 3
        }
      }
    ]
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'course_template.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const typeMap = {
    chinese_poem: '古诗',
    chinese_text: '语文课文',
    english_word: '英语单词',
    english_article: '英语长文',
    english_sentence: '英语单句',
  }

  const taskRouteMap = {
    chinese_poem: '/task/poem/',
    chinese_text: '/task/textbook/',
    english_word: '/task/word/',
    english_sentence: '/task/sentence/',
    english_article: '/task/article/',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8' }} className="animate-fade-in">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>课程管理</h2>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Actions Section */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#334155' }}>操作区</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#2b9dee', color: '#fff',
                borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>upload_file</span>
              导入课程 (JSON)
            </button>
            <input 
              type="file" 
              accept=".json" 
              multiple 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImport}
            />

            <button 
              onClick={handleDownloadTemplate}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#fff', color: '#10b981',
                borderRadius: 8, border: '1px solid #a7f3d0', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
              下载导入模板
            </button>
            
            <button 
              onClick={handleClear}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#fff', color: '#ef4444',
                borderRadius: 8, border: '1px solid #fecaca', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_sweep</span>
              清空所有课程
            </button>
          </div>

          {errorMsg && <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#ef4444', borderRadius: 8, fontSize: 14 }}>{errorMsg}</div>}
          {successMsg && <div style={{ marginTop: 16, padding: 12, background: '#ecfdf5', color: '#10b981', borderRadius: 8, fontSize: 14 }}>{successMsg}</div>}
        </div>

        {/* Existing Courses Section */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
            <span>已加载课程大全</span>
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 'normal' }}>共 {tasks.length} 门</span>
          </h3>

          {/* Categories Tab */}
          {tasks.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              {['全部', ...new Set(tasks.map(t => t.subject || '其他'))].map(subject => {
                const count = subject === '全部' ? tasks.length : tasks.filter(t => (t.subject || '其他') === subject).length;
                return (
                  <button
                    key={subject}
                    onClick={() => setActiveTab(subject)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 100,
                      background: activeTab === subject ? '#2b9dee' : '#f1f5f9',
                      color: activeTab === subject ? '#ffffff' : '#475569',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: activeTab === subject ? '0 4px 12px rgba(43, 157, 238, 0.2)' : 'none'
                    }}
                  >
                    <span>{subject}</span>
                    <span style={{ 
                      background: activeTab === subject ? 'rgba(255,255,255,0.2)' : '#cbd5e1', 
                      color: activeTab === subject ? '#fff' : '#475569',
                      padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 
                    }}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {tasks.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', gridColumn: '1 / -1', padding: '30px 0' }}>暂无课程，请导入数据</p>
            ) : (
              (activeTab === '全部' ? tasks : tasks.filter(t => (t.subject || '其他') === activeTab)).length === 0 ? (
                 <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', gridColumn: '1 / -1', padding: '30px 0' }}>该分类下暂无课程</p>
              ) : (
                (activeTab === '全部' ? tasks : tasks.filter(t => (t.subject || '其他') === activeTab)).map(task => (
                <div 
                  key={task.taskId} 
                  onClick={() => navigate(`${taskRouteMap[task.type]}${task.taskId}?viewOnly=true`)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: task.iconBg || '#e2e8f0', color: task.iconColor || '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span className="material-symbols-outlined">{task.icon || 'book'}</span>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{task.title}</h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        ID: {task.taskId} <br/>
                        类型: {typeMap[task.type] || task.type}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(task.taskId); }} 
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                  </button>
                </div>
              ))
              )
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
