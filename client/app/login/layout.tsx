import Header from '@/components/Header';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen">
      <Header showAuth={false} />
      <div className="my-32">{children}</div>
    </div>
  );
}
