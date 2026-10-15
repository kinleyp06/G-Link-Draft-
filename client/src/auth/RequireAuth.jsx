import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from './AuthContext.jsx';
import Loading from '../components/Loading.jsx';

// Wraps pages that need a signed-in user, optionally with one of the given roles.
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}
