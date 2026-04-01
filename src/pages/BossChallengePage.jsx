export default function BossChallengePage() {
  return (
    <div className="animate-fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 200px)', textAlign: 'center',
    }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, boxShadow: '0 8px 32px rgba(15,23,42,0.3)',
      }}>
        <span style={{ fontSize: 56 }}>🐉</span>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#1e293b' }}>你想打败怪兽吗？</h2>
      <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24 }}>完成朗读任务积攒战力，挑战 BOSS！</p>
      <div style={{
        padding: '10px 28px', borderRadius: 12,
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: 1,
        boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
      }}>
        COMING SOON
      </div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 16 }}>敬请期待 ✨</p>
    </div>
  )
}
