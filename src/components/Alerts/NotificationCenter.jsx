import { useState, useEffect } from 'react'
import { 
  getNotifications, 
  markNotificationAsRead, 
  clearNotifications,
  getUnreadCount 
} from '../../services/alertService'
import './Alerts.css'

export default function NotificationCenter({ userId, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = () => {
    const notifs = getNotifications(userId)
    setNotifications(notifs)
  }

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(userId, notificationId)
    loadNotifications()
  }

  const handleClearAll = () => {
    if (window.confirm('Voulez-vous vraiment supprimer toutes les notifications ?')) {
      clearNotifications(userId)
      setNotifications([])
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
            Non lues ({getUnreadCount(userId)})
          </button>
          {notifications.length > 0 && (
            <button className="clear-btn" onClick={handleClearAll}>
              🗑️ Tout effacer
            </button>
          )}
        </div>

        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
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
                key={notification.timestamp}
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification.timestamp)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationItem({ notification, onMarkAsRead }) {
  const formattedDate = new Date(notification.timestamp).toLocaleString('fr-FR', {
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
            <span className="draw-date">
              📅 {new Date(notification.draw.date).toLocaleDateString('fr-FR')}
            </span>
            {notification.draw.numbers && (
              <span className="draw-numbers">
                🎲 {notification.draw.numbers.join(' - ')}
                {notification.draw.stars && ` ⭐ ${notification.draw.stars.join(' - ')}`}
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

