import { useEffect } from 'react';
import { GlobeScene } from './components/Globe/GlobeScene';
import { GameUI } from './components/GameUI';
import { useGameStore } from './store/gameStore';
import { TutorialOverlay } from './components/TutorialOverlay';

function App() {
  const initGame = useGameStore(state => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="app-container">
      <GlobeScene />
      <GameUI />
      <TutorialOverlay />
    </div>
  )
}

export default App
