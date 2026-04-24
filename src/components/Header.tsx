import { Link, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Camera, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { getUser, logout, type User as IdentityUser } from '@netlify/identity'

export function Header() {
  const [user, setUser] = useState<IdentityUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getUser().then(u => setUser(u ?? null))
  }, [])

  const userRole = (user?.app_metadata as any)?.roles?.[0] || 'client'

  async function handleLogout() {
    await logout()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Camera size={18} className="text-stone-950" />
          </div>
          <span className="gradient-text">CaptureAfrica</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/photographers" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            Photographers
          </Link>
          <Link to="/#how-it-works" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            How It Works
          </Link>
          <Link to="/auth/register?role=photographer" className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium">
            For Photographers
          </Link>
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-sm">
                  {(user.user_metadata?.full_name as string || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm text-stone-200">{(user.user_metadata?.full_name as string) || user.email?.split('@')[0]}</span>
                <ChevronDown size={14} className="text-stone-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-stone-900 border border-stone-700 rounded-xl shadow-xl overflow-hidden">
                  <Link
                    to={userRole === 'admin' ? '/dashboard/admin' : userRole === 'photographer' ? '/dashboard/photographer' : '/dashboard/client'}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-stone-200 hover:bg-stone-800 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-stone-800 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="text-sm font-medium text-stone-300 hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-stone-800 transition-colors"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-800 bg-stone-950 px-4 py-4 space-y-3">
          <Link to="/photographers" className="block py-2 text-stone-300" onClick={() => setMenuOpen(false)}>Photographers</Link>
          <Link to="/#how-it-works" className="block py-2 text-stone-300" onClick={() => setMenuOpen(false)}>How It Works</Link>
          <Link to="/auth/register?role=photographer" className="block py-2 text-stone-300" onClick={() => setMenuOpen(false)}>For Photographers</Link>
          {user ? (
            <>
              <Link
                to={userRole === 'admin' ? '/dashboard/admin' : userRole === 'photographer' ? '/dashboard/photographer' : '/dashboard/client'}
                className="block py-2 text-amber-400"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block py-2 text-red-400 text-left w-full">Sign Out</button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/auth/login" className="flex-1 text-center py-2 border border-stone-700 rounded-lg text-sm" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/auth/register" className="flex-1 text-center py-2 bg-amber-500 text-stone-950 rounded-lg text-sm font-semibold" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
