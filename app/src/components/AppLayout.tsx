import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth()

  return (
    <div className="page">
      <header className="navbar glass">
        <div className="nav-left">
          <Link to="/" className="brand">
            Used Items Hub
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/items/new">Add item</NavLink>
            <NavLink to="/my-listings">My listings</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
        </div>
        <div className="nav-right">
          <span className="user-email">{user?.email}</span>
          <button className="secondary-btn" onClick={() => signOut()}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-content">{children}</main>

      <Link className="fab" to="/items/new" aria-label="Add item">
        + Sell/Rent
      </Link>
    </div>
  )
}

