import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Auth from './Auth';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="w-full py-8 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (user) {
    return (
      <div className="w-full py-8 text-center text-sm text-slate-500">
        Redirecting to your dashboard…
      </div>
    );
  }

  return <Auth />;
}

export default LoginPage;
