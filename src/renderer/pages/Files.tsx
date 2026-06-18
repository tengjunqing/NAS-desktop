import { useState, useEffect, useCallback, useMemo } from 'react'
import { browseFiles, uploadFiles, createDirectory, deleteFile, getDownloadUrl, listVolumes, moveFile, createShare, getServerUrl, getStorageStats } from '../api'

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

function getThumbUrl(volume: string, filePath: string): string {
  const token = localStorage.getItem('mynas_token') || ''
  return `${getServerUrl()}/api/files/download/${volume}/${filePath}?view=1&token=${encodeURIComponent(token)}`
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg']
const VIDEO_EXTS = ['mp4', 'mkv', 'avi', 'mov', 'webm']
const DOC_EXTS = ['pdf', 'doc', 'docx', 'txt', 'md']

function openUrl(url: string) {
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

function FileIcon({ entry, volume }: { entry: FileEntry; volume: string }) {
  const [imgError, setImgError] = useState(false)
  const ext = entry.extension.toLowerCase()

  if (entry.is_dir) return <>{getFileIcon(entry)}</>
  if ((IMAGE_EXTS.includes(ext) || VIDEO_EXTS.includes(ext)) && !imgError) {
    return (
      <img
        src={getThumbUrl(volume, entry.path)}
        alt={entry.name}
        className="file-thumb"
        onError={() => setImgError(true)}
      />
    )
  }
  return <>{getFileIcon(entry)}</>
}

function FilePreview({ entry, volume, onClose }: { entry: FileEntry; volume: string; onClose: () => void }) {
  const ext = entry.extension.toLowerCase()
  const isImage = IMAGE_EXTS.includes(ext)
  const isVideo = VIDEO_EXTS.includes(ext)
  const url = getThumbUrl(volume, entry.path)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: isImage ? '95vw' : 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry.name}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        {isImage ? (
          <img
            src={url}
            alt={entry.name}
            crossOrigin="anonymous"
            style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : isVideo ? (
          <video
            controls
            autoPlay
            crossOrigin="anonymous"
            style={{ width: '100%', maxHeight: '70vh', borderRadius: 'var(--radius)', background: '#000' }}
            onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
          >
            <source src={url} type={entry.mime_type || 'video/mp4'} />
          </video>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <span style={{ fontSize: 48 }}>{getFileIcon(entry)}</span>
            <p style={{ margin: '16px 0', fontSize: 14, color: 'var(--text-secondary)' }}>{entry.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {formatSize(entry.size)} · {formatDate(entry.mod_time)}
            </p>
            <button className="btn btn-primary" onClick={() => { openUrl(url); onClose() }}>
              📥 打开 / 下载
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const FILE_TYPE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '🖼️ 图片' },
  { value: 'video', label: '🎬 视频' },
  { value: 'document', label: '📝 文档' },
  { value: 'other', label: '📦 其他' },
]

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
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number; fileName?: string } | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('all')
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError('')
    setSelectedPaths(new Set())
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

  useEffect(() => {
    if (volume) {
      getStorageStats(volume)
        .then(data => setStorageStats(data))
        .catch(() => setStorageStats(null))
    }
  }, [volume])

  const filteredFiles = useMemo(() => {
    let result = files
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f => f.name.toLowerCase().includes(q))
    }
    if (fileTypeFilter !== 'all') {
      if (fileTypeFilter === 'image') result = result.filter(f => IMAGE_EXTS.includes(f.extension.toLowerCase()))
      else if (fileTypeFilter === 'video') result = result.filter(f => VIDEO_EXTS.includes(f.extension.toLowerCase()))
      else if (fileTypeFilter === 'document') result = result.filter(f => DOC_EXTS.includes(f.extension.toLowerCase()))
      else if (fileTypeFilter === 'other') {
        result = result.filter(f => {
          if (f.is_dir) return false
          const ext = f.extension.toLowerCase()
          return !IMAGE_EXTS.includes(ext) && !VIDEO_EXTS.includes(ext) && !DOC_EXTS.includes(ext)
        })
      }
    }
    return result
  }, [files, searchQuery, fileTypeFilter])

  const toggleSelect = (entryPath: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(entryPath)) next.delete(entryPath)
      else next.add(entryPath)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedPaths(prev => {
      const selectable = filteredFiles.filter(f => !f.is_dir)
      if (selectable.length === prev.size) return new Set()
      return new Set(selectable.map(f => f.path))
    })
  }

  const handleBatchDelete = async () => {
    if (selectedPaths.size === 0) return
    if (!confirm(`确定删除选中的 ${selectedPaths.size} 个文件吗？`)) return
    let failed = 0
    for (const filePath of selectedPaths) {
      try {
        await deleteFile(volume, filePath)
      } catch {
        failed++
      }
    }
    if (failed > 0) setError(`${failed} 个文件删除失败`)
    loadFiles()
  }

  const handleClick = (entry: FileEntry) => {
    if (entry.is_dir) {
      onNavigate(volume, entry.path)
    } else {
      setPreviewEntry(entry)
    }
  }

  const handleDownload = async (entry: FileEntry) => {
    const url = await getDownloadUrl(volume, entry.path)
    openUrl(url)
  }

  const doUpload = async (filesToUpload: File[], fileName?: string) => {
    if (filesToUpload.length === 0) return
    const totalBytes = filesToUpload.reduce((sum, f) => sum + f.size, 0)
    setUploadProgress({ loaded: 0, total: totalBytes, fileName })
    try {
      await uploadFiles(volume, path || '', filesToUpload, (loaded) => {
        setUploadProgress(prev => prev ? { ...prev, loaded } : null)
      })
      setUploadProgress(null)
      loadFiles()
    } catch (err: any) {
      setUploadProgress(null)
      setError(err.message)
    }
  }

  const handleUpload = async (fileList: FileList) => {
    await doUpload(Array.from(fileList))
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

      for (const [dirPath, dirFiles] of dirMap) {
        const targetPath = path ? `${path}/${dirPath}` : dirPath
        if (dirPath) {
          await createDirectory(volume, path || '', dirPath).catch(() => {})
        }
        await doUpload(dirFiles, dirPath || dirFiles[0]?.name)
      }
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
  const storagePct = storageStats?.total ? Math.round((storageStats.used / storageStats.total) * 100) : 0
  const storageFull = storagePct > 90
  const selectableFiles = filteredFiles.filter(f => !f.is_dir)
  const allSelected = selectableFiles.length > 0 && selectedPaths.size === selectableFiles.length

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

      {storageStats && (
        <div className={`storage-bar ${storageFull ? 'storage-full' : ''}`}>
          <div className="storage-bar-text">
            <span>存储空间</span>
            <span>{formatSize(storageStats.used)} / {formatSize(storageStats.total)}</span>
          </div>
          <div className="storage-bar-track">
            <div
              className="storage-bar-fill"
              style={{ width: `${Math.min(storagePct, 100)}%` }}
            />
          </div>
          {storageFull && <div className="storage-bar-warning">⚠ 存储空间不足</div>}
        </div>
      )}

      {uploadProgress && (
        <div className="upload-progress">
          <div className="upload-progress-text">
            <span>上传中{uploadProgress.fileName ? `: ${uploadProgress.fileName}` : ''}...</span>
            <span>{Math.round((uploadProgress.loaded / Math.max(uploadProgress.total, 1)) * 100)}%</span>
          </div>
          <div className="upload-progress-track">
            <div
              className="upload-progress-fill"
              style={{ width: `${Math.min(Math.round((uploadProgress.loaded / Math.max(uploadProgress.total, 1)) * 100), 100)}%` }}
            />
          </div>
        </div>
      )}

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

      <div className="files-toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <select
          className="volume-select"
          value={fileTypeFilter}
          onChange={e => setFileTypeFilter(e.target.value)}
        >
          {FILE_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {selectedPaths.size > 0 && (
        <div className="batch-toolbar">
          <span>已选 {selectedPaths.size} 项</span>
          <button className="btn btn-danger btn-sm" onClick={handleBatchDelete}>
            🗑️ 批量删除
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPaths(new Set())}>
            取消选择
          </button>
        </div>
      )}

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
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{searchQuery || fileTypeFilter !== 'all' ? '🔍' : '📂'}</div>
          <p>{searchQuery || fileTypeFilter !== 'all' ? '没有匹配的文件' : '此文件夹为空'}</p>
        </div>
      ) : (
        <div className="file-list">
          <div className="file-list-header">
            <span className="file-col-check">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            </span>
            <span className="file-col-icon"></span>
            <span className="file-col-name">名称</span>
            <span className="file-col-size">大小</span>
            <span className="file-col-date">修改时间</span>
          </div>
          {filteredFiles.map((entry, i) => (
            <div
              key={i}
              className={`file-item ${selectedPaths.has(entry.path) ? 'file-item-selected' : ''}`}
            >
              <span className="file-col-check" onClick={e => e.stopPropagation()}>
                {!entry.is_dir && (
                  <input
                    type="checkbox"
                    checked={selectedPaths.has(entry.path)}
                    onChange={() => toggleSelect(entry.path)}
                  />
                )}
              </span>
              <span className="file-col-icon" onClick={() => handleClick(entry)} onContextMenu={e => handleContextMenu(e, entry)}>
                <FileIcon entry={entry} volume={volume} />
              </span>
              <span className="file-col-name" onClick={() => handleClick(entry)} onContextMenu={e => handleContextMenu(e, entry)}>{entry.name}</span>
              <span className="file-col-size" onClick={() => handleClick(entry)} onContextMenu={e => handleContextMenu(e, entry)}>{entry.is_dir ? '-' : formatSize(entry.size)}</span>
              <span className="file-col-date" onClick={() => handleClick(entry)} onContextMenu={e => handleContextMenu(e, entry)}>{formatDate(entry.mod_time)}</span>
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

      {previewEntry && (
        <FilePreview
          entry={previewEntry}
          volume={volume}
          onClose={() => setPreviewEntry(null)}
        />
      )}
    </div>
  )
}
