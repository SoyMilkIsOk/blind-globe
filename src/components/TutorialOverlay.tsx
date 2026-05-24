import { useState } from 'react';
import { Info, X, MapPin, Globe2, MousePointerClick, Trophy, Compass, HelpCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import './Tutorial.css';

export function TutorialOverlay() {
  const {
    isTutorialOpen,
    setTutorialOpen,
    showTutorialConfirmation,
    setTutorialConfirmation,
    completeTutorial
  } = useGameStore();

  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(0);
    completeTutorial();
  };

  if (!isTutorialOpen && !showTutorialConfirmation) {
    return (
      <div className="tutorial-root">
        <button
          className="tutorial-btn-floating"
          onClick={() => setTutorialConfirmation(true)}
          aria-label="How to play"
        >
          <Info size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        {showTutorialConfirmation && !isTutorialOpen ? (
          <div className="tutorial-confirmation">
            <h3>View Tutorial?</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
              Would you like a quick walkthrough on how to play Blind Globe?
            </p>
            <div className="tutorial-confirmation-actions">
              <button
                className="tutorial-btn-cancel"
                onClick={() => setTutorialConfirmation(false)}
              >
                No, skip
              </button>
              <button
                className="tutorial-nav-btn"
                onClick={() => {
                  setTutorialConfirmation(false);
                  setTutorialOpen(true);
                  setStep(0);
                }}
              >
                Yes, show me
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="tutorial-close-btn" onClick={handleClose}>
              <X size={24} />
            </button>

            <div className="tutorial-header">
              <h2>
                <Globe2 size={28} />
                How to Play
              </h2>
            </div>

            <div className="tutorial-content">
              {step === 0 && (
                <div className="tutorial-step">
                  <MapPin size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                  <h3>Find the City</h3>
                  <p>In each round, you will be given the name of a city. Your goal is to pinpoint its exact location on the blank 3D globe.</p>
                </div>
              )}

              {step === 1 && (
                <div className="tutorial-step">
                  <Compass size={48} color="#10b981" style={{ marginBottom: '16px' }} />
                  <h3>Use the Reference City</h3>
                  <p>At the start of each round, a reference city is automatically pinned in green on the globe. Use this known point to help estimate the direction and distance to the target city.</p>
                </div>
              )}

              {step === 2 && (
                <div className="tutorial-step">
                  <HelpCircle size={48} color="#a855f7" style={{ marginBottom: '16px' }} />
                  <h3>Need a Hint?</h3>
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '12px' }}>
                    You can use up to two hints per round, but they deduct points from your score:
                  </p>
                  <ul style={{ textAlign: 'left', margin: '0 auto', maxWidth: '380px', paddingLeft: '24px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <li><strong>Hint 1 (-500 pts):</strong> Reveals the country of the target city.</li>
                    <li><strong>Hint 2 (-2000 pts):</strong> Draws the country outlines on the blank globe.</li>
                  </ul>
                </div>
              )}

              {step === 3 && (
                <div className="tutorial-step">
                  <MousePointerClick size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
                  <h3>Place Your Guess</h3>
                  <p>Drag to rotate the globe and scroll to zoom. Click anywhere on the surface to place your marker. You can click again to move it before confirming.</p>
                </div>
              )}

              {step === 4 && (
                <div className="tutorial-step">
                  <Trophy size={48} color="#fbbf24" style={{ marginBottom: '16px' }} />
                  <h3>Score Points</h3>
                  <p>Points are awarded based on how close your guess is to the actual target. A perfect guess within 50km earns 5000 points!</p>
                </div>
              )}

              {step === 5 && (
                <div className="tutorial-step">
                  <h3>Demo Round</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Watch how a guess is made and scored.</p>

                  <div className="demo-container">
                    <div className="demo-target-box">Find: Paris</div>
                    <div className="demo-globe">
                      <div className="demo-globe-inner">
                        <div className="demo-globe-texture"></div>
                        <div className="demo-ref-marker"></div>
                      </div>
                      <div className="demo-marker"></div>
                      <div className="demo-target-marker"></div>
                      <div className="demo-line"></div>
                    </div>
                    <div className="demo-confirm-container">
                      <button className="demo-confirm-btn" tabIndex={-1}>Confirm Guess</button>
                    </div>
                    <div className="demo-result">4820 pts</div>
                    <MousePointerClick className="demo-cursor" color="white" />
                  </div>
                </div>
              )}
            </div>

            <div className="tutorial-footer">
              <div className="tutorial-dots">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`tutorial-dot ${i === step ? 'active' : ''}`} />
                ))}
              </div>

              <button
                className={`tutorial-nav-btn ${step === 5 ? 'finish' : ''}`}
                onClick={handleNext}
              >
                {step === 5 ? "Let's Play!" : 'Next'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
