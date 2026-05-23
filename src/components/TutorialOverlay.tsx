import { useState } from 'react';
import { Info, X, MapPin, Globe2, MousePointerClick, Trophy } from 'lucide-react';
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
    if (step < 3) {
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
                  <MousePointerClick size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
                  <h3>Place Your Guess</h3>
                  <p>Drag to rotate the globe and scroll to zoom. Click anywhere on the surface to place your marker. You can click again to move it before confirming.</p>
                </div>
              )}

              {step === 2 && (
                <div className="tutorial-step">
                  <Trophy size={48} color="#fbbf24" style={{ marginBottom: '16px' }} />
                  <h3>Score Points</h3>
                  <p>Points are awarded based on how close your guess is to the actual target. A perfect guess within 50km earns 5000 points!</p>
                </div>
              )}

              {step === 3 && (
                <div className="tutorial-step">
                  <h3>Demo Round</h3>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Watch how a guess is made and scored.</p>

                  <div className="demo-container">
                    <div className="demo-target-box">Find: Paris</div>
                    <div className="demo-globe"></div>
                    <div className="demo-marker"></div>
                    <div className="demo-target-marker"></div>
                    <div className="demo-line"></div>
                    <div className="demo-result">4820 pts</div>
                    <MousePointerClick className="demo-cursor" color="white" />
                  </div>
                </div>
              )}
            </div>

            <div className="tutorial-footer">
              <div className="tutorial-dots">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`tutorial-dot ${i === step ? 'active' : ''}`} />
                ))}
              </div>

              <button
                className={`tutorial-nav-btn ${step === 3 ? 'finish' : ''}`}
                onClick={handleNext}
              >
                {step === 3 ? "Let's Play!" : 'Next'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
