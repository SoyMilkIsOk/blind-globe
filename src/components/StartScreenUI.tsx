import { useGameStore } from '../store/gameStore';
import { DifficultyMeter } from './DifficultyMeter';

export function StartScreenUI() {
  const { startGame, gamesPlayed, highScore, totalLifetimeScore, gameDifficulty } = useGameStore();

  const averageScore = gamesPlayed > 0 ? Math.round(totalLifetimeScore / gamesPlayed) : 0;

  return (
    <div className="ui-overlay start-screen-overlay">
      <div className="start-window">
        <div className="logo-section">
          <div className="logo-glow-wrapper">
            <img src="/blindglobe-nobg.png" alt="Blind Globe Logo" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
          </div>
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

        <div className="daily-difficulty-section">
          <DifficultyMeter score={gameDifficulty} label="Today's Game Difficulty" size="large" />
        </div>

        <button className="play-btn" onClick={startGame}>
          Play Today's Game
        </button>
      </div>
    </div>
  );
}
