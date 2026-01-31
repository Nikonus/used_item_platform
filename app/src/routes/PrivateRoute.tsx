import { Navigate, Outlet } from 'react-router-dom'
import { LoadingSkeletonCard } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'

export const PrivateRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fullscreen-center">
        <LoadingSkeletonCard />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

