import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))
    setLoading(false)
    setInitialLoad(false)
  }, [])

  const register = async (username, email) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { username, email })
      return { success: true, user: res.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  const login = async (privateKey) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { privateKey })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      setUser(res.data)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!initialLoad && children}
    </AuthContext.Provider>
  )
}

export default AuthContext
