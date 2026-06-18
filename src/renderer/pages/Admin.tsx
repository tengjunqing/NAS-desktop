import { useState, useEffect } from 'react'
import { listUsers, createUser, deleteUser } from '../api'

interface User {
  id: number
  username: string
  role: string
  quota_bytes: number
  used_bytes: number
  created_at: string
}

interface AdminProps {
  user: { id: number; username: string; role: string }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

export default function Admin({ user }: AdminProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const loadUsers = () => {
    setLoading(true)
    listUsers()
      .then(data => setUsers(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) return
    setCreating(true)
    try {
      await createUser(newUsername, newPassword)
      setNewUsername('')
      setNewPassword('')
      loadUsers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (id === user.id) {
      alert('不能删除自己')
      return
    }
    if (!confirm('确定删除此用户吗？')) return
    try {
      await deleteUser(id)
      loadUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">管理</h1>
      </div>

      <div className="admin-section">
        <h2>创建用户</h2>
        <div className="create-user-form">
          <input
            className="input"
            placeholder="用户名"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="密码"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleCreateUser}
            disabled={creating}
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
      </div>

      <div className="admin-section">
        <h2>用户列表</h2>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <span className="col-name">用户名</span>
              <span className="col-role">角色</span>
              <span className="col-used">已用空间</span>
              <span className="col-quota">配额</span>
              <span className="col-date">创建时间</span>
              <span className="col-actions">操作</span>
            </div>
            {users.map(u => (
              <div key={u.id} className="table-row">
                <span className="col-name">
                  <span className="user-avatar-sm">{u.username[0].toUpperCase()}</span>
                  {u.username}
                </span>
                <span className="col-role">
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                    {u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </span>
                <span className="col-used">{formatSize(u.used_bytes)}</span>
                <span className="col-quota">
                  {u.quota_bytes > 0 ? formatSize(u.quota_bytes) : '无限制'}
                </span>
                <span className="col-date">
                  {new Date(u.created_at).toLocaleDateString('zh-CN')}
                </span>
                <span className="col-actions">
                  {u.id !== user.id && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      删除
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}