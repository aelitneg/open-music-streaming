import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider, type Session } from '@/providers/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Open Music Streaming',
  description: 'A decentralised music streaming platform.',
};

async function getSession(): Promise<Session | null> {
  try {
    // Manually send cookies from the browser to the server
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/session`,
      {
        cache: 'no-store',
        headers: {
          Cookie: cookieHeader,
        },
      },
    );

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    return { authenticated: false };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <SessionProvider initialSession={session}>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
