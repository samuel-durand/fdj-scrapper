// Service de gestion des alertes personnalisées

export const ALERT_TYPES = {
  JACKPOT_THRESHOLD: 'jackpot_threshold',
  FAVORITE_NUMBERS: 'favorite_numbers',
  NEW_DRAW: 'new_draw',
  WINNING_COMBINATION: 'winning_combination',
  LUCKY_NUMBER_MATCH: 'lucky_number_match'
}

export const GAMES = {
  EUROMILLIONS: 'euromillions',
  LOTO: 'loto',
  EURODREAMS: 'eurodreams'
}

// Créer une nouvelle alerte
export function createAlert(userId, alertConfig) {
  const alerts = getAlerts(userId)
  
  const newAlert = {
    id: Date.now().toString(),
    userId,
    enabled: true,
    createdAt: new Date().toISOString(),
    ...alertConfig
  }
  
  alerts.push(newAlert)
  saveAlerts(userId, alerts)
  
  return newAlert
}

// Récupérer toutes les alertes d'un utilisateur
export function getAlerts(userId) {
  const key = `alerts_${userId}`
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

// Sauvegarder les alertes
function saveAlerts(userId, alerts) {
  const key = `alerts_${userId}`
  localStorage.setItem(key, JSON.stringify(alerts))
}

// Supprimer une alerte
export function deleteAlert(userId, alertId) {
  const alerts = getAlerts(userId)
  const filtered = alerts.filter(a => a.id !== alertId)
  saveAlerts(userId, filtered)
}

// Activer/désactiver une alerte
export function toggleAlert(userId, alertId) {
  const alerts = getAlerts(userId)
  const alert = alerts.find(a => a.id === alertId)
  if (alert) {
    alert.enabled = !alert.enabled
    saveAlerts(userId, alerts)
  }
  return alert
}

// Mettre à jour une alerte
export function updateAlert(userId, alertId, updates) {
  const alerts = getAlerts(userId)
  const index = alerts.findIndex(a => a.id === alertId)
  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...updates }
    saveAlerts(userId, alerts)
    return alerts[index]
  }
  return null
}

// Vérifier si un tirage déclenche des alertes
export function checkDrawForAlerts(userId, draw, gameType) {
  const alerts = getAlerts(userId).filter(a => a.enabled && a.game === gameType)
  const triggered = []
  
  for (const alert of alerts) {
    let isTriggered = false
    let message = ''
    
    switch (alert.type) {
      case ALERT_TYPES.JACKPOT_THRESHOLD:
        isTriggered = checkJackpotThreshold(draw, alert)
        if (isTriggered) {
          message = `🎰 Le jackpot ${gameType.toUpperCase()} atteint ${draw.jackpot} !`
        }
        break
        
      case ALERT_TYPES.FAVORITE_NUMBERS:
        const matchResult = checkFavoriteNumbers(draw, alert)
        isTriggered = matchResult.isTriggered
        if (isTriggered) {
          message = `🎯 ${matchResult.count} de vos numéros favoris sont sortis : ${matchResult.matched.join(', ')} !`
        }
        break
        
      case ALERT_TYPES.NEW_DRAW:
        isTriggered = true
        message = `🆕 Nouveau tirage ${gameType.toUpperCase()} disponible !`
        break
        
      case ALERT_TYPES.LUCKY_NUMBER_MATCH:
        const luckyMatch = checkLuckyNumber(draw, alert, gameType)
        isTriggered = luckyMatch.isTriggered
        if (isTriggered) {
          message = `⭐ Votre numéro chance ${alert.luckyNumber} est sorti !`
        }
        break
        
      default:
        break
    }
    
    if (isTriggered) {
      triggered.push({
        alertId: alert.id,
        alertName: alert.name,
        message,
        draw,
        gameType,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  // Sauvegarder les notifications déclenchées via l'API
  if (triggered.length > 0) {
    // Note: Les notifications sont maintenant gérées par le backend
    // Cette fonction est conservée pour la compatibilité mais ne fait plus rien
    // Les notifications seront créées côté serveur lors de la vérification des alertes
  }
  
  return triggered
}

// Vérifier le seuil de jackpot
function checkJackpotThreshold(draw, alert) {
  if (!draw.jackpot || draw.jackpot === 'Non disponible') return false
  
  // Extraire le montant numérique du jackpot
  const jackpotAmount = parseJackpotAmount(draw.jackpot)
  return jackpotAmount >= alert.threshold
}

// Extraire le montant du jackpot
function parseJackpotAmount(jackpotString) {
  // "17 000 000 €" ou "17M€" -> 17000000
  const cleaned = jackpotString.replace(/\s/g, '').replace(/€/g, '')
  
  if (cleaned.includes('M')) {
    return parseFloat(cleaned.replace('M', '')) * 1000000
  }
  
  return parseFloat(cleaned.replace(/[^\d.]/g, ''))
}

// Vérifier les numéros favoris
function checkFavoriteNumbers(draw, alert) {
  const drawNumbers = [...(draw.numbers || []), ...(draw.balls || [])]
  const matched = alert.numbers.filter(num => drawNumbers.includes(num))
  
  return {
    isTriggered: matched.length >= (alert.minMatches || 1),
    count: matched.length,
    matched
  }
}

// Vérifier le numéro chance
function checkLuckyNumber(draw, alert, gameType) {
  let isTriggered = false
  
  if (gameType === 'euromillions') {
    isTriggered = draw.stars?.includes(alert.luckyNumber)
  } else if (gameType === 'loto') {
    isTriggered = draw.luckyNumber === alert.luckyNumber
  }
  
  return { isTriggered }
}

// Sauvegarder les notifications
function saveNotifications(userId, newNotifications) {
  const existing = getNotifications(userId)
  const updated = [...newNotifications, ...existing].slice(0, 50) // Garder max 50 notifications
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated))
}

// Récupérer les notifications
export function getNotifications(userId) {
  const stored = localStorage.getItem(`notifications_${userId}`)
  return stored ? JSON.parse(stored) : []
}

// Marquer une notification comme lue
export function markNotificationAsRead(userId, notificationId) {
  const notifications = getNotifications(userId)
  const notification = notifications.find(n => n.timestamp === notificationId)
  if (notification) {
    notification.read = true
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications))
  }
}

