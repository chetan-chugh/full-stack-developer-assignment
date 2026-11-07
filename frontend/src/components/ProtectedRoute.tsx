import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading...</p>;

  // The token is probably fine, but the server could not be reached
  if (!user && sessionError) {
    return (
      <div className="center">
        <p>Cannot reach the server. Check that the backend is running.</p>
        <button type="button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  // Not logged in: admin pages go to the admin login, others to the normal login
  if (!user) {
    return <Navigate to={adminOnly ? '/dadmin' : '/login'} replace state={{ from: location.pathname }} />;
  }

  // Logged in, but not an admin
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dadmin" replace />;

  return <>{children}</>;
}