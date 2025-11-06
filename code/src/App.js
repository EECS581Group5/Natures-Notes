import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SpotifyProvider } from './contexts/SpotifyContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Home from './components/Home';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SpotifyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SpotifyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
