import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me')
      setUser(data.user)
      return data.user
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const authenticate = useCallback(async (path, values) => {
    const data = await api.post(path, values)
    setUser(data.user)
    return data
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login: (values) => authenticate('/auth/login', values),
      registerParent: (values) => authenticate('/auth/register/parent', values),
      registerTeen: (values) => authenticate('/auth/register/teen', values),
      logout: async () => {
        await api.post('/auth/logout')
        setUser(null)
      },
      refreshUser,
    }),
    [authenticate, loading, refreshUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
