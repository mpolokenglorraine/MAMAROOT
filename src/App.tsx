import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import MotherLayout from './layouts/MotherLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import SettingsPage from './pages/mother/SettingsPage';
import MotherHome from './pages/mother/Home';
import StoryPage from './pages/mother/StoryPage';
import Tracker from './pages/mother/Tracker';
import DoctorPage from './pages/mother/DoctorPage';
import CulturePage from './pages/mother/CulturePage';
import CalendarPage from './pages/mother/CalendarPage';
import SafeGuide from './pages/mother/SafeGuide';
import LearnSupportHub from './pages/mother/LearnSupportHub';
import Onboarding from './pages/Onboarding';
import LossSupportPage from './pages/mother/LossSupportPage';
import ChooseJourney from './pages/ChooseJourney';
import JourneyDashboard from './pages/mother/JourneyDashboard';
import ReminderWatcher from './components/ReminderWatcher';

function ProtectedRoute({ 
  children, 
  allowPendingOnboarding = false,
  allowCompletedOnboarding = true,
}: { 
  children: React.ReactNode; 
  allowPendingOnboarding?: boolean;
  allowCompletedOnboarding?: boolean;
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex flex-col items-center justify-center font-sans">
        <div className="w-9 h-9 border-3 border-[#F7CCA5] border-t-[#A9421B] rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium text-[#6B4A3A]">Connecting to Mama Root...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user has not completed onboarding and is accessing protected dashboard
  if (!allowPendingOnboarding && profile && profile.onboarding_complete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user has completed onboarding and visits a pending-only flow like /onboarding
  if (!allowCompletedOnboarding && profile && profile.onboarding_complete === true) {
    return <Navigate to="/mother-dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ReminderWatcher />
        <Routes>
          {/* Welcome Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Onboarding Flow */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute allowPendingOnboarding={true} allowCompletedOnboarding={false}>
                <Onboarding />
              </ProtectedRoute>
            } 
          />

          {/* Choose Journey Flow */}
          <Route 
            path="/choose-journey" 
            element={
              <ProtectedRoute allowPendingOnboarding={true} allowCompletedOnboarding={true}>
                <ChooseJourney />
              </ProtectedRoute>
            } 
          />

          {/* Settings Route */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />

          {/* Pregnancy Loss Support Route */}
          <Route 
            path="/loss-support" 
            element={
              <ProtectedRoute>
                <LossSupportPage />
              </ProtectedRoute>
            } 
          />

          {/* Main Mobile App Container */}
          <Route 
            element={
              <ProtectedRoute>
                <MotherLayout />
              </ProtectedRoute>
            }
          >
            {/* The Navigation Tabs & Routes */}
            <Route path="/mother-dashboard" element={<MotherHome />} />
            <Route path="/mother-dashboard/journey/:stage" element={<JourneyDashboard />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/doctor" element={<DoctorPage />} />
            <Route path="/culture" element={<CulturePage />} />
            <Route path="/tracker" element={<Tracker />} />

            {/* Reachable from cards on Today */}
            <Route path="/safe-guide" element={<SafeGuide />} />
            <Route path="/learn" element={<LearnSupportHub />} />

            {/* Sub-paths for backward compatibility */}
            <Route path="/mother-dashboard/calendar" element={<Navigate to="/calendar" replace />} />
            <Route path="/mother-dashboard/story" element={<Navigate to="/story" replace />} />
            <Route path="/mother-dashboard/tracker" element={<Navigate to="/tracker" replace />} />
            <Route path="/mother-dashboard/doctor" element={<Navigate to="/doctor" replace />} />
            <Route path="/mother-dashboard/culture" element={<Navigate to="/culture" replace />} />
            <Route path="/mother-dashboard/safe-guide" element={<SafeGuide />} />
            <Route path="/mother-dashboard/learn" element={<LearnSupportHub />} />

            <Route path="/mother-dashboard/health" element={<Navigate to="/tracker" replace />} />
            <Route path="/mother-dashboard/appointments" element={<Navigate to="/calendar" replace />} />
            <Route path="/mother-dashboard/notes" element={<Navigate to="/doctor" replace />} />
          </Route>

          {/* Root Fallback */}
          <Route path="/" element={<Navigate to="/mother-dashboard" replace />} />
          <Route path="*" element={<Navigate to="/mother-dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
