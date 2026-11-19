// TODO: US-1.1
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar hidden w-64 border-r p-4 md:block">
        <div className="mb-6 text-lg font-semibold">Rental Motor Admin</div>
        <nav className="text-sidebar-foreground space-y-2 text-sm">
          <div className="font-medium">Menu Navigasi</div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-6 font-semibold">Panel Admin</header>
        <main className="bg-background flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
