import { BrowserRouter, Routes, Route } from 'react-router-dom'; // 1. Import Router

// Wireframe Imports pages Bastian
import WireframeLayout from './pages/Header & Footer/Layout';
import WireframeDashboard from './pages/User/Dashboard';
import WireframeLanding from './pages/Home/Landing';
import WireframeGameMode from './pages/Game/GameMode';
import WireframeBotMode from './pages/Game/BotMode';

import MatchmakingWaiting from './pages/Game/MatchmakingWaiting';
import BotGameLauncher from './components/BotGameLauncher';
import GamePage from './pages/Game/GamePage';
import { NotificationProvider } from './notifications';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<WireframeLayout><WireframeLanding /></WireframeLayout>} />
          <Route path="/home" element={<WireframeLayout><WireframeLanding /></WireframeLayout>} />
          <Route path="/gamemode" element={<ProtectedRoute><WireframeLayout><WireframeGameMode /></WireframeLayout></ProtectedRoute>} />
          <Route path="/botmode" element={<ProtectedRoute><WireframeLayout><WireframeBotMode /></WireframeLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><WireframeLayout><WireframeDashboard /></WireframeLayout></ProtectedRoute>} />

          <Route path="/play" element={<ProtectedRoute><MatchmakingWaiting /></ProtectedRoute>} />
          <Route path="/bot-launch" element={<ProtectedRoute><BotGameLauncher /></ProtectedRoute>} />
          <Route path="/game/:gameId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;

