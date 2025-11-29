import { Globe } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function StartScreenUI() {
  const { startGame, gamesPlayed, highScore, totalLifetimeScore } = useGameStore();

  const averageScore = gamesPlayed > 0 ? Math.round(totalLifetimeScore / gamesPlayed) : 0;

  return (
    <div className="ui-overlay start-screen-overlay">
      <div className="start-window">
        <div className="logo-section">
          <Globe size={64} color="#3b82f6" />
          <h1>Blind Globe</h1>
        </div>
        
        <p className="description">
          Test your geography skills! Locate 3 cities on the blank globe relative to a reference point.
        </p>

        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">{gamesPlayed}</div>
            <div className="stat-label">Played</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{highScore}</div>
            <div className="stat-label">High Score</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{averageScore}</div>
            <div className="stat-label">Avg Score</div>
          </div>
        </div>

        <button className="play-btn" onClick={startGame}>
          Play Today's Game
        </button>
      </div>
    </div>
  );
}
