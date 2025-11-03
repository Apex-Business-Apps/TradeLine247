import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/dashboard/ThemeSwitcher';
const navigationItems = [{
  name: 'Features',
  href: paths.features
}, {
  name: 'Pricing',
  href: `${paths.pricing}#no-monthly`
}, {
  name: 'Compare',
  href: paths.compare
}, {
  name: 'Security',
  href: paths.security
}, {
  name: 'FAQ',
  href: paths.faq
}, {
  name: 'Contact',
  href: paths.contact
}];
const adminNavigationItems = [{
  name: 'Dashboard',
  href: paths.dashboard
}, {
  name: 'Calls',
  href: paths.calls
}, {
  name: 'Phone Apps',
  href: paths.phoneApps
}, {
  name: 'Settings',
  href: paths.voiceSettings
}];
export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user,
    userRole,
    signOut,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const mobileMenuId = 'mobile-menu';
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (document.getElementById('app-header-left') &&
        document.getElementById('app-home') &&
        document.getElementById('app-badge-ca')) {
      import('../nav/AppHeaderOverride.module.css');
    } else {
      console.warn('Header left elements missing; override not applied');
    }
  }, []);
  return <header data-site-header className={cn('sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate', isScrolled ? 'shadow-lg py-2' : 'py-4')} style={{ isolation: 'isolate' }} data-lovable-lock="structure-only">
      <div data-header-inner className="container flex h-14 items-center justify-between gap-4" data-lovable-lock="structure-only">
        {/* Home Button & Badge */}
        <div id="app-header-left" data-slot="left" className="flex items-center gap-3 animate-fade-in" data-lovable-lock="structure-only">
          <Button 
            id="app-home"
            variant="default" 
            size={isScrolled ? 'sm' : 'default'}
            onClick={() => navigate(paths.home)} 
            className="hover-scale transition-all duration-300" 
            aria-label="Go to homepage" 
            data-lovable-lock="structure-only"
          >
            Home
          </Button>
          <img 
            id="app-badge-ca"
            src="/assets/brand/badges/built-in-canada-badge.png" 
            alt="Built in Canada" 
            className="h-[45px] sm:h-[60px] lg:h-[65px] w-auto"
            width="156"
            height="65"
            loading="eager"
            data-lovable-lock="structure-only"
          />
        </div>

        {/* Desktop Navigation */}
        <nav data-slot="center" aria-label="Primary" className="hidden md:flex animate-fade-in" style={{ animationDelay: '200ms' }} data-lovable-lock="structure-only">
          <NavigationMenu data-lovable-lock="structure-only">
            <NavigationMenuList data-lovable-lock="structure-only">
            {navigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                <NavigationMenuLink asChild>
                  <Link to={item.href} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 story-link hover-scale" style={{
                  animationDelay: `${index * 100}ms`
                }}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>)}
            {/* Admin-only navigation items */}
            {isAdmin() && adminNavigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                <NavigationMenuLink asChild>
                  <Link to={item.href} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-primary/10 px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/30 data-[state=open]:bg-primary/30 story-link hover-scale text-primary" style={{
                  animationDelay: `${(navigationItems.length + index) * 100}ms`
                }}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>)}
          </NavigationMenuList>
        </NavigationMenu>
        </nav>

        {/* Enhanced Right Section - Apple-grade spacing and hierarchy */}
        <div data-slot="right" className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '400ms' }} data-lovable-lock="structure-only">
          {/* Theme Switcher - CRITICAL FIX: Now accessible on all pages */}
          <div className="hidden sm:flex">
            <ThemeSwitcher />
          </div>

          {/* Language Switcher */}
          <div className="hidden sm:flex">
            <LanguageSwitcher data-lovable-lock="structure-only" />
          </div>

          {/* Burger Menu Button - Mobile Only (UX FIX: Hide on desktop) */}
          <button
            id="burger-menu-button"
            data-testid="burger-menu-button"
            className="md:hidden flex items-center justify-center p-2 rounded-lg border border-border bg-background hover:bg-accent transition-all duration-200 hover-scale min-w-[44px] min-h-[44px]"
            onClick={() => {
              console.log('Burger menu clicked, current state:', isMobileMenuOpen);
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            type="button"
          >
            {isMobileMenuOpen ? (
              <X size={20} className="text-foreground" strokeWidth={2} />
            ) : (
              <Menu size={20} className="text-foreground" strokeWidth={2} />
            )}
          </button>

          {/* Auth Section */}
          {user ? <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm text-muted-foreground">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </span>
                {userRole && <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-200", isAdmin() ? "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive" : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary")}>
                    {userRole.toUpperCase()}
                  </span>}
              </div>
              <Button variant="outline" size={isScrolled ? 'sm' : 'default'} onClick={() => signOut()} className="hover-scale transition-all duration-200">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div> : <Button variant="default" size={isScrolled ? 'sm' : 'default'} onClick={() => navigate(paths.auth)} className="hover-scale transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]">
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Login</span>
            </Button>}
        </div>
      </div>

      {/* Enhanced Mobile Navigation with Slide Animation */}
      <nav
        id={mobileMenuId}
        aria-label="Mobile"
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "md:hidden border-t border-border bg-background/98 backdrop-blur-lg transition-all duration-300 overflow-hidden shadow-lg",
          isMobileMenuOpen ? "animate-slide-in-right max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="container py-6 space-y-4">
          {/* Mobile Settings Section */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</span>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-4 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Navigation</span>
            </div>
            {navigationItems.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-4 py-3 text-sm font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover-scale animate-fade-in"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Admin Section */}
          {isAdmin() && (
            <div className="space-y-1 pt-2 border-t border-border">
              <div className="px-4 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin</span>
              </div>
              {adminNavigationItems.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-4 py-3 text-sm font-medium rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200 hover-scale animate-fade-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ animationDelay: `${(navigationItems.length + index) * 50}ms` }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>;
};
