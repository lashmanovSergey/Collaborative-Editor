import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';
import RoomHistoryPage from './pages/RoomHistoryPage';
import { isDevMode, initDevMode } from './utils/devUtils';
import { NotificationProvider } from './components/NotificationProvider';

// Initialize dev mode on app start
if (isDevMode) {
  initDevMode();
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = token || isDevMode;

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/room/:guid"
            element={
              <PrivateRoute>
                <RoomPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/room/:guid/history"
            element={
              <PrivateRoute>
                <RoomHistoryPage />
              </PrivateRoute>
            }
          />
          {/* Redirect all other routes to auth */}
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;