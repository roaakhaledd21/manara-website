import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShieldCheck, PenLine, Users, TrendingUp, Archive,
  Settings, HelpCircle, LogOut,
} from 'lucide-react'
import logo from '../assets/somecomponants/logo.png'
import { authApi, clearAuth, getUser } from '../lib/api'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Current user (from login/register). Falls back to the original placeholder labels.
  const user = getUser()
  const displayName = user?.name || 'ANALYST_042'
  const handle = user?.userName ? `@${user.userName}` : 'LEVEL 4 CLEARANCE'
  const initials = (user?.name || 'A').trim().charAt(0).toUpperCase()

  const handleLogout = async () => {
    try {
      await authApi.logout() // POST /logout
    } catch {
      /* ignore — clear locally regardless */
    }
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Verify News', icon: ShieldCheck, path: '/verify-news' },
    { label: 'News Composer', icon: PenLine, path: '/news-composer' },
    { label: 'Community', icon: Users, path: '/community' },
    { label: 'Trending News', icon: TrendingUp, path: '/trending-news' },
    { label: 'Misinformation Archive', icon: Archive, path: '/archive' },
  ]

  return (
    <aside className="w-64 bg-white flex flex-col justify-between border-r border-gray-200 sticky top-0 h-screen">
      <div>
        {/* Logo */}
        <div className="px-6 py-6">
          <img src={logo} alt="Manara" className="h-8" />
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-6">

        {/* Telegram Button */}
        <a
          href="https://t.me/manara_news_bot"
          target="_blank"
          rel="noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 mb-4"
        >
         
          Get Telegram Bot
        </a>

        <div className="flex flex-col gap-1 mb-4">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            <Settings size={20} /> Settings
          </button>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
            <HelpCircle size={20} /> Support
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 pt-4 border-t border-gray-200">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-400 truncate">{handle}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-gray-400 hover:text-red-500 transition shrink-0"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar