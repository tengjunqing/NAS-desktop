interface SidebarProps {
  user: { username: string; role: string }
  currentPage: string
  onNavigate: (page: 'files' | 'photos' | 'videos' | 'shares' | 'admin') => void
  onLogout: () => void
}

export default function Sidebar({ user, currentPage, onNavigate, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'files' as const, icon: '📁', label: '文件' },
    { id: 'photos' as const, icon: '📷', label: '照片' },
    { id: 'videos' as const, icon: '🎬', label: '视频' },
    { id: 'shares' as const, icon: '🔗', label: '分享' },
  ]

  if (user.role === 'admin') {
    navItems.push({ id: 'admin' as const, icon: '⚙️', label: '管理' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">💾</span>
        <span>MyNAS</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.username[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role === 'admin' ? '管理员' : '用户'}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </aside>
  )
}