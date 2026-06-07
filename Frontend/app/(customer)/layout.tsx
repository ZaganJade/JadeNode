import { CustomerSidebar } from "@/components/layout/customer-sidebar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="studio flex h-screen overflow-hidden">
      <CustomerSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
