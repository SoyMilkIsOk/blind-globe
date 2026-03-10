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
    nextRound,
    hintLevel,
    useHint,
    lastDistance
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

      {gameState === 'playing' && (
        <div className="target-container">
            <div className="target-box">
                <div className="label">To Find:</div>
                <div className="city-name">
                    {currentTarget?.name}
                    {hintLevel >= 1 && <span className="country-hint">, {currentTarget?.country}</span>}
                </div>
            </div>

            {/* Hint Button */}
            <button 
                className={`hint-btn ${hintLevel >= 2 ? 'hint-btn--used' : ''}`}
                onClick={useHint} 
                disabled={hintLevel >= 2}
            >
                {hintLevel === 0 && "Hint 1 (-500pts)"}
                {hintLevel === 1 && "Hint 2 (-2000pts)"}
                {hintLevel === 2 && "Hints Used"}
            </button>

            {/* Confirm Button */}
            {tempGuess && (
                <div className="confirm-container">
                    <button className="confirm-btn" onClick={confirmGuess}>
                        Confirm Guess
                    </button>
                </div>
            )}
        </div>
      )}

      {gameState === 'revealed' && (
        <div className="round-result">
          <h3 className="round-result__title">Round Complete!</h3>
          
          <div className="round-result__details">
            <div className="round-result__distance">
                {lastDistance !== null ? `${lastDistance} km` : '??? km'} away from<br/>
                <span className="round-result__city">{currentTarget?.name}, {currentTarget?.country}</span>
            </div>

            <div className="round-result__row">
                <span>Guess Score:</span>
                <span>{roundScore} pts</span>
            </div>
            {hintLevel >= 1 && (
                <div className="round-result__row round-result__row--penalty">
                    <span>Hint 1:</span>
                    <span>-500 pts</span>
                </div>
            )}
            {hintLevel >= 2 && (
                <div className="round-result__row round-result__row--penalty">
                    <span>Hint 2:</span>
                    <span>-2000 pts</span>
                </div>
            )}
            <div className="round-result__total">
                <span>Round Score:</span>
                <span>{roundScore - (hintLevel >= 1 ? 500 : 0) - (hintLevel >= 2 ? 2000 : 0)} pts</span>
            </div>
          </div>

          <button className="round-result__next-btn" onClick={nextRound}>
            {round < 3 ? 'Next Round' : 'Finish Game'}
          </button>
        </div>
      )}
    </div>
  );
}
