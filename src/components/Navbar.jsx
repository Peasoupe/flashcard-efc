import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ADMIN_EMAIL } from '../lib/admin'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-gray-900 text-lg tracking-tight">
          FlashEFC
        </Link>
        {user && (
          <div className="flex items-center gap-5">
            <Link to="/library" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Bibliothèque
            </Link>
            {user.email === ADMIN_EMAIL && (
              <Link to="/admin" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium">
                Admin
              </Link>
            )}
            <NotificationBell />
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
