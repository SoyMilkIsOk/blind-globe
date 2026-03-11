import { useEffect, useState, useRef } from 'react';
import './DifficultyMeter.css';

interface DifficultyMeterProps {
  score: number; // 1-10
  label?: string;
  size?: 'small' | 'large';
}

export function DifficultyMeter({ score, label, size = 'small' }: DifficultyMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay setting the score slightly to trigger animation on mount
    const timeout = setTimeout(() => {
        setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score]);

  // Handle auto-hide and clickaway
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (showTooltip) {
      // Auto-hide after 5 seconds
      timeoutId = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
    }

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      if (showTooltip && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };

    // Listen for mousedown and touchstart anywhere on the document
    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [showTooltip]);

  const clampedScore = Math.max(1, Math.min(10, animatedScore));
  
  // Angle for rotation (starts at -90deg, goes to 90deg)
  const angle = -90 + ((clampedScore - 1) / 9) * 180;

  let color = '#22c55e'; // Green
  if (clampedScore >= 4 && clampedScore <= 7) color = '#eab308'; // Yellow
  if (clampedScore > 7) color = '#ef4444'; // Red

  return (
    <div 
      ref={containerRef}
      className={`difficulty-meter size-${size} has-tooltip`}
      onClick={() => setShowTooltip(true)}
    >
      {!label && (
        <div className={`difficulty-tooltip ${showTooltip ? 'visible-mobile' : ''}`}>
          Difficulty
        </div>
      )}
      {label && <div className="difficulty-label">{label}</div>}
      <div className="gauge-wrapper">
        <svg viewBox="0 0 100 55" className="gauge-svg">
          {/* Background Arc */}
          <path 
            d="M 12 50 A 38 38 0 0 1 88 50" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="10" 
            strokeLinecap="round" 
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="diffGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          {/* Indicator Arc */}
          <path 
            d="M 12 50 A 38 38 0 0 1 88 50" 
            fill="none" 
            stroke="url(#diffGrad)" 
            strokeWidth="10" 
            strokeLinecap="round" 
          />
          
          {/* Needle pivot */}
          <circle cx="50" cy="50" r="5" fill="#f8fafc" />
          
          {/* Needle */}
          <g 
            className="gauge-needle" 
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px' }}
          >
            <path d="M 48 50 L 50 15 L 52 50 Z" fill="#f8fafc" />
          </g>
        </svg>
      </div>
      <div className="difficulty-score" style={{ color }}>
        {clampedScore}/10
      </div>
    </div>
  );
}
