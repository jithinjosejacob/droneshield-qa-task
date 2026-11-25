import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import TestsList from './pages/TestsList';
import TestEditor from './pages/TestEditor';
import Production from './pages/Production';
import Runs from './pages/Runs';
import Users from './pages/Users';
import type { Role } from './types';
import type { ReactElement } from 'react';

function Guard({ children, role }: { children: ReactElement; role?: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/tests" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/tests" element={<TestsList />} />
        <Route path="/tests/new" element={<TestEditor />} />
        <Route path="/tests/:id" element={<TestEditor />} />
        <Route path="/production" element={<Production />} />
        <Route path="/runs" element={<Runs />} />
        <Route path="/runs/:id" element={<Runs />} />
        <Route
          path="/users"
          element={
            <Guard role="promoter">
              <Users />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/tests" replace />} />
    </Routes>
  );
}
