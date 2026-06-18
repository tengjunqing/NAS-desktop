import { useAuth } from './context/AuthContext'
import { useHashRoute } from './hooks/useHashRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Files from './pages/Files'
import Photos from './pages/Photos'
import Videos from './pages/Videos'
import Shares from './pages/Shares'
import Admin from './pages/Admin'
import { useState } from 'react'

const ADMIN_PAGE = 'admin'

function App() {
  const { token, user } = useAuth()
  const { page, navigate } = useHashRoute()
  const [selectedVolume, setSelectedVolume] = useState('default')
  const [selectedPath, setSelectedPath] = useState('')

  if (!token || !user) {
    return <Login />
  }

  if (page === ADMIN_PAGE && user.role !== ADMIN_PAGE) {
    navigate('files')
    return null
  }

  const renderPage = () => {
    switch (page) {
      case 'files':
        return (
          <Files
            volume={selectedVolume}
            path={selectedPath}
            onNavigate={(vol, p) => {
              setSelectedVolume(vol)
              setSelectedPath(p)
            }}
          />
        )
      case 'photos':
        return <Photos />
      case 'videos':
        return <Videos />
      case 'shares':
        return <Shares />
      case 'admin':
        return <Admin />
      default:
        return <Files volume={selectedVolume} path={selectedPath} onNavigate={() => {}} />
    }
  }

  return (
    <div className="app-layout">
      <div className="titlebar-drag" />
      <Sidebar />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
