import useTaskStore from '../stores/taskStore'

export default function RewardCenterPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const getBasePoints = useTaskStore((s) => s.getBasePoints)
  const getParentBonus = useTaskStore((s) => s.getParentBonus)
  const getTotalPoints = useTaskStore((s) => s.getTotalPoints)

  const completedCount = tasks.filter((t) => t.completed).length
  const basePoints = getBasePoints()
  const parentBonus = getParentBonus()
  const totalPoints = getTotalPoints()

  return (
    <div className="animate-fade-in">
      {/* Points Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #2b9dee, #1a7bc4)', borderRadius: 16,
        padding: 24, marginBottom: 20, color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, opacity: 0.8 }}>总积分</p>
            <p style={{ fontSize: 36, fontWeight: 900 }}>{totalPoints}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, opacity: 0.8 }}>今日完成</p>
            <p style={{ fontSize: 28, fontWeight: 900 }}>{completedCount}/{tasks.length}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
            <p style={{ fontSize: 11, opacity: 0.7 }}>基本分</p>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{basePoints}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
            <p style={{ fontSize: 11, opacity: 0.7 }}>家长评价分</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: parentBonus >= 0 ? '#a7f3d0' : '#fca5a5' }}>
              {parentBonus >= 0 ? '+' : ''}{parentBonus}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Tasks with scores */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>📋 今日任务积分</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {tasks.map((t) => {
          const base = t.completed ? (t.reward?.points || 0) : 0
          const bonus = t.parentBonus || 0
          const total = base + bonus
          return (
            <div key={t.taskId} style={{
              background: '#fff', borderRadius: 12, padding: '12px 16px',
              border: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: t.iconColor }}>{t.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{t.subject}</p>
                </div>
                {t.completed ? (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: '#d1fae5', color: '#059669',
                  }}>已完成</span>
                ) : (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: '#f1f5f9', color: '#94a3b8',
                  }}>待完成</span>
                )}
              </div>
              {/* Score breakdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 48 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  基本: <strong style={{ color: t.completed ? '#2b9dee' : '#cbd5e1' }}>{base}分</strong>
                </span>
                {t.reviewed && (
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    评价: <strong style={{ color: bonus >= 0 ? '#10b981' : '#ef4444' }}>
                      {bonus >= 0 ? '+' : ''}{bonus}分
                    </strong>
                  </span>
                )}
                {(base > 0 || bonus !== 0) && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                    合计: {total}分
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* History Placeholder */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>📅 历史记录</h3>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 32,
        border: '1px solid #f1f5f9', textAlign: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 8, display: 'block' }}>history</span>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>历史任务记录将在此显示</p>
        <p style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>目前仅展示当天任务</p>
      </div>
    </div>
  )
}
