import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { paths } from '@/routes/paths';

type RequireAuthProps = {
  children: React.ReactNode;
};

/**
 * Wrap protected routes with <RequireAuth> so only
 * authenticated users can access them.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full py-8 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={paths.auth} replace />;
  }

  return <>{children}</>;
}
