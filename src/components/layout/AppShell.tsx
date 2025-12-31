import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      <main className={`${isMobile ? 'pb-20' : 'ml-64'} min-h-screen`}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      {isMobile && <MobileNav />}
    </div>
  );
}
