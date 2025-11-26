'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

type LoginFormData = {
  handle: string;
};

const ATPROTOCOL_HANDLE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export default function LoginForm() {
  const form = useForm<LoginFormData>({
    defaultValues: {
      handle: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message);
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error(
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <FormField
          control={form.control}
          name="handle"
          rules={{
            required: 'Handle is required',
            pattern: {
              value: ATPROTOCOL_HANDLE_REGEX,
              message: 'Please enter a valid handle',
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter your handle (e.g., user.bsky.social)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Log In
        </Button>
      </form>
    </Form>
  );
}
