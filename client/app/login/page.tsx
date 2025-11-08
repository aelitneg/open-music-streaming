import LoginForm from '@/components/LoginForm';

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl mb-8 font-bold">Log In</h1>
      <LoginForm />
    </div>
  );
}
