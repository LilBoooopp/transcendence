import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import Layout from './pages/Header & Footer/Layout';
import WireframeDashboard from './pages/User/Dashboard';
import WireframeLanding from './pages/Home/Landing';
import WireframeGameMode from './pages/Game/GameMode';
import WireframeBotMode from './pages/Game/BotMode';
import ProfilePage from './pages/User/ProfilePage';
import FriendProfilePage from './pages/User/FriendProfilePage';

import MatchmakingWaiting from './pages/Game/MatchmakingWaiting';
import BotGameLauncher from './components/BotGameLauncher';
import GamePage from './pages/Game/GamePage';
import { NotificationProvider, useSocketNotification } from './notifications';

import SoloLauncher from './pages/Game/SoloLauncher';
import SoloGamePage from './pages/Game/SoloGamePage';
//Import loaders from services
import { ProtectedLayout } from './components/ProtectedRoute';
import { dashboardLoader, userLoader, friendLoader } from './services/loaders.service';
import { ErrorPage } from './pages/Error/ErrorPage';

function NotificationListener({ children }: { children: React.ReactNode }) {
  useSocketNotification();
  return <>{children}</>;
}

function RootLayout() {
  return (
    <NotificationProvider>
      <NotificationListener>
        <Layout>
          <Outlet />
        </Layout>
      </NotificationListener>
    </NotificationProvider>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-5xl font-bold">404</h1>
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-lg text-gray-400">The page you are looking for does not exist.</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <WireframeLanding /> },
      { path: "/home", element: <WireframeLanding /> },
      {
        id: "protected",
        element: <ProtectedLayout />, // Wrapper pour les routes protégées
        children: [
          { path: "/gamemode", element: <WireframeGameMode />, },
          { path: "/botmode", element: <WireframeBotMode /> },

          { path: "/dashboard", element: <WireframeDashboard />, loader: dashboardLoader, errorElement: <ErrorPage /> },
          { path: "/user", element: <ProfilePage />, loader: userLoader, errorElement: <ErrorPage /> },
          { path: "/friend/:username", element: <FriendProfilePage />, loader: friendLoader, errorElement: <ErrorPage /> },

          { path: "/play", element: <MatchmakingWaiting /> },
          { path: "/bot-launch", element: <BotGameLauncher /> },

          { path: "/game/:gameId", element: <GamePage /> },

          { path: "/solo", element: <SoloLauncher /> },
          { path: "/solo-game", element: <SoloGamePage /> },
          { path: "*", element: <NotFound /> },
        ],
       }

    ]
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;