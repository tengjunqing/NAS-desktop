const SERVER_KEY = 'mynas_server_url'
const TOKEN_KEY = 'mynas_token'

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_KEY) || ''
}

export function setServerUrl(url: string): void {
  localStorage.setItem(SERVER_KEY, url)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  return apiFetchWithRetry(path, options, 0)
}

async function apiFetchWithRetry(path: string, options: RequestInit, retryCount: number): Promise<any> {
  const serverUrl = getServerUrl()
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${serverUrl}/api${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (res.status === 401) {
      clearAuth()
      window.location.reload()
      throw new Error('Session expired')
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || res.statusText)
    }

    return res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时')
    }
    if (retryCount < 2 && err.message !== 'Session expired') {
      await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000))
      return apiFetchWithRetry(path, options, retryCount + 1)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function login(serverUrl: string, username: string, password: string) {
  const res = await fetch(`${serverUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    throw new Error('连接失败或密码错误')
  }

  const data = await res.json()
  setServerUrl(serverUrl)
  setToken(data.access_token)
  return data
}

export async function getMe() {
  return apiFetch('/auth/me')
}

export async function browseFiles(volume: string, path: string = '') {
  const p = path ? `/${path}` : ''
  return apiFetch(`/files/browse/${volume}${p}`)
}

export function uploadFiles(
  volume: string,
  path: string,
  files: File[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const serverUrl = getServerUrl()
    const token = getToken()
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${serverUrl}/api/files/upload/${volume}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve({})
        }
      } else {
        reject(new Error('上传失败'))
      }
    }

    xhr.onerror = () => reject(new Error('上传失败'))
    xhr.send(formData)
  })
}

export async function createDirectory(volume: string, path: string, name: string) {
  return apiFetch(`/files/mkdir/${volume}/${path}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function deleteFile(volume: string, path: string) {
  return apiFetch(`/files/delete/${volume}/${path}`, { method: 'DELETE' })
}

export async function moveFile(volume: string, oldPath: string, newPath: string) {
  return apiFetch('/files/move', {
    method: 'POST',
    body: JSON.stringify({ volume, old_path: oldPath, new_path: newPath }),
  })
}

export async function getDownloadUrl(volume: string, path: string): Promise<string> {
  const serverUrl = getServerUrl()
  const token = getToken()
  return `${serverUrl}/api/files/download/${volume}/${path}?token=${encodeURIComponent(token || '')}`
}

export async function listVolumes() {
  return apiFetch('/volumes')
}

export async function getPhotoTimeline() {
  return apiFetch('/photos/timeline')
}

export async function getRecentPhotos() {
  return apiFetch('/photos/recent')
}

export async function getVideoList() {
  return apiFetch('/videos/list')
}

export async function getShares() {
  return apiFetch('/shares')
}

export async function createShare(volume: string, path: string, password?: string, expiresIn?: string, maxDownloads?: number) {
  return apiFetch('/shares', {
    method: 'POST',
    body: JSON.stringify({ volume, path, password, expires_in: expiresIn, max_downloads: maxDownloads }),
  })
}

export async function deleteShare(id: number) {
  return apiFetch(`/shares/${id}`, { method: 'DELETE' })
}

export async function listUsers() {
  return apiFetch('/admin/users')
}

export async function createUser(username: string, password: string) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function deleteUser(id: number) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function getStorageStats(volume: string) {
  return apiFetch(`/files/stats/${volume}`)
}