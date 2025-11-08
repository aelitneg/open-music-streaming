import Link from 'next/link';
import { Button } from './ui/button';

interface HeaderProps {
  showAuth?: boolean;
}
export default function Header({ showAuth = true }: HeaderProps) {
  return (
    <header className="flex p-2">
      <div className="flex-1">
        <Link href="/" className="text-2xl">
          Open Music Streaming
        </Link>
      </div>
      <div>
        {showAuth && (
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
