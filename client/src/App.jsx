import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Map, Trophy, MessageCircle, User } from 'lucide-react';
import { useAuth } from './AuthContext';
import NotificationBadge from './NotificationBadge';
import WakingBanner from './WakingBanner';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Rides from './pages/Rides';
import PostRide from './pages/PostRide';
import RideDetail from './pages/RideDetail';
import DesignatedDriver from './pages/DesignatedDriver';
import Messages from './pages/Messages';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Flag from './pages/Flag';
import Profile from './pages/Profile';
import History from './pages/History';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

const NAV_TABS = [
  { to: '/', end: true, icon: HomeIcon, label: 'Home' },
  { to: '/rides', icon: Map, label: 'Rides' },
  { to: '/leaderboard', icon: Trophy, label: 'Top' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="flex border-t border-border bg-background shrink-0">
      {NAV_TABS.map(({ to, end, icon: Icon, label }) => {
        const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center gap-0.5 py-3 relative"
          >
            {isActive && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
            )}
            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <WakingBanner />
        <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground bg-background">
          Loading...
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WakingBanner />
      <div className="flex items-center justify-between px-5 py-3.5 bg-background border-b border-border shrink-0">
        <NavLink
          to="/"
          className="text-lg font-black text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Ride
        </NavLink>
        {user && (
          <div className="flex items-center gap-3">
            <NotificationBadge />
            <NavLink to="/profile" className="text-sm font-semibold text-foreground hover:text-accent transition-colors">
              {user.full_name}
            </NavLink>
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
          <Route path="/reset-password" element={user ? <Navigate to="/" /> : <ResetPassword />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/rides" element={<PrivateRoute><Rides /></PrivateRoute>} />
          <Route path="/rides/new" element={<PrivateRoute><PostRide /></PrivateRoute>} />
          <Route path="/rides/:id" element={<PrivateRoute><RideDetail /></PrivateRoute>} />
          <Route path="/driver" element={<PrivateRoute><DesignatedDriver /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
          <Route path="/events/:id" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
          <Route path="/flag" element={<PrivateRoute><Flag /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </main>

      {user && <BottomNav />}
    </div>
  );
}
