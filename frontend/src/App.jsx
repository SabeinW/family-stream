import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ProfileSelect from './pages/ProfileSelect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Watch from './pages/Watch.jsx';
import Upload from './pages/Upload.jsx';
import Search from './pages/Search.jsx';

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

function RequireProfile({ children }) {
  const { isAuthed, hasProfile } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!hasProfile) return <Navigate to="/profiles" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/profiles"
        element={
          <RequireAuth>
            <ProfileSelect />
          </RequireAuth>
        }
      />
      <Route
        path="/"
        element={
          <RequireProfile>
            <Dashboard />
          </RequireProfile>
        }
      />
      <Route
        path="/search"
        element={
          <RequireProfile>
            <Search />
          </RequireProfile>
        }
      />
      <Route
        path="/watch/:id"
        element={
          <RequireProfile>
            <Watch />
          </RequireProfile>
        }
      />
      <Route
        path="/upload"
        element={
          <RequireProfile>
            <Upload />
          </RequireProfile>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
