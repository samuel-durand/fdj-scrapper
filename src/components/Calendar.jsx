import { useState } from 'react';
import './Calendar.css';

/**
 * Calendrier pour naviguer entre les résultats
 * @param {string} gameType - clé du jeu (games.js)
 * @param {Array} draws - Liste des tirages
 * @param {Function} onDateSelect - Callback quand une date est sélectionnée
 */
function Calendar({ gameType, draws, onDateSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Jours de tirage selon le jeu
  const DRAW_DAYS = {
    euromillions: { days: [2, 5], info: 'Tirages : mardi et vendredi' },
    loto: { days: [1, 3, 6], info: 'Tirages : lundi, mercredi et samedi (+ Super Loto exceptionnels)' },
    eurodreams: { days: [1, 4], info: 'Tirages : lundi et jeudi' },
    keno: { days: [0, 1, 2, 3, 4, 5, 6], info: 'Tirage : tous les soirs' },
    crescendo: { days: [6], info: 'Tirages : le samedi, chaque heure de 13h à 19h' },
    amigo: { days: [0, 1, 2, 3, 4, 5, 6], info: 'Tirages : toutes les 5 minutes' },
  };
  const drawDays = (DRAW_DAYS[gameType] || DRAW_DAYS.loto).days;
  // "AAAA-MM-JJ" lu en heure locale (new Date("AAAA-MM-JJ") serait en UTC)
  const parseLocal = (s) => new Date(`${s}T12:00:00`);
  
  // Obtenir le premier et dernier jour du mois
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Jours de la semaine
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  // Mois de l'année
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const days = [];
    const startDay = firstDay.getDay();
    
    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }
    
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }
    
    return days;
  };
  
  // Vérifier si c'est un jour de tirage
  const isDrawDay = (date) => {
    return drawDays.includes(date.getDay());
  };
  
  // Vérifier si on a des résultats pour cette date
  const hasResults = (date) => {
    return draws.some(draw => {
      const drawDate = parseLocal(draw.date);
      return drawDate.toDateString() === date.toDateString();
    });
  };
  
  // Obtenir les résultats pour une date
  const getResultsForDate = (date) => {
    return draws.find(draw => {
      const drawDate = parseLocal(draw.date);
      return drawDate.toDateString() === date.toDateString();
    });
  };
  
  // Navigation
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Sélection de date
  const handleDateClick = (date) => {
    const results = getResultsForDate(date);
    if (results) {
      onDateSelect(results);
    }
  };
  
  const calendarDays = generateCalendarDays();
  const today = new Date();
  
  return (
    <div className={`calendar ${gameType}`}>
      <div className="calendar-header">
        <button onClick={previousMonth} className="nav-button">
          ◀
        </button>
        
        <div className="calendar-title">
          <h3>{months[month]} {year}</h3>
          <button onClick={goToToday} className="today-button">
            Aujourd'hui
          </button>
        </div>
        
        <button onClick={nextMonth} className="nav-button">
          ▶
        </button>
      </div>
      
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot draw-day"></span>
          <span>Jour de tirage</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot has-results"></span>
          <span>Résultats disponibles</span>
        </div>
      </div>
      
      <div className="calendar-grid">
        {/* En-tête des jours */}
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {/* Jours du calendrier */}
        {calendarDays.map((dayObj, index) => {
          const isToday = dayObj.date.toDateString() === today.toDateString();
          const isDraw = isDrawDay(dayObj.date);
          const hasRes = hasResults(dayObj.date);
          
          return (
            <div
              key={index}
              className={`calendar-day ${
                !dayObj.isCurrentMonth ? 'other-month' : ''
              } ${isToday ? 'today' : ''} ${
                isDraw ? 'draw-day' : ''
              } ${hasRes ? 'has-results' : ''}`}
              onClick={() => dayObj.isCurrentMonth && handleDateClick(dayObj.date)}
            >
              <span className="day-number">{dayObj.day}</span>
              {hasRes && <span className="results-indicator">•</span>}
            </div>
          );
        })}
      </div>
      
      <div className="calendar-info">
        <p className="draw-days-info">
          {(DRAW_DAYS[gameType] || DRAW_DAYS.loto).info}
        </p>
      </div>
    </div>
  );
}

export default Calendar;

