import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { sessionQueryKey } from '@/hooks/useSession';
import { ChevronDown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { data } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    queryClient.setQueryData(sessionQueryKey, { authenticated: false });
    navigate('/signin', { replace: true });
  }

  const session = data && data.authenticated ? data : null;

  return (
    <header className="border-b px-6 py-3 flex items-center justify-between">
      <span className="font-semibold tracking-tight">Open Music Streaming</span>
      {session && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
          >
            <span className="max-w-[200px] truncate">{session.handle}</span>
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
