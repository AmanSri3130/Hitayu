import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PrakritiPage from './pages/PrakritiPage';
import AyuAIPage from './pages/AyuAIPage';
import YogaAIPage from './pages/YogaAIPage';
import KnowledgePage from './pages/KnowledgePage';
import PlannerPage from './pages/PlannerPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/yoga-ai" element={<YogaAIPage />} />

            {/* Protected Wellness Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prakriti"
              element={
                <ProtectedRoute>
                  <PrakritiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ayu-ai"
              element={
                <ProtectedRoute>
                  <AyuAIPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <PlannerPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
