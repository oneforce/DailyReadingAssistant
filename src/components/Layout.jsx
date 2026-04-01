import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import useUserStore from '../stores/userStore'

const navItems = [
  { icon: 'home', label: '首页', path: '/' },
  { icon: 'history', label: '回顾', path: '/history' },
  { icon: 'swords', label: '怪兽', path: '/boss' },
  { icon: 'settings', label: '家长', path: '/parent' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(43,157,238,0.1)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, background: '#2b9dee', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 12px rgba(43,157,238,0.3)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_stories</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>朗读小助手</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            width: 40, height: 40, borderRadius: 12, border: 'none',
            background: 'rgba(43,157,238,0.1)', color: '#2b9dee', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(43,157,238,0.2)', borderRadius: 9999,
            padding: '4px 12px 4px 4px', background: '#fff',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `center/cover no-repeat url(${user.avatar})`,
              border: '2px solid rgba(43,157,238,0.3)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{user.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '24px 16px', paddingBottom: 80 }}>
        <div style={{ maxWidth: 960, width: '100%' }}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around',
        padding: '8px 0 12px', zIndex: 50,
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? '#2b9dee' : '#94a3b8', transition: 'color 0.2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
