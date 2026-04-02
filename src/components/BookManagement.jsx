import { useState, useEffect } from 'react'
import useBookStore from '../stores/bookStore'
import useTaskStore from '../stores/taskStore'
import { uploadImageToQiniu } from '../utils/qiniu'

export default function BookManagement() {
  const books = useBookStore((s) => s.books)
  const fetchBooks = useBookStore((s) => s.fetchBooks)
  const addBook = useBookStore((s) => s.addBook)
  const updateBook = useBookStore((s) => s.updateBook)
  const deleteBook = useBookStore((s) => s.deleteBook)
  const archiveBook = useBookStore((s) => s.archiveBook)
  
  const tasks = useTaskStore((s) => s.tasks)
  const assignTasksToBook = useTaskStore((s) => s.assignTasksToBook)
  const archiveTasksByBook = useTaskStore((s) => s.archiveTasksByBook)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBookId, setEditingBookId] = useState(null)
  const [formData, setFormData] = useState({ title: '', subject: '语文', cover: '', desc: '' })
  const [assigningBookId, setAssigningBookId] = useState(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleSaveBook = async (e) => {
    e.preventDefault()
    if (!formData.title) return
    if (editingBookId) {
       await updateBook(editingBookId, formData)
    } else {
       await addBook(formData)
    }
    closeForm()
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingBookId(null)
    setFormData({ title: '', subject: '语文', cover: '', desc: '' })
  }

  const handleEditBook = (book) => {
    setEditingBookId(book.id)
    setFormData({
      title: book.title || '',
      subject: book.subject || '语文',
      cover: book.cover || '',
      desc: book.desc || ''
    })
    setShowAddForm(true)
  }

  const handleDeleteBook = async (id) => {
    if (window.confirm('确定要永久删除这本书吗？(任务不会被删除)')) {
      await deleteBook(id)
    }
  }

  const handleArchiveBook = async (id, bookId) => {
    if (window.confirm('确定下架该书籍吗？下架后该书籍及其包含的任务将对孩子隐藏。')) {
      await archiveBook(id)
      if (bookId) {
        await archiveTasksByBook(bookId)
      }
    }
  }

  const handleStartAssign = (bookId) => {
    setAssigningBookId(bookId)
    const alreadyAssigned = tasks.filter(t => t.bookId === bookId).map(t => t.taskId)
    setSelectedTaskIds(alreadyAssigned)
  }

  const handleToggleTask = (taskId) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  const handleSaveAssignedTasks = async () => {
    if (!assigningBookId) return
    // Simple approach: we assign the selected tasks to this book.
    // For tasks that were previously assigned but are unselected now, we could unassign them by setting bookId: '' 
    // Wait, the current taskStore logic only handles `assignTasksToBook(taskIds, bookId)`.
    // Let's add unassigning logic: tasks that belong to this book but not in selectedTaskIds should get bookId = ''
    
    // First, unassign removed tasks
    const prevAssigned = tasks.filter(t => t.bookId === assigningBookId).map(t => t.taskId)
    const toUnassign = prevAssigned.filter(tid => !selectedTaskIds.includes(tid))
    if (toUnassign.length > 0) {
      await assignTasksToBook(toUnassign, '')
    }

    // Assign new tasks
    if (selectedTaskIds.length > 0) {
      await assignTasksToBook(selectedTaskIds, assigningBookId)
    }

    setAssigningBookId(null)
    setSelectedTaskIds([])
  }

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await uploadImageToQiniu(file, 'book-cover')
      if (res && res.url) {
        setFormData(prev => ({ ...prev, cover: res.url }))
      } else {
        alert('图片上传失败，请检查配置或网络')
      }
    } catch (err) {
      alert('图片上传发生错误')
    } finally {
      setUploadingImage(false)
    }
  }

  if (assigningBookId) {
    const book = books.find(b => b.bookId === assigningBookId || b.id === assigningBookId)
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>分配任务到《{book?.title}》</h3>
          <button onClick={() => setAssigningBookId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', marginBottom: 20 }}>
          {tasks.filter(t => !t.bookId || t.bookId === assigningBookId).map(t => {
            const isSelected = selectedTaskIds.includes(t.taskId)
            return (
              <div key={t.taskId} 
                onClick={() => handleToggleTask(t.taskId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8,
                  border: isSelected ? '2px solid #2b9dee' : '2px solid transparent',
                  background: isSelected ? 'rgba(43,157,238,0.05)' : '#f8fafc',
                  cursor: 'pointer'
                }}>
                <span className="material-symbols-outlined" style={{ color: isSelected ? '#2b9dee' : '#cbd5e1' }}>
                  {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div style={{ flex: 1 }}>
                   <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{t.title}</p>
                   <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t.subject} - {t.type}</p>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={handleSaveAssignedTasks} style={{
          width: '100%', padding: 12, background: '#2b9dee', color: '#fff',
          borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer'
        }}>
          保存分配 ({selectedTaskIds.length} 个任务)
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showAddForm ? (
        <form onSubmit={handleSaveBook} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{editingBookId ? '编辑书籍' : '新增书籍'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required placeholder="书名 (如：三年级上册语文)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <option value="语文">语文</option>
              <option value="英语">英语</option>
              <option value="课外">课外</option>
            </select>
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <input placeholder="图标名称或网络URL" value={formData.cover} onChange={e => setFormData({...formData, cover: e.target.value})} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: '#f1f5f9', color: '#64748b', borderRadius: 8, cursor: uploadingImage ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, border: '1px solid #e2e8f0' }}>
                {uploadingImage ? '上传中...' : '上传封面'}
                <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageFileChange} style={{ display: 'none' }} />
              </label>
            </div>
            <input placeholder="描述信息" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" style={{ flex: 1, padding: 10, background: '#10b981', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer' }}>保存</button>
              <button type="button" onClick={closeForm} style={{ flex: 1, padding: 10, background: '#f1f5f9', color: '#64748b', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer' }}>取消</button>
            </div>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAddForm(true)} style={{
          width: '100%', padding: 16, background: '#fff', border: '2px dashed #cbd5e1', color: '#64748b',
          borderRadius: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <span className="material-symbols-outlined">add_circle</span>
          新增一本书籍
        </button>
      )}

      {books.length === 0 && !showAddForm && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>暂无书籍，你可以添加书籍来归档任务</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {books.map(b => {
          const bookTasks = tasks.filter(t => t.bookId === b.bookId || t.bookId === b.id)
          const completedTasks = bookTasks.filter(t => t.completed)
          
          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(43,157,238,0.1)', color: '#2b9dee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {b.cover?.startsWith('http') || b.cover?.startsWith('/') ? (
                     <img src={b.cover} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                     <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{b.cover || 'book'}</span>
                  )}
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    {b.subject} · {bookTasks.length} 个任务 (完成 {completedTasks.length})
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => handleStartAssign(b.bookId || b.id)} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#2b9dee', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  分配任务
                </button>
                <button onClick={() => handleEditBook(b)} style={{ padding: '6px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', display: 'flex' }} title="编辑">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </button>
                <button onClick={() => handleArchiveBook(b.id, b.bookId || b.id)} style={{ padding: '6px', background: 'transparent', color: '#f59e0b', border: 'none', cursor: 'pointer', display: 'flex' }} title="下架书籍">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>archive</span>
                </button>
                <button onClick={() => handleDeleteBook(b.id)} style={{ padding: '6px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex' }} title="永久删除">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
