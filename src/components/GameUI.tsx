import { useGameStore } from '../store/gameStore';
import { StartScreenUI } from './StartScreenUI';
import { EndScreenUI } from './EndScreenUI';

export function GameUI() {
  const { 
    gameState, 
    round, 
    totalScore, 
    roundScore, 
    targetCities, 
    tempGuess,
    confirmGuess,
    nextRound
  } = useGameStore();

  const currentTarget = targetCities[round - 1];

  if (gameState === 'start') {
    return <StartScreenUI />;
  }

  if (gameState === 'finished') {
    return <EndScreenUI />;
  }

  return (
    <div className="ui-overlay game-hud">
      <div className="hud-top">
        <div className="round-info">Round {round} / 3</div>
        <div className="score-info">Score: {totalScore}</div>
      </div>

      <div className="target-box">
        <div className="label">To Find:</div>
        <div className="city-name">{currentTarget?.name}</div>
      </div>

      {/* Confirm Button */}
      {gameState === 'playing' && tempGuess && (
        <div className="confirm-container">
            <button className="confirm-btn" onClick={confirmGuess}>
                Confirm Guess
            </button>
        </div>
      )}

      {gameState === 'revealed' && (
        <div className="round-result">
          <h3>Round Complete!</h3>
          <p>Score: {roundScore}</p>
          <button onClick={nextRound}>
            {round < 3 ? 'Next Round' : 'Finish Game'}
          </button>
        </div>
      )}
    </div>
  );
}
