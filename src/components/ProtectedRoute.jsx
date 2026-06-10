import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi, getToken, clearAuth } from '../lib/api'

function ProtectedRoute({ children }) {
  // 'loading' | 'authed' | 'guest'
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // No token at all → straight to login, no need to hit the API.
    if (!getToken()) {
      setStatus('guest')
      return
    }

    // Confirm the session with GET /user. 401 clears the token (handled in api.js).
    authApi
      .me()
      .then(() => setStatus('authed'))
      .catch(() => {
        clearAuth()
        setStatus('guest')
      })
  }, [])

  // بينما يفحص الجلسة، اعرض شاشة تحميل
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        جاري التحميل...
      </div>
    )
  }

  // لو ما في جلسة، حوّل للـ login
  if (status === 'guest') {
    return <Navigate to="/login" replace />
  }

  // في جلسة → اعرض الصفحة
  return children
}

export default ProtectedRoute
