import { createContext, useContext, useState, useEffect } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('currentUser')
      const token = localStorage.getItem('token')
      
      if (savedUser && token) {
        setUser(JSON.parse(savedUser))
        
        // Vérifier que le token est toujours valide
        try {
          const profile = await authService.getProfile()
          if (profile) {
            setUser(profile)
          } else {
            // Token invalide, déconnecter
            setUser(null)
            authService.logout()
          }
        } catch (error) {
          console.error('Error loading profile:', error)
          setUser(null)
        }
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = async (email, password) => {
    const result = await authService.login(email, password)
    
    if (result.success) {
      setUser(result.user)
    }
    
    return result
  }

  const register = async (name, email, password) => {
    const result = await authService.register(name, email, password)
    
    if (result.success) {
      setUser(result.user)
    }
    
    return result
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  const updatePreferences = async (newPreferences) => {
    if (!user) return

    const result = await authService.updatePreferences(newPreferences)
    
    if (result.success) {
      setUser(result.user)
    }
    
    return result
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updatePreferences
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

