import { Link, Outlet } from "react-router-dom"
import { useAuth } from "./auth/AuthContext"

export default function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'STAFF')
  const brandBoxClass = isAdmin ? 'bg-emerald-600' : 'bg-blue-600'
  const ctaClass = isAdmin ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className={`sticky top-0 z-20 border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 ${isAdmin ? 'ring-1 ring-emerald-50' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <span className={`inline-grid place-items-center h-8 w-8 rounded-lg ${brandBoxClass} text-white font-semibold shadow-sm`}>M</span>
            <span className={`font-semibold text-lg tracking-tight ${isAdmin ? 'text-emerald-700' : ''}`}>Mal Bank</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {!isAdmin && <Link to="/accounts" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">Accounts</Link>}
            {!isAdmin && <Link to="/kyc" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">KYC</Link>}
            {!isAdmin && <Link to="/security" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">Security</Link>}
            {isAdmin && (
              <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50">Admin</Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm">Login</Link>
                <Link to="/signup" className={`px-3.5 py-2 rounded-md text-sm font-medium ${ctaClass} text-white shadow-sm`}>Open account</Link>
              </>
            ) : (
              <>
                <span className="hidden sm:inline text-sm text-slate-600">{user?.email}</span>
                <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm">Logout</button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4">
        <div className="rounded-xl border bg-white shadow-sm p-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
