import { useForm } from 'react-hook-form';
import { Navigate, useSearchParams } from 'react-router';
import { login } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

const HANDLE_RE =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

type FormValues = { handle: string };

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Sign in was cancelled.',
  callback_failed: 'Sign in failed. Please try again.',
};

export default function SignIn() {
  const { data, isLoading: sessionLoading } = useSession();
  const [searchParams] = useSearchParams();
  const callbackError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  if (sessionLoading) return null;
  if (data?.authenticated) return <Navigate to="/" replace />;

  async function onSubmit({ handle }: FormValues) {
    try {
      const { url } = await login(handle);
      window.location.href = url;
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Sign in failed',
      });
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Open Music Streaming
          </h1>
        </div>

        <div className="rounded-xl border bg-card px-6 py-8 shadow-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                type="text"
                autoComplete="username"
                placeholder="you.bsky.social"
                aria-describedby={errors.handle ? 'handle-error' : undefined}
                aria-invalid={!!errors.handle}
                {...register('handle', {
                  required: 'Handle is required',
                  pattern: {
                    value: HANDLE_RE,
                    message: 'Enter a valid handle (e.g. you.bsky.social)',
                  },
                })}
              />
              {errors.handle && (
                <p
                  id="handle-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.handle.message}
                </p>
              )}
            </div>

            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              aria-busy={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

            {callbackError && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>
                  {CALLBACK_ERROR_MESSAGES[callbackError] ??
                    'Sign in failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
