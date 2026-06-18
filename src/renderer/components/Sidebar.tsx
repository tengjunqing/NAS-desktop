import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useHashRoute, type Page } from '../hooks/useHashRoute'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { page: currentPage, navigate } = useHashRoute()
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(v => setAppVersion(v)).catch(() => {})
    }
  }, [])

  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'files', icon: '📁', label: '文件' },
    { id: 'photos', icon: '📷', label: '照片' },
    { id: 'videos', icon: '🎬', label: '视频' },
    { id: 'shares', icon: '🔗', label: '分享' },
  ]

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', icon: '⚙️', label: '管理' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">💾</span>
        <span>MyNAS</span>
        {appVersion && <span className="version-tag">v{appVersion}</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role === 'admin' ? '管理员' : '用户'}</div>
          </div>
        </div>
        <div className="sidebar-actions">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️ 亮色' : '🌙 暗色'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            退出登录
          </button>
        </div>
      </div>
    </aside>
  )
}
