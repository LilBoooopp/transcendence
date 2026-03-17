import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './pages/Header & Footer/Layout';
import WireframeDashboard from './pages/User/Dashboard';
import WireframeLanding from './pages/Home/Landing';
import WireframeGameMode from './pages/Game/GameMode';
import WireframeBotMode from './pages/Game/BotMode';
import ProfilePage from './pages/User/ProfilePage';

import MatchmakingWaiting from './pages/Game/MatchmakingWaiting';
import BotGameLauncher from './components/BotGameLauncher';
import GamePage from './pages/Game/GamePage';
import { NotificationProvider, useSocketNotification } from './notifications';

import SoloLauncher from './pages/Game/SoloLauncher';
import SoloGamePage from './pages/Game/SoloGamePage';

import ProtectedRoute from './components/ProtectedRoute';
function NotificationListener({ children }: { children: React.ReactNode }) {
  useSocketNotification();
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <NotificationListener>
          <Routes>
            <Route path="/" element={<Layout><WireframeLanding /></Layout>} />
            <Route path="/home" element={<Layout><WireframeLanding /></Layout>} />
            <Route path="/gamemode" element={<ProtectedRoute><Layout><WireframeGameMode /></Layout></ProtectedRoute>} />
            <Route path="/botmode" element={<ProtectedRoute><Layout><WireframeBotMode /></Layout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><WireframeDashboard /></Layout></ProtectedRoute>} />
            <Route path="/user" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

            <Route path="/play" element={<ProtectedRoute><Layout><MatchmakingWaiting /></Layout></ProtectedRoute>} />
            <Route path="/bot-launch" element={<ProtectedRoute><Layout><BotGameLauncher /></Layout></ProtectedRoute>} />
            <Route path="/game/:gameId" element={<ProtectedRoute><Layout><GamePage /></Layout></ProtectedRoute>} />

            <Route path="/solo" element={<ProtectedRoute><Layout><SoloLauncher /></Layout></ProtectedRoute>} />
            <Route path="/solo-game" element={<ProtectedRoute><Layout><SoloGamePage /></Layout></ProtectedRoute>} />
          </Routes>
        </NotificationListener>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;

