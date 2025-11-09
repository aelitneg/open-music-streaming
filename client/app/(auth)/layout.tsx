import Header from '@/components/Header';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <Header />
      <div className="flex flex-col items-center justify-center mt-32">
        {children}
      </div>
    </div>
  );
}
