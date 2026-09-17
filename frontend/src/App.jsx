import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (response.status === 401) {
    return { authenticated: false }
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function App() {
  const [user, setUser] = useState(null)
  const [graphProfile, setGraphProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUser = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchJson(`${API_BASE}/bff/user`)
      setUser(data.authenticated ? data : null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/azure`
  }

  const handleLogout = async () => {
    try {
      const csrfData = await fetchJson(`${API_BASE}/api/csrf`, {
        credentials: 'include',
      })

      if (csrfData?.token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfData.token,
          },
        })
      }
    } catch (err) {
      console.warn('Logout request failed; continuing with local logout flow.', err)
    } finally {
      setUser(null)
      setGraphProfile(null)
      setError('')
      window.location.href = window.location.origin
    }
  }

  const loadGraphProfile = async () => {
    try {
      setError('')
      const data = await fetchJson(`${API_BASE}/bff/graph/me`)
      setGraphProfile(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">BFF demo</p>
        <h1>React + Spring BFF + Azure AD</h1>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p>Loading session...</p>
        ) : user ? (
          <>
            <div className="user-box">
              <strong>Authenticated</strong>
              <p>Principal: {user.principal}</p>
              <p>Token present: {String(user.accessTokenPresent)}</p>
            </div>

            <div className="actions">
              <button type="button" onClick={loadGraphProfile}>Call Graph via BFF</button>
              <button type="button" className="secondary" onClick={handleLogout}>Logout</button>
            </div>

            {graphProfile && (
              <pre>{JSON.stringify(graphProfile, null, 2)}</pre>
            )}
          </>
        ) : (
          <>
            <p>You are not signed in.</p>
            <button type="button" onClick={handleLogin}>Login with Azure</button>
          </>
        )}
      </section>
    </main>
  )
}

export default App
