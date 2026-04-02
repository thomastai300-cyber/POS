import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40 px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
