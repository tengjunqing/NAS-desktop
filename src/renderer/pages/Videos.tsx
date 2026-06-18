import { useState, useEffect, useRef } from 'react'
import { getVideoList, getServerUrl } from '../api'

interface Video {
  name: string
  path: string
  extension: string
  size: number
  mod_time: string
  volume: string
  mime_type: string
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function getVideoUrl(video: Video): string {
  const token = localStorage.getItem('mynas_token') || ''
  const vol = video.volume || 'default'
  const p = video.path.startsWith('/') ? video.path.slice(1) : video.path
  return `${getServerUrl()}/api/files/download/${vol}/${p}?view=1&token=${encodeURIComponent(token)}`
}

function VideoPlayer({ video, onClose }: { video: Video; onClose: () => void }) {
  const [error, setError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [video])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal video-modal" onClick={e => e.stopPropagation()}>
        <div className="video-modal-header">
          <h3>{video.name}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        {error ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 48 }}>🎬</span>
            <p style={{ marginTop: 12 }}>视频加载失败</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            controls
            autoPlay
            crossOrigin="anonymous"
            className="video-player"
            onError={() => setError(true)}
          >
            <source src={getVideoUrl(video)} type={video.mime_type || 'video/mp4'} />
          </video>
        )}
      </div>
    </div>
  )
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<Video | null>(null)

  useEffect(() => {
    setLoading(true)
    getVideoList()
      .then(data => setVideos(data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="videos-page">
      <div className="page-header">
        <h1 className="page-title">视频</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <p>暂无视频</p>
          <p className="empty-hint">上传视频后将在此显示</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video, i) => (
            <div key={i} className="video-card" onClick={() => setPlaying(video)}>
              <div className="video-thumb">
                <span className="play-icon">▶️</span>
              </div>
              <div className="video-info">
                <div className="video-title">{video.name}</div>
                <div className="video-meta">
                  {formatSize(video.size)} · {new Date(video.mod_time).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {playing && (
        <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
      )}
    </div>
  )
}
