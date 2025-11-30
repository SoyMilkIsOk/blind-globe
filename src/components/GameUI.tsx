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
    <div className="ui-overlay game-hud" style={{ zIndex: 1000 }}>
      <div className="hud-top">
        <div className="round-info">Round {round} / 3</div>
        <div className="score-info">Score: {totalScore}</div>
      </div>

      {gameState === 'playing' && (
        <div className="target-container" style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            pointerEvents: 'none' // Let clicks pass through container
        }}>
            <div className="target-box" style={{ pointerEvents: 'auto' }}>
                <div className="label">To Find:</div>
                <div className="city-name">
                    {currentTarget?.name}
                    {hintLevel >= 1 && <span className="country-hint">, {currentTarget?.country}</span>}
                </div>
            </div>

            {/* Hint Button */}
            <button 
                className="hint-btn" 
                onClick={useHint} 
                disabled={hintLevel >= 2}
                style={{ 
                    pointerEvents: 'auto',
                    background: hintLevel >= 2 ? '#555' : '#8b5cf6', 
                    opacity: hintLevel >= 2 ? 0.7 : 1,
                    cursor: hintLevel >= 2 ? 'default' : 'pointer',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                {hintLevel === 0 && "Hint 1 (-500pts)"}
                {hintLevel === 1 && "Hint 2 (-2000pts)"}
                {hintLevel === 2 && "Hints Used"}
            </button>

            {/* Confirm Button - Moved here for mobile layout */}
            {tempGuess && (
                <div className="confirm-container" style={{ pointerEvents: 'auto', marginTop: '10px' }}>
                    <button className="confirm-btn" onClick={confirmGuess}>
                        Confirm Guess
                    </button>
                </div>
            )}
        </div>
      )}



      {gameState === 'revealed' && (
        <div className="round-result" style={{ 
            background: 'rgba(0,0,0,0.85)', 
            padding: '2rem', 
            borderRadius: '1rem', 
            textAlign: 'center',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            minWidth: '300px',
            zIndex: 1001 // Ensure it's on top of everything
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#fbbf24' }}>Round Complete!</h3>
          
          <div style={{ marginBottom: '1.5rem', textAlign: 'left', fontSize: '1.1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', fontStyle: 'italic', color: '#ddd' }}>
                {lastDistance !== null ? `${lastDistance} km` : '??? km'} away from<br/>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{currentTarget?.name}, {currentTarget?.country}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Guess Score:</span>
                <span>{roundScore} pts</span>
            </div>
            {hintLevel >= 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#ef4444' }}>
                    <span>Hint 1:</span>
                    <span>-500 pts</span>
                </div>
            )}
            {hintLevel >= 2 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#ef4444' }}>
                    <span>Hint 2:</span>
                    <span>-2000 pts</span>
                </div>
            )}
            <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.3)', 
                marginTop: '0.5rem', 
                paddingTop: '0.5rem', 
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: '1.2rem'
            }}>
                <span>Round Score:</span>
                <span>{roundScore - (hintLevel >= 1 ? 500 : 0) - (hintLevel >= 2 ? 2000 : 0)} pts</span>
            </div>
          </div>

          <button onClick={nextRound} style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}>
            {round < 3 ? 'Next Round' : 'Finish Game'}
          </button>
        </div>
      )}
    </div>
  );
}
