import { useState, useMemo, useEffect } from 'react'
import './Pagination.css'

function Pagination({ draws, itemsPerPage = 5, onPageChange }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMonth, setSelectedMonth] = useState('all')
  
  // Extraire les mois disponibles
  const availableMonths = useMemo(() => {
    const months = new Set()
    draws.forEach(draw => {
      const date = new Date(draw.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.add(monthYear)
    })
    return Array.from(months).sort().reverse()
  }, [draws])
  
  // Filtrer par mois
  const filteredDraws = useMemo(() => {
    if (selectedMonth === 'all') return draws
    
    return draws.filter(draw => {
      const date = new Date(draw.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return monthYear === selectedMonth
    })
  }, [draws, selectedMonth])
  
  // Calculer la pagination
  const totalPages = Math.ceil(filteredDraws.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDraws = filteredDraws.slice(startIndex, endIndex)
  
  // Gérer le changement de page
  const handlePageChange = (page) => {
    setCurrentPage(page)
    if (onPageChange) {
      onPageChange(filteredDraws.slice((page - 1) * itemsPerPage, page * itemsPerPage))
    }
  }
  
  // Gérer le changement de mois
  const handleMonthChange = (month) => {
    setSelectedMonth(month)
    setCurrentPage(1) // Revenir à la page 1
  }
  
  // Formater le nom du mois
  const getMonthName = (monthYear) => {
    if (monthYear === 'all') return 'Tous les mois'
    const [year, month] = monthYear.split('-')
    const date = new Date(year, parseInt(month) - 1)
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  
  // Notifier le parent du changement de page
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentDraws)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedMonth, filteredDraws, itemsPerPage, currentDraws.length])
  
  return (
    <div className="pagination-container">
      {/* Filtre par mois */}
      <div className="month-filter">
        <label htmlFor="month-select">📅 Filtrer par mois :</label>
        <select 
          id="month-select"
          value={selectedMonth} 
          onChange={(e) => handleMonthChange(e.target.value)}
          className="month-select"
        >
          <option value="all">Tous les mois ({draws.length} tirages)</option>
          {availableMonths.map(month => {
            const count = draws.filter(draw => {
              const date = new Date(draw.date)
              const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              return monthYear === month
            }).length
            return (
              <option key={month} value={month}>
                {getMonthName(month)} ({count} tirages)
              </option>
            )
          })}
        </select>
      </div>
      
      {/* Info pagination */}
      <div className="pagination-info">
        Affichage de <strong>{startIndex + 1}</strong> à <strong>{Math.min(endIndex, filteredDraws.length)}</strong> sur <strong>{filteredDraws.length}</strong> tirages
      </div>
      
      {/* Navigation pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Précédent
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`pagination-page ${page === currentPage ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}

export default Pagination

