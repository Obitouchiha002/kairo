/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomeDashboard } from './pages/HomeDashboard';
import { Quests } from './pages/Quests';
import { FocusMode } from './pages/FocusMode';
import { MirrorMode } from './pages/MirrorMode';
import { Analytics } from './pages/Analytics';
import { Journal } from './pages/Journal';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './lib/AuthContext';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white text-xs mono tracking-widest uppercase">Initializing...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

// Ensure the back button takes user back to dashboard if they are on another tab
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is on a deep link but history is empty (e.g., direct open from PWA shortcut)
    if (location.pathname !== '/' && location.pathname !== '/login') {
       if (window.history.length <= 1 || !window.history.state?.usr) {
           navigate('/', { replace: true });
           setTimeout(() => navigate(location.pathname), 0);
       }
    }
  }, [location.pathname, navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    const handleContext = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <BackButtonHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<HomeDashboard />} />
            <Route path="quests" element={<Quests />} />
            <Route path="focus" element={<FocusMode />} />
            <Route path="mirror" element={<MirrorMode />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="journal" element={<Journal />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
