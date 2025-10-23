import { useState, useEffect } from 'react';
import Calendar from './Calendar';
import Pagination from './Pagination';
import DrawDetailsModal from './DrawDetailsModal';
import './Lottery.css';

const Eurodreams = () => {
  const [draws, setDraws] = useState([]);
  const [filteredDraws, setFilteredDraws] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const drawsPerPage = 10;

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    filterByDate();
  }, [selectedDate, draws]);

  const loadResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/resultats-cache.json');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des résultats');
      }
      
      const data = await response.json();
      
      if (data.eurodreams && Array.isArray(data.eurodreams)) {
        setDraws(data.eurodreams);
        setFilteredDraws(data.eurodreams);
      } else {
        setDraws([]);
        setFilteredDraws([]);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les résultats Eurodreams');
      setDraws([]);
      setFilteredDraws([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByDate = () => {
    if (!selectedDate) {
      setFilteredDraws(draws);
      setCurrentPage(1);
      return;
    }

    const filtered = draws.filter(draw => {
      const drawDate = new Date(draw.date);
      return drawDate.toDateString() === selectedDate.toDateString();
    });

    setFilteredDraws(filtered);
    setCurrentPage(1);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleResetFilter = () => {
    setSelectedDate(null);
  };

  const openModal = (draw) => {
    setSelectedDraw(draw);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDraw(null);
  };

  const indexOfLastDraw = currentPage * drawsPerPage;
  const indexOfFirstDraw = indexOfLastDraw - drawsPerPage;
  const currentDraws = filteredDraws.slice(indexOfFirstDraw, indexOfLastDraw);
  const totalPages = Math.ceil(filteredDraws.length / drawsPerPage);

  if (isLoading) {
    return (
      <div className="lottery-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement des résultats Eurodreams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lottery-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadResults} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lottery-container eurodreams">
      <div className="lottery-header eurodreams-header">
        <div className="lottery-icon">💤</div>
        <div className="lottery-info">
          <h1>Eurodreams</h1>
          <p className="lottery-description">
            Tirages tous les <strong>Lundis et Jeudis</strong> à 21h
          </p>
          <p className="game-format">6 numéros (1-40) + 1 numéro Dream (1-5)</p>
        </div>
      </div>

      <div className="view-toggle">
        <button 
          className={`toggle-btn ${!showCalendar ? 'active' : ''}`}
          onClick={() => setShowCalendar(false)}
        >
          📋 Liste des résultats
        </button>
        <button 
          className={`toggle-btn ${showCalendar ? 'active' : ''}`}
          onClick={() => setShowCalendar(true)}
        >
          📅 Calendrier
        </button>
      </div>

      {showCalendar && (
        <div className="calendar-section">
          <Calendar 
            draws={draws}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
          {selectedDate && (
            <button className="reset-filter" onClick={handleResetFilter}>
              ✕ Réinitialiser le filtre
            </button>
          )}
        </div>
      )}

      {filteredDraws.length === 0 ? (
        <div className="no-results">
          <p>Aucun résultat disponible pour cette date</p>
          <button onClick={handleResetFilter} className="retry-button">
            Voir tous les résultats
          </button>
        </div>
      ) : (
        <>
          <div className="results-info">
            <span className="results-count">
              {filteredDraws.length} tirage{filteredDraws.length > 1 ? 's' : ''} trouvé{filteredDraws.length > 1 ? 's' : ''}
            </span>
            {selectedDate && (
              <span className="filter-info">
                📅 Filtre actif : {selectedDate.toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          <div className="draws-list">
            {currentDraws.map((draw, index) => (
              <div key={draw.id || index} className="draw-card eurodreams-card">
                <div className="draw-header">
                  <div className="draw-date">
                    <span className="day">{draw.day}</span>
                    <span className="date">{draw.formattedDate}</span>
                  </div>
                  <div className="draw-jackpot eurodreams-jackpot">
                    <span className="jackpot-label">💰 Rente</span>
                    <span className="jackpot-amount">{draw.jackpot}</span>
                  </div>
                </div>

                <div className="draw-numbers">
                  <div className="numbers-section">
                    <span className="numbers-label">Numéros :</span>
                    <div className="numbers">
                      {draw.numbers && draw.numbers.map((num, idx) => (
                        <div key={idx} className="ball eurodreams-ball">{num}</div>
                      ))}
                    </div>
                  </div>

                  <div className="dream-section">
                    <span className="dream-label">💤 Dream :</span>
                    <div className="dream-number">{draw.dreamNumber}</div>
                  </div>
                </div>

                <button 
                  className="details-button"
                  onClick={() => openModal(draw)}
                >
                  Voir les détails complets
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {isModalOpen && selectedDraw && (
        <DrawDetailsModal
          draw={selectedDraw}
          gameType="eurodreams"
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default Eurodreams;

