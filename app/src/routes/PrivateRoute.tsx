import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const PrivateRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="card">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

