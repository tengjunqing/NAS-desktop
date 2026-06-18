import { useState, useEffect } from 'react'
import { getPhotoTimeline, getRecentPhotos, getServerUrl } from '../api'

interface Photo {
  name: string
  path: string
  extension: string
  size: number
  mod_time: string
  volume: string
  mime_type: string
}

interface DateGroup {
  date: string
  photos: Photo[]
  count: number
}

function getPhotoDownloadUrl(photo: Photo): string {
  const token = localStorage.getItem('mynas_token') || ''
  const vol = photo.volume || 'default'
  const p = photo.path.startsWith('/') ? photo.path.slice(1) : photo.path
  return `${getServerUrl()}/api/files/download/${vol}/${p}?view=1&token=${encodeURIComponent(token)}`
}

function PhotoThumb({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const url = getPhotoDownloadUrl(photo)

  return (
    <div className="photo-item" onClick={onClick}>
      {!loaded && !error && (
        <div className="photo-placeholder">
          <div className="spinner" />
        </div>
      )}
      {error ? (
        <div className="photo-placeholder">
          <span className="photo-error-icon">🖼️</span>
        </div>
      ) : (
        <img
          src={url}
          alt={photo.name}
          loading="lazy"
          crossOrigin="anonymous"
          className={loaded ? 'photo-loaded' : 'photo-loading'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      <div className="photo-overlay">
        <span className="photo-overlay-name">{photo.name}</span>
      </div>
    </div>
  )
}

function PhotoFull({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const url = getPhotoDownloadUrl(photo)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal photo-modal" onClick={e => e.stopPropagation()}>
        {!loaded && !error && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        )}
        {error ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 48 }}>🖼️</span>
            <p style={{ marginTop: 12 }}>图片加载失败</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={onClose}>关闭</button>
          </div>
        ) : (
          <img
            src={url}
            alt={photo.name}
            crossOrigin="anonymous"
            className="photo-full"
            style={{ display: loaded ? 'block' : 'none' }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        {loaded && (
          <div className="photo-info">
            <span className="photo-name">{photo.name}</span>
            <span className="photo-date">
              {new Date(photo.mod_time).toLocaleString('zh-CN')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

type PhotoTab = 'recent' | 'timeline'

export default function Photos() {
  const [tab, setTab] = useState<PhotoTab>('timeline')
  const [groups, setGroups] = useState<DateGroup[]>([])
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    setLoading(true)
    if (tab === 'timeline') {
      getPhotoTimeline()
        .then(data => setGroups(data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      getRecentPhotos()
        .then(data => setRecentPhotos(data?.photos || data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [tab])

  const isEmpty = tab === 'timeline' ? groups.length === 0 : recentPhotos.length === 0

  return (
    <div className="photos-page">
      <div className="page-header">
        <h1 className="page-title">照片</h1>
        <div className="photo-tabs">
          <button
            className={`btn ${tab === 'recent' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab('recent')}
          >
            最近
          </button>
          <button
            className={`btn ${tab === 'timeline' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab('timeline')}
          >
            时间线
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      ) : isEmpty ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <p>暂无照片</p>
          <p className="empty-hint">上传照片后将在此显示</p>
        </div>
      ) : tab === 'recent' ? (
        <div className="photo-grid">
          {recentPhotos.map((photo, i) => (
            <PhotoThumb
              key={i}
              photo={photo}
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      ) : (
        <div className="photo-timeline">
          {groups.map(group => (
            <div key={group.date} className="photo-group">
              <div className="photo-group-header">
                <h3>{group.date}</h3>
                <span className="photo-count">{group.count} 张</span>
              </div>
              <div className="photo-grid">
                {group.photos.map((photo, i) => (
                  <PhotoThumb
                    key={i}
                    photo={photo}
                    onClick={() => setSelectedPhoto(photo)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoFull photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  )
}
