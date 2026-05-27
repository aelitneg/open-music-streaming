import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/hooks/useSession';

export default function ProtectedRoute() {
  const { data, isLoading } = useSession();

  if (isLoading) return null;
  if (!data?.authenticated) return <Navigate to="/signin" replace />;
  return <Outlet />;
}
