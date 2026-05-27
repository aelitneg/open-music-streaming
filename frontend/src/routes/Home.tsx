import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { sessionQueryKey } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    queryClient.setQueryData(sessionQueryKey, { authenticated: false });
    navigate('/signin', { replace: true });
  }

  const did = data?.authenticated ? data.did : null;

  return (
    <main>
      <h1>Open Music Streaming</h1>
      {did && <p>{did}</p>}
      <Button type="button" variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </main>
  );
}
