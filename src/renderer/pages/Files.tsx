import { useState, useEffect, useCallback } from 'react'
import { browseFiles, uploadFiles, createDirectory, deleteFile, getDownloadUrl, listVolumes, moveFile, createShare, getServerUrl } from '../api'

interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  size: number
  extension: string
  mime_type: string
  mod_time: string
}

interface FilesProps {
  volume: string
  path: string
  onNavigate: (volume: string, path: string) => void
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function getFileIcon(entry: FileEntry): string {
  if (entry.is_dir) return '📁'
  const ext = entry.extension.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg'].includes(ext)) return '🖼️'
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return '🎬'
  if (['mp3', 'flac', 'wav', 'aac', 'ogg'].includes(ext)) return '🎵'
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return '📝'
  if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return '📦'
  return '📄'
}

export default function Files({ volume, path, onNavigate }: FilesProps) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [volumes, setVolumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null)
  const [shareModal, setShareModal] = useState<{ entry: FileEntry } | null>(null)
  const [sharePassword, setSharePassword] = useState('')
  const [shareMaxDownloads, setShareMaxDownloads] = useState('')
  const [shareExpiresIn, setShareExpiresIn] = useState('')
  const [shareResult, setShareResult] = useState<{ url: string } | null>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await browseFiles(volume, path)
      setFiles(data.files || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [volume, path])

  const loadVolumes = useCallback(async () => {
    try {
      const data = await listVolumes()
      setVolumes(data || [])
    } catch (err: any) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    loadVolumes()
  }, [loadVolumes])

  const handleClick = (entry: FileEntry) => {
    if (entry.is_dir) {
      onNavigate(volume, entry.path)
    } else {
      handleDownload(entry)
    }
  }

  const handleDownload = async (entry: FileEntry) => {
    const url = await getDownloadUrl(volume, entry.path)
    window.open(url, '_blank')
  }

