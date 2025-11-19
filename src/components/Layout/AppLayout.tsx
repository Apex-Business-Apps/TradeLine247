import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  Settings,
  Menu,
  TrendingUp
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo, LogoText } from '@/components/ui/logo';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Inventory', href: '/inventory', icon: Car },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Credit Apps', href: '/credit-apps', icon: CreditCard },
  { name: 'Inbox', href: '/inbox', icon: MessageSquare },
  { name: 'Growth', href: '/growth', icon: TrendingUp },
  { name: 'Compliance', href: '/compliance', icon: Settings },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      {/* Mobile header */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden"
        role="banner"
      >
        <div className="flex h-14 items-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="border-b p-4 flex items-center gap-2">
                  <Logo size="lg" />
                  <LogoText className="text-lg" />
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  <NavLinks />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Logo size="md" />
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-2">
              <Logo size="lg" />
              <LogoText className="text-lg" />
            </div>
            <nav className="flex flex-1 flex-col" aria-label="Primary navigation">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="space-y-1">
                    <NavLinks />
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" role="main" tabIndex={-1} className="lg:pl-64 flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <footer role="contentinfo" className="border-t bg-background px-4 py-6 text-sm text-muted-foreground lg:pl-64">
        © {currentYear} AutoRepAi. All rights reserved.
      </footer>
    </div>
  );
}
