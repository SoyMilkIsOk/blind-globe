import { Share2, Globe } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export function EndScreenUI() {
  const { 
    totalScore, 
    gamesPlayed, 
    highScore, 
    totalLifetimeScore
  } = useGameStore();

  const averageScore = gamesPlayed > 0 ? Math.round(totalLifetimeScore / gamesPlayed) : 0;
  const isNewHighScore = totalScore >= highScore && gamesPlayed > 1;

  useEffect(() => {
    // Trigger rainbow confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const handleShare = async () => {
    // Generate Share String
    // 🌍 Blind Globe #123
    // 🎯 Score: 12500
    // 🟩🟩🟨 (Example of rounds? Or just score)
    // Let's do:
    // 🌍 Blind Globe
    // 📅 [Date]
    // 🏆 Score: [Score]
    
    const dateStr = new Date().toLocaleDateString();
    const shareText = `blindglobe.terpscoops.com\n🙈🌍${dateStr}\n🏆 Score: ${totalScore}\n\nCan you top my geo-spatial awareness today?`;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  };

  return (
    <div className="ui-overlay start-screen-overlay">
      <div className="start-window">
        <div className="logo-section">
          <Globe size={48} color="#3b82f6" />
          <h1>Game Over</h1>
        </div>

        {isNewHighScore && (
            <div className="high-score-banner">
                🎉 New High Score! 🎉
            </div>
        )}
        
        <div className="final-score-section">
            <div className="final-score-label">Final Score</div>
            <div className="final-score-value">{totalScore}</div>
        </div>

        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-value">{gamesPlayed}</div>
            <div className="stat-label">Played</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{highScore}</div>
            <div className="stat-label">Best</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{averageScore}</div>
            <div className="stat-label">Avg</div>
          </div>
        </div>

        <div className="action-buttons">
            <button className="share-btn" onClick={handleShare}>
                <Share2 size={20} />
                Share Result
            </button>
        </div>
        
        <p className="come-back-text">
            Come back tomorrow to play again!
        </p>
      </div>
    </div>
  );
}
