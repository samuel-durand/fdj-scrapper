import { api } from './api'

// Récupérer toutes les notifications de l'utilisateur
export const getNotifications = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString()
    const response = await api.get(`/notifications${params ? '?' + params : ''}`)
    return {
      success: response.success,
      data: response.data || [],
      unreadCount: response.unreadCount || 0
    }
  } catch (error) {
    console.error('Get notifications error:', error)
    return {
      success: false,
      data: [],
      unreadCount: 0
    }
  }
}

// Obtenir le nombre de notifications non lues
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count')
    return response.success ? response.count : 0
  } catch (error) {
    console.error('Get unread count error:', error)
    return 0
  }
}

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`, {})
    return {
      success: response.success,
      data: response.data
    }
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Marquer toutes les notifications comme lues
export const markAllAsRead = async () => {
  try {
    const response = await api.patch('/notifications/mark-all-read', {})
    return {
      success: response.success,
      count: response.count
    }
  } catch (error) {
    console.error('Mark all as read error:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`)
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    console.error('Delete notification error:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    }
  }
}

// Supprimer toutes les notifications
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/notifications')
    return {
      success: response.success,
      count: response.count
    }
  } catch (error) {
    console.error('Clear all notifications error:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    }
  }
}

// Créer une notification
export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications', notificationData)
    return {
      success: response.success,
      data: response.data
    }
  } catch (error) {
    console.error('Create notification error:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la création'
    }
  }
}

