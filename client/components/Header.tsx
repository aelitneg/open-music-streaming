'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';

export default function Header() {
  const { state, logout } = useSession();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="flex p-2 items-center">
      <div className="flex-1">
        <Link href="/" className="text-2xl">
          Open Music Streaming
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {state.session?.authenticated ? (
          <>
            <span>{state.session.did}</span>
            <Button onClick={handleLogout} disabled={state.isLoading}>
              {state.isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
