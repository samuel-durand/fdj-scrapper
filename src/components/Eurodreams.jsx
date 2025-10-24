import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import DrawDetailsModal from './DrawDetailsModal';
import './Lottery.css';

const Eurodreams = () => {
  const [draws, setDraws] = useState([]);
  const [displayedDraws, setDisplayedDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

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
        setDisplayedDraws(data.eurodreams.slice(0, 5));
      } else {
        setDraws([]);
        setDisplayedDraws([]);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError('Impossible de charger les résultats Eurodreams');
      setDraws([]);
      setDisplayedDraws([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (draw) => {
    setSelectedDraw(draw);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDraw(null);
  };

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

      {draws.length === 0 ? (
        <div className="no-results">
          <p>Aucun résultat disponible</p>
          <button onClick={loadResults} className="retry-button">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <Pagination
            draws={draws}
            itemsPerPage={5}
            onPageChange={setDisplayedDraws}
          />
          
          <div className="draws-list">
            {displayedDraws.map((draw, index) => (
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

