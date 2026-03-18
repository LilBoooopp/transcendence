import { createBrowserRouter, RouterProvider, Outlet, useLoaderData } from 'react-router-dom';

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

//Import loaders from services
import { dashboardLoader, userLoader } from './services/loaders.service';

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

function ProtectedLayout() {
  return (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <WireframeLanding /> },
      { path: "/home", element: <WireframeLanding /> },
      {
        element: <ProtectedLayout />, // Wrapper pour les routes protégées
        children: [
          { path: "/gamemode", element: <WireframeGameMode />, },
          { path: "/botmode", element: <WireframeBotMode /> },

          { path: "/dashboard", element: <WireframeDashboard />, loader: dashboardLoader/*, errorElement: <ErrorPage err={error.message} /> */},
          { path: "/user", element: <ProfilePage />, loader: userLoader/*, errorElement: <ErrorPage err={error.message} /> */},

          { path: "/play", element: <MatchmakingWaiting /> },
          { path: "/bot-launch", element: <BotGameLauncher /> },

          { path: "/game/:gameId", element: <GamePage /> },

          { path: "/solo", element: <SoloLauncher /> },
          { path: "/solo-game", element: <SoloGamePage /> },
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