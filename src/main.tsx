import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.tsx'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'
import Home from './pages/Home.tsx'
import KycPage from './pages/Kyc.tsx'
import AccountsList from './pages/AccountsList.tsx'
import AccountDetail from './pages/AccountDetail.tsx'
import Admin from './pages/Admin.tsx'
import AdminUserDetail from './pages/AdminUserDetail.tsx'
import AdminReconcile from './pages/AdminReconcile.tsx'
import AdminAudit from './pages/AdminAudit.tsx'
import SecurityPage from './pages/Security.tsx'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const allowed = user && (user.role === 'ADMIN' || user.role === 'STAFF')
  if (!allowed) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function RedirectByRole() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'STAFF') return <Navigate to="/admin" replace />
  if (user?.role === 'ACCOUNT_HOLDER') {
    if ((user as any).totpEnabled === false || (user as any).mfaEnabled === false) return <Navigate to="/security" replace />
    return <Navigate to="/holder" replace />
  }
  return <Home />
}

function RequireHolder2FA({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const needs2FA = !!(user && user.role === 'ACCOUNT_HOLDER' && ((user as any).totpEnabled === false || (user as any).mfaEnabled === false))
  if (needs2FA) return <Navigate to="/security" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RedirectByRole /> },
      { path: 'kyc', element: <RequireAuth><KycPage /></RequireAuth> },
      { path: 'holder', element: <RequireAuth><RequireHolder2FA><Home /></RequireHolder2FA></RequireAuth> },
      { path: 'accounts', element: <RequireAuth><RequireHolder2FA><AccountsList /></RequireHolder2FA></RequireAuth> },
      { path: 'accounts/:accountId', element: <RequireAuth><RequireHolder2FA><AccountDetail /></RequireHolder2FA></RequireAuth> },
      { path: 'security', element: <RequireAuth><SecurityPage /></RequireAuth> },
      { path: 'admin', element: <RequireAuth><RequireStaff><Admin /></RequireStaff></RequireAuth> },
      { path: 'admin/reconcile', element: <RequireAuth><RequireStaff><AdminReconcile /></RequireStaff></RequireAuth> },
      { path: 'admin/audit', element: <RequireAuth><RequireStaff><AdminAudit /></RequireStaff></RequireAuth> },
      { path: 'admin/users/:userId', element: <RequireAuth><RequireStaff><AdminUserDetail /></RequireStaff></RequireAuth> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
    ]
  }
])

function AppBootstrap() {
  const { isBootstrapping } = useAuth()
  if (isBootstrapping) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading…</div>
  }
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppBootstrap />
    </AuthProvider>
  </StrictMode>,
)