  const handleUpload = async (fileList: FileList) => {
    const filesToUpload = Array.from(fileList)
    try {
      await uploadFiles(volume, path || '', filesToUpload)
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleFolderUpload = async (fileList: FileList) => {
    const filesToUpload = Array.from(fileList)
    if (filesToUpload.length === 0) return

    try {
      const dirMap = new Map<string, File[]>()
      for (const file of filesToUpload) {
        const relativePath = (file as any).webkitRelativePath || file.name
        const lastSlash = relativePath.lastIndexOf('/')
        const dirPath = lastSlash > 0 ? relativePath.substring(0, lastSlash) : ''
        if (!dirMap.has(dirPath)) {
          dirMap.set(dirPath, [])
        }
        dirMap.get(dirPath)!.push(file)
      }

      for (const [dirPath, files] of dirMap) {
        const targetPath = path ? `${path}/${dirPath}` : dirPath

        if (dirPath) {
          await createDirectory(volume, path || '', dirPath).catch(() => {})
        }

        await uploadFiles(volume, targetPath || '', files)
      }
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const handleCreateDir = async () => {
    const name = prompt('文件夹名称:')
    if (!name) return
    try {
      await createDirectory(volume, path || '', name)
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (entry: FileEntry) => {
    if (!confirm(`确定删除 "${entry.name}" 吗？`)) return
    try {
      await deleteFile(volume, entry.path)
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleOpenShareModal = (entry: FileEntry) => {
    setSharePassword('')
    setShareMaxDownloads('')
    setShareExpiresIn('')
    setShareResult(null)
    setShareModal({ entry })
  }

  const handleCreateShare = async () => {
    if (!shareModal) return
    try {
      const maxDownloads = shareMaxDownloads ? parseInt(shareMaxDownloads) : undefined
      const data = await createShare(volume, shareModal.entry.path, sharePassword || undefined, shareExpiresIn || undefined, shareMaxDownloads ? parseInt(shareMaxDownloads) : undefined)
      const url = `${getServerUrl()}/share/${data.token}`
      setShareResult({ url })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRename = async (entry: FileEntry) => {
    const newName = prompt('新名称:', entry.name)
    if (!newName || newName === entry.name) return
    const parentPath = entry.path.substring(0, entry.path.lastIndexOf('/'))
    const newPath = parentPath ? `${parentPath}/${newName}` : newName
    try {
      await moveFile(volume, entry.path, newPath)
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMove = async (entry: FileEntry) => {
    const newPath = prompt('目标路径 (如 other/dir):', '')
    if (newPath === null) return
    const name = entry.name
    const destPath = newPath ? `${newPath}/${name}` : name
    try {
      await moveFile(volume, entry.path, destPath)
      loadFiles()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }

  const breadcrumbs = path ? path.split('/') : []

  return (
    <div className="files-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">文件</h1>
          <select
            className="volume-select"
            value={volume}
            onChange={e => onNavigate(e.target.value, '')}
          >
            {volumes.map((v: any) => (
              <option key={v.Name} value={v.Name}>{v.Name}</option>
            ))}
          </select>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={handleCreateDir}>
            <span>📁</span> 新建文件夹
          </button>
          <label className="btn btn-secondary">
            <span>📂</span> 上传文件夹
            <input
              type="file"
              multiple
              hidden
              {...{ webkitdirectory: '', directory: '' } as any}
              onChange={e => e.target.files && handleFolderUpload(e.target.files)}
            />
          </label>
          <label className="btn btn-primary">
            <span>⬆️</span> 上传文件
            <input
              type="file"
              multiple
              hidden
              onChange={e => e.target.files && handleUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      <div className="breadcrumb">
        <button className="breadcrumb-item" onClick={() => onNavigate(volume, '')}>
          {volume}
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="breadcrumb-separator">
            <span>/</span>
            <button
              className="breadcrumb-item"
              onClick={() => onNavigate(volume, breadcrumbs.slice(0, i + 1).join('/'))}
            >
              {crumb}
            </button>
          </span>
        ))}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="upload-icon">📥</span>
        <p>拖放文件到此处上传</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>此文件夹为空</p>
        </div>
      ) : (
        <div className="file-list">
          <div className="file-list-header">
            <span className="file-col-icon"></span>
            <span className="file-col-name">名称</span>
            <span className="file-col-size">大小</span>
            <span className="file-col-date">修改时间</span>
          </div>
          {files.map((entry, i) => (
            <div
              key={i}
              className="file-item"
              onClick={() => handleClick(entry)}
              onContextMenu={e => handleContextMenu(e, entry)}
            >
              <span className="file-col-icon">{getFileIcon(entry)}</span>
              <span className="file-col-name">{entry.name}</span>
              <span className="file-col-size">{entry.is_dir ? '-' : formatSize(entry.size)}</span>
              <span className="file-col-date">{formatDate(entry.mod_time)}</span>
            </div>
          ))}
        </div>
      )}

      {shareModal && (
        <div className="modal-overlay" onClick={() => setShareModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 16 }}>创建分享链接</h2>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>文件</label>
              <span style={{ color: 'var(--text-primary)' }}>📄 {shareModal.entry.name}</span>
            </div>
            {shareResult ? (
              <div>
                <p style={{ color: 'var(--accent)', margin: '0 0 8px 0' }}>分享链接已创建:</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <code style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', color: 'var(--text-primary)' }}>{shareResult.url}</code>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigator.clipboard.writeText(shareResult.url)}
                  >
                    📋 复制
                  </button>
                </div>
                <button className="btn btn-secondary" onClick={() => setShareModal(null)}>完成</button>
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>密码 (可选)</label>
                  <input
                    type="text"
                    className="input"
                    value={sharePassword}
                    onChange={e => setSharePassword(e.target.value)}
                    placeholder="留空则无需密码访问"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>最大下载次数 (可选)</label>
                  <input
                    type="number"
                    className="input"
                    value={shareMaxDownloads}
                    onChange={e => setShareMaxDownloads(e.target.value)}
                    placeholder="留空则不限制"
                    min="1"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>有效期 (天, 可选)</label>
                  <input
                    type="number"
                    className="input"
                    value={shareExpiresIn}
                    onChange={e => setShareExpiresIn(e.target.value)}
                    placeholder="留空则永不过期"
                    min="1"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleCreateShare}>创建分享链接</button>
              </>
            )}
          </div>
        </div>
      )}

      {contextMenu && (
        <>
          <div className="context-overlay" onClick={() => setContextMenu(null)} />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {!contextMenu.entry.is_dir && (
              <button onClick={() => { handleDownload(contextMenu.entry); setContextMenu(null) }}>
                📥 下载
              </button>
            )}
            <button onClick={() => { handleOpenShareModal(contextMenu.entry); setContextMenu(null) }}>
              🔗 创建分享
            </button>
            <button onClick={() => { handleRename(contextMenu.entry); setContextMenu(null) }}>
              ✏️ 重命名
            </button>
            <button onClick={() => { handleMove(contextMenu.entry); setContextMenu(null) }}>
              📦 移动到...
            </button>
            <button onClick={() => { handleDelete(contextMenu.entry); setContextMenu(null) }}>
              🗑️ 删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}