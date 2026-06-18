import { useState, useEffect } from 'react'
import { getShares, deleteShare, getServerUrl } from '../api'

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

  const loadShares = () => {
    setLoading(true)
    getShares()
      .then(data => setShares(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadShares()
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
      </div>

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