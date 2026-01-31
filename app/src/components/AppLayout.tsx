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
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/items/new">Add item</NavLink>
            <NavLink to="/my-listings">My listings</NavLink>
            <NavLink to="/my-orders">
              My orders
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
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

      {/* ✅ FOOTER START */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>Used Items Hub</strong>
            <p>Rent, Buy & Sell smarter within your community.</p>
          </div>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/items/new">Post Item</Link>
            <Link to="/profile">My Profile</Link>
            <Link to="/my-orders">Orders</Link>
          </div>

          <p className="footer-copy">
            © {new Date().getFullYear()} Used Items Hub. All rights reserved.
          </p>
        </div>
      </footer>
      {/* ✅ FOOTER END */}

      <Link className="fab" to="/items/new" aria-label="Add item">
        + Sell/Rent
      </Link>
    </div>
  )
}
