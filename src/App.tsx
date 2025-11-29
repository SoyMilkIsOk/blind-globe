import { useEffect } from 'react';
import { GlobeScene } from './components/Globe/GlobeScene';
import { GameUI } from './components/GameUI';
import { useGameStore } from './store/gameStore';

function App() {
  const initGame = useGameStore(state => state.initGame);

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="app-container">
      <GlobeScene />
      <GameUI />
    </div>
  )
}

export default App
