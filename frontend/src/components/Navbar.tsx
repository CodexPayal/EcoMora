import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/identify', label: 'Identify Species', icon: '🔍' },
  { to: '/sightings', label: 'Sightings', icon: '🌿' },
  { to: '/log', label: 'Add Sighting', icon: '➕' },
  { to: '/map', label: 'Biodiversity Map', icon: '🗺️' },
  { to: '/chat', label: 'Ask EcoMora', icon: '💬' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-earth-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-forest-800">EcoMora</span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-forest-100 text-forest-800'
                      : 'text-bark-600 hover:bg-earth-100 hover:text-forest-700'
                  }`
                }
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg border border-earth-300 px-3 py-2 text-sm font-medium text-bark-600 hover:bg-earth-100"
          >
            Logout
          </button>
        </div>

        <div className="overflow-x-auto border-t border-earth-100 lg:hidden">
          <nav className="flex min-w-max gap-1 px-4 py-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-xs font-medium ${
                    isActive
                      ? 'bg-forest-100 text-forest-800'
                      : 'text-bark-600'
                  }`
                }
              >
                {link.icon} {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  )
}