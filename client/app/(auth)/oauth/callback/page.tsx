'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/callback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              state: searchParams.get('state'),
              iss: searchParams.get('iss'),
              code: searchParams.get('code'),
            }),
          },
        );

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ message: 'Unknown error' }));
          throw new Error(error.message);
        }

        router.push('/');
      } catch (error) {
        console.error(error);
        toast.error(
          `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="flex gap-2 text-4xl mb-8 font-bold">
      <h2>Logging in...</h2>
      <Spinner className="size-10" />
    </div>
  );
}
