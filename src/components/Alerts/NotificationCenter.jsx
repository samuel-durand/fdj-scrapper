import { useState, useEffect } from 'react'
import { 
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  clearAllNotifications
} from '../../services/notificationService'
import './Alerts.css'

export default function NotificationCenter({ userId, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread

  useEffect(() => {
    if (userId) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [userId])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const filters = filter === 'unread' ? { read: 'false' } : {}
      const result = await getNotifications(filters)
      if (result.success) {
        setNotifications(result.data || [])
        setUnreadCount(result.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    const count = await getUnreadCount()
    setUnreadCount(count)
  }

  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [filter, userId])

  const handleMarkAsRead = async (notificationId) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      await loadNotifications()
      await loadUnreadCount()
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead()
    if (result.success) {
      await loadNotifications()
      await loadUnreadCount()
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer toutes les notifications ?')) {
      const result = await clearAllNotifications()
      if (result.success) {
        setNotifications([])
        setUnreadCount(0)
      }
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="notification-center-overlay" onClick={onClose}>
      <div className="notification-center" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h2>🔔 Notifications</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="notification-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non lues ({unreadCount})
          </button>
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
              ✓ Tout marquer comme lu
            </button>
          )}
          {notifications.length > 0 && (
            <button className="clear-btn" onClick={handleClearAll}>
              🗑️ Tout effacer
            </button>
          )}
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="loading-notifications">
              <div className="spinner"></div>
              <p>Chargement des notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <span className="empty-icon">🔕</span>
              <p>Aucune notification</p>
              <p className="help-text">
                Créez des alertes dans votre profil pour recevoir des notifications
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id || notification.id}
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification._id || notification.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationItem({ notification, onMarkAsRead }) {
  const date = notification.createdAt || notification.timestamp
  const formattedDate = new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const gameIcons = {
    euromillions: '⭐',
    loto: '🍀',
    eurodreams: '💤'
  }

  return (
    <div className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-icon">
        {gameIcons[notification.gameType] || '🎰'}
      </div>
      
      <div className="notification-content">
        <div className="notification-message">
          {notification.message}
        </div>
        
        {notification.draw && (
          <div className="notification-draw-info">
            {notification.draw.date && (
              <span className="draw-date">
                📅 {new Date(notification.draw.date).toLocaleDateString('fr-FR')}
              </span>
            )}
            {notification.draw.numbers && notification.draw.numbers.length > 0 && (
              <span className="draw-numbers">
                🎲 {notification.draw.numbers.join(' - ')}
                {notification.draw.stars && notification.draw.stars.length > 0 && ` ⭐ ${notification.draw.stars.join(' - ')}`}
                {notification.draw.luckyNumber && ` 🍀 ${notification.draw.luckyNumber}`}
              </span>
            )}
          </div>
        )}
        
        <div className="notification-footer">
          <span className="notification-time">{formattedDate}</span>
          {!notification.read && (
            <button className="mark-read-btn" onClick={onMarkAsRead}>
              ✓ Marquer comme lu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

