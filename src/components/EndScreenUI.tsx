import { Share2, Globe, Clock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

/** Returns ms until midnight MST (America/Denver) */
function getMsUntilMidnightMST(): number {
  const now = new Date();
  // Get the current time parts in Denver timezone
  const denverParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => denverParts.find(p => p.type === type)?.value ?? '0';
  const h = parseInt(get('hour'), 10);
  const m = parseInt(get('minute'), 10);
  const s = parseInt(get('second'), 10);

  const secondsLeft = (24 - h - 1) * 3600 + (60 - m - 1) * 60 + (60 - s);
  return secondsLeft * 1000;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function EndScreenUI() {
  const { 
    totalScore, 
    gamesPlayed, 
    highScore, 
    totalLifetimeScore
  } = useGameStore();

  const averageScore = gamesPlayed > 0 ? Math.round(totalLifetimeScore / gamesPlayed) : 0;
  const isNewHighScore = totalScore >= highScore && gamesPlayed > 1;

  // Live countdown
  const [remaining, setRemaining] = useState(getMsUntilMidnightMST());

  useEffect(() => {
    const id = setInterval(() => setRemaining(getMsUntilMidnightMST()), 1000);
    return () => clearInterval(id);
  }, []);

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
      navigator.clipboard.writeText(shareText);
      alert('Score copied to clipboard!');
    }
  };

  return (
    <div className="ui-overlay start-screen-overlay">
      <div className="start-window end-window">
        <div className="logo-section">
          <Globe size={40} color="#3b82f6" />
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
                <Share2 size={18} />
                Share Result
            </button>
        </div>
        
        {/* Countdown to next puzzle */}
        <div className="countdown-section">
            <Clock size={16} className="countdown-icon" />
            <span className="countdown-label">Next puzzle in</span>
            <span className="countdown-timer">{formatCountdown(remaining)}</span>
        </div>
      </div>
    </div>
  );
}
