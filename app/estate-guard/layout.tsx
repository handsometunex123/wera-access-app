import Header from "./Header";

export default function EstateGuardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20">{children}</main>
    </div>
  );
}