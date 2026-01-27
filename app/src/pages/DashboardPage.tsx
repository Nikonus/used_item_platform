import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const DashboardPage = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="page">
      <header className="navbar glass">
        <div className="nav-left">
          <span className="brand">Used Items Hub</span>
          <nav className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
          </nav>
        </div>
        <div className="nav-right">
          <span className="user-email">{user?.email}</span>
          <button className="secondary-btn" onClick={() => signOut()}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-content">
        <section className="hero-card">
          <h2>Welcome back</h2>
          <p>Secure dashboard. Yahan se tum apne items, orders aur profile manage karoge.</p>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>KYC Status</h3>
            <p>Identity verify karne ke baad tum high-value rentals/sales kar paoge.</p>
            <Link to="/profile" className="link-btn">
              Go to profile
            </Link>
          </div>
          <div className="card">
            <h3>Next steps</h3>
            <ul>
              <li>Apna profile complete karo</li>
              <li>KYC document upload karo</li>
              <li>Apna pehla item list karo</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