// Supprimer toutes les notifications
export function clearNotifications(userId) {
  localStorage.removeItem(`notifications_${userId}`)
}

// Obtenir le nombre de notifications non lues
export function getUnreadCount(userId) {
  const notifications = getNotifications(userId)
  return notifications.filter(n => !n.read).length
}

// Vérifier automatiquement les nouveaux tirages
export function checkNewDraws(userId, allDraws) {
  const lastChecked = localStorage.getItem(`last_check_${userId}`)
  const lastCheckTime = lastChecked ? new Date(lastChecked) : new Date(0)
  
  const allTriggered = []
  
  // Vérifier tous les tirages récents
  for (const gameType of Object.values(GAMES)) {
    const gameDraws = allDraws[gameType] || []
    
    for (const draw of gameDraws) {
      const drawDate = new Date(draw.date)
      if (drawDate > lastCheckTime) {
        const triggered = checkDrawForAlerts(userId, draw, gameType)
        allTriggered.push(...triggered)
      }
    }
  }
  
  // Mettre à jour le timestamp de dernière vérification
  localStorage.setItem(`last_check_${userId}`, new Date().toISOString())
  
  return allTriggered
}

// Templates d'alertes prédéfinies
export const ALERT_TEMPLATES = {
  bigJackpot: (game) => ({
    type: ALERT_TYPES.JACKPOT_THRESHOLD,
    game,
    name: `Gros jackpot ${game.toUpperCase()}`,
    threshold: 100000000, // 100M€
    enabled: true
  }),
  
  favoriteNumbers: (game, numbers) => ({
    type: ALERT_TYPES.FAVORITE_NUMBERS,
    game,
    name: 'Mes numéros favoris',
    numbers,
    minMatches: 3,
    enabled: true
  }),
  
  newDraw: (game) => ({
    type: ALERT_TYPES.NEW_DRAW,
    game,
    name: `Nouveau tirage ${game.toUpperCase()}`,
    enabled: true
  }),
  
  luckyNumber: (game, number) => ({
    type: ALERT_TYPES.LUCKY_NUMBER_MATCH,
    game,
    name: 'Mon numéro chance',
    luckyNumber: number,
    enabled: true
  })
}

