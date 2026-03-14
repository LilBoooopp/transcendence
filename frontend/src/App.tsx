import { BrowserRouter, Routes, Route } from 'react-router-dom'; // 1. Import Router

// Wireframe Imports pages Bastian
import WireframeLayout from './pages/Header & Footer/Layout';
import WireframeDashboard from './pages/User/Dashboard';
import WireframeLanding from './pages/Home/Landing';
import WireframeGameMode from './pages/Game/GameMode';
import WireframeBotMode from './pages/Game/BotMode';
import ProfilePage from './pages/User/ProfilePage';

import MatchmakingWaiting from './pages/Game/MatchmakingWaiting';
import BotGameLauncher from './components/BotGameLauncher';
import GamePage from './pages/Game/GamePage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WireframeLayout><WireframeLanding /></WireframeLayout>} />
        <Route path="/home" element={<WireframeLayout><WireframeLanding /></WireframeLayout>} />
        <Route path="/gamemode" element={<WireframeLayout><WireframeGameMode /></WireframeLayout>} />
        <Route path="/botmode" element={<WireframeLayout><WireframeBotMode /></WireframeLayout>} />
        <Route path="/dashboard" element={<WireframeLayout><WireframeDashboard /></WireframeLayout>} />
				<Route path="/user" element={<WireframeLayout><ProfilePage /></WireframeLayout>} />

        <Route path="/play" element={<ProtectedRoute><MatchmakingWaiting /></ProtectedRoute>} />
        <Route path="/bot-launch" element={<ProtectedRoute><BotGameLauncher /></ProtectedRoute>} />
        <Route path="/game/:gameId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

