'use client';

import { useForm } from 'react-hook-form';
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
    console.log('Login data:', data);
    // TODO: Implement login logic
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
