import { BrowserRouter, Routes, Route } from 'react-router-dom'; // 1. Import Router

// Wireframe Imports pages Bastian
import WireframeLayout from './SamplePages/WireframeLayout';
import WireframeDashboard from './SamplePages/WireframeDashboard';
import WireframeLanding from './SamplePages/WireframeLanding';
import WireframeGameMode from './SamplePages/WireframeGameMode';
import WireframeBotMode from './SamplePages/WireframeBotMode';

import MatchmakingWaiting from './components/MatchmakingWaiting';
import BotGameLauncher from './components/BotGameLauncher';
import GamePage from './components/GamePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <WireframeLayout>
            <WireframeLanding />
          </WireframeLayout>
        } />
        <Route path="/home" element={
          <WireframeLayout>
            <WireframeLanding />
          </WireframeLayout>
        } />
        <Route path="/gamemode" element={
          <WireframeLayout>
            <WireframeGameMode />
          </WireframeLayout>
        } />
        <Route path="/botmode" element={
          <WireframeLayout><WireframeBotMode /></WireframeLayout>
        } />
        <Route path="/dashboard" element={
          <WireframeLayout>
            <WireframeDashboard />
          </WireframeLayout>
        } />

        {/* matchmaking + game */}
        {/*
          /play?tc=600+0
          Shows the "searching for opponent" waiting screen.
          on match found goes to /game/:gameId.
        */}
        <Route path="/play" element={<MatchmakingWaiting />} />

        <Route path="/bot-launch" element={<BotGameLauncher />} />
        {/*
          /game/:gameId
          chess game set by matchmaking
        */}
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

