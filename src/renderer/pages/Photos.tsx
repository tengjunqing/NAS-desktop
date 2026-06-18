import { useState, useEffect } from 'react'
import { getPhotoTimeline, getServerUrl } from '../api'

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

function PhotoThumb({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const url = `${getServerUrl()}/api/files/download/${photo.volume}/${photo.path}?view=1&token=${encodeURIComponent(localStorage.getItem('mynas_token') || '')}`

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

export default function Photos() {
  const [groups, setGroups] = useState<DateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    setLoading(true)
    getPhotoTimeline()
      .then(data => setGroups(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getPhotoUrl = (photo: Photo) => {
    const token = localStorage.getItem('mynas_token') || ''
    return `${getServerUrl()}/api/files/download/${photo.volume}/${photo.path}?view=1&token=${encodeURIComponent(token)}`
  }

  return (
    <div className="photos-page">
      <div className="page-header">
        <h1 className="page-title">照片</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <p>暂无照片</p>
          <p className="empty-hint">上传照片后将在此显示</p>
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
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal photo-modal" onClick={e => e.stopPropagation()}>
            <img
              src={getPhotoUrl(selectedPhoto)}
              alt={selectedPhoto.name}
              className="photo-full"
            />
            <div className="photo-info">
              <span className="photo-name">{selectedPhoto.name}</span>
              <span className="photo-date">
                {new Date(selectedPhoto.mod_time).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}