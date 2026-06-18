import { useState, useEffect } from 'react'
import { getShares, deleteShare, createShare, listVolumes, getServerUrl } from '../api'

interface Share {
  id: number
  token: string
  has_password: boolean
  max_downloads: number
  download_count: number
  expires_at: string | null
  created_at: string
}

export default function Shares() {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [volumes, setVolumes] = useState<any[]>([])
  const [createVolume, setCreateVolume] = useState('default')
  const [createPath, setCreatePath] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createMaxDownloads, setCreateMaxDownloads] = useState('')
  const [createExpiresIn, setCreateExpiresIn] = useState('')
  const [createResult, setCreateResult] = useState<{ url: string } | null>(null)
  const [createError, setCreateError] = useState('')

  const loadShares = () => {
    setLoading(true)
    getShares()
      .then(data => setShares(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadShares()
    listVolumes().then(data => setVolumes(data || [])).catch(() => {})
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此分享链接吗？')) return
    try {
      await deleteShare(id)
      loadShares()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const openCreateForm = () => {
    setCreateVolume(volumes[0]?.Name || 'default')
    setCreatePath('')
    setCreatePassword('')
    setCreateMaxDownloads('')
    setCreateExpiresIn('')
    setCreateResult(null)
    setCreateError('')
    setShowCreate(true)
  }

  const handleCreateShare = async () => {
    if (!createPath.trim()) {
      setCreateError('请输入文件路径')
      return
    }
    setCreateError('')
    try {
      const data = await createShare(
        createVolume,
        createPath.trim(),
        createPassword || undefined,
        createExpiresIn || undefined,
        createMaxDownloads ? parseInt(createMaxDownloads) : undefined,
      )
      const url = `${getServerUrl()}/share/${data.token}`
      setCreateResult({ url })
      loadShares()
    } catch (err: any) {
      setCreateError(err.message)
    }
  }

  const handleCopy = (share: Share) => {
    const url = `${getServerUrl()}/share/${share.token}`
    navigator.clipboard.writeText(url)
    setCopiedId(share.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="shares-page">
      <div className="page-header">
        <h1 className="page-title">分享</h1>
        <button className="btn btn-primary" onClick={openCreateForm}>
          <span>🔗</span> 新建分享
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 420 }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 16 }}>新建分享链接</h2>
            {createResult ? (
              <div>
                <p style={{ color: 'var(--accent)', margin: '0 0 8px 0' }}>分享链接已创建:</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <code style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', color: 'var(--text-primary)' }}>{createResult.url}</code>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigator.clipboard.writeText(createResult.url)}
                  >
                    📋 复制
                  </button>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>完成</button>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>存储卷</label>
                  <select className="volume-select" value={createVolume} onChange={e => setCreateVolume(e.target.value)}>
                    {volumes.map((v: any) => (
                      <option key={v.Name} value={v.Name}>{v.Name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>文件路径</label>
                  <input
                    type="text"
                    className="input"
                    value={createPath}
                    onChange={e => setCreatePath(e.target.value)}
                    placeholder="例如: photos/beach.jpg"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>密码 (可选)</label>
                  <input
                    type="text"
                    className="input"
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    placeholder="留空则无需密码访问"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>最大下载次数 (可选)</label>
                  <input
                    type="number"
                    className="input"
                    value={createMaxDownloads}
                    onChange={e => setCreateMaxDownloads(e.target.value)}
                    placeholder="留空则不限制"
                    min="1"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>有效期 (天, 可选)</label>
                  <input
                    type="number"
                    className="input"
                    value={createExpiresIn}
                    onChange={e => setCreateExpiresIn(e.target.value)}
                    placeholder="留空则永不过期"
                    min="1"
                  />
                </div>
                {createError && (
                  <div className="alert alert-error" style={{ marginBottom: 12 }}>{createError}</div>
                )}
                <button className="btn btn-primary" onClick={handleCreateShare}>创建分享链接</button>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      ) : shares.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p>暂无分享</p>
          <p className="empty-hint">在文件页面右键可创建分享链接</p>
        </div>
      ) : (
        <div className="shares-list">
          {shares.map(share => (
            <div key={share.id} className="share-card">
              <div className="share-info">
                <div className="share-token">{share.token}</div>
                <div className="share-meta">
                  <span>
                    {share.has_password ? '🔒 有密码' : '🔓 无密码'}
                  </span>
                  <span>
                    📥 {share.download_count} / {share.max_downloads || '∞'} 次下载
                  </span>
                  <span>
                    ⏰ {share.expires_at ? new Date(share.expires_at).toLocaleDateString('zh-CN') : '永不过期'}
                  </span>
                </div>
              </div>
              <div className="share-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(share)}
                >
                  {copiedId === share.id ? '✓ 已复制' : '📋 复制'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(share.id)}
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}