'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useSession } from '@/hooks/useSession';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useSession();

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
            credentials: 'include',
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

        const session = await response.json();
        dispatch({ type: 'SET_SESSION', payload: session });

        router.push('/');
      } catch (error) {
        console.error(error);
        toast.error(
          `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    })();
  }, [router, searchParams, dispatch]);

  return (
    <div className="flex gap-2 text-4xl mb-8 font-bold">
      <h2>Logging in...</h2>
      <Spinner className="size-10" />
    </div>
  );
}

export default function OAuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex gap-2 text-4xl mb-8 font-bold">
          <h2>Loading...</h2>
          <Spinner className="size-10" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
