import { FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export const AuthPage = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail
    const err = await fn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError(null)
    const err = await signInWithGoogle()
    if (err) setError(err.message)
  }

  return (
    <div className="fullscreen-center bg-base">
      <div className="auth-card">
        <h1 className="title">Used Items Hub</h1>
        <p className="subtitle">Secure login to rent, buy & sell.</p>

        <div className="toggle-row">
          <button
            type="button"
            className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`toggle-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        <div className="divider">or</div>

        <button className="secondary-btn" type="button" onClick={handleGoogle}>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

