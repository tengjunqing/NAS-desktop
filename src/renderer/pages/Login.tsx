import { useState } from 'react'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login: handleLogin } = useAuth()
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('mynas_server_url') || 'http://localhost:8080')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(serverUrl, username, password)
      handleLogin(data.access_token)
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">💾</span>
          <h1>MyNAS</h1>
          <p>个人云存储客户端</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>服务器地址</label>
            <input
              className="input"
              type="text"
              placeholder="http://localhost:8080"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>用户名</label>
            <input
              className="input"
              type="text"
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">{error}</div>}
          
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '连接中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
