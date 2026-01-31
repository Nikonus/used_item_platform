import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth()
  const { itemCount } = useCart()

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
            <NavLink to="/my-orders">
              My orders
              {itemCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: 'var(--text-main)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {itemCount}
                </span>
              )}
            </NavLink>
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

