import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import EmergencyButton from './EmergencyButton';
import NotificationBadge from './NotificationBadge';

import Login from './pages/Login';
import Register from './pages/Register';
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

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page">Loading...</div>;

  return (
    <>
      <div className="topbar">
        <NavLink to="/">Town Rides</NavLink>
        {user && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <NotificationBadge />
            <NavLink to="/profile">{user.full_name}</NavLink>
          </div>
        )}
      </div>

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
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

      {user && <EmergencyButton />}

      {user && (
        <nav className="navbar">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/rides">Rides</NavLink>
          <NavLink to="/driver">Driver</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
      )}
    </>
  );
}
