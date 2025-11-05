import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Language menu item component for dropdown
const LanguageMenuItem: React.FC<{ locale: string; label: string }> = ({ locale, label }) => {
  const { i18n } = useTranslation();
  return (
    <DropdownMenuItem
      onClick={() => i18n.changeLanguage(locale)}
      className={cn("cursor-pointer", i18n.language === locale && "bg-accent")}
    >
      {label}
    </DropdownMenuItem>
  );
};

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    user,
    userRole,
    signOut,
    isAdmin
  } = useAuth();
  const { goToWithFeedback } = useSafeNavigation();
  const location = useLocation();
  const mobileMenuId = 'mobile-menu';
  const isUserAdmin = isAdmin();

  // Streamlined navigation handler - single source of truth
  const handleNavigation = React.useCallback(async (href: string, label: string, closeMenu = false) => {
    if (closeMenu) setIsMobileMenuOpen(false);
    try {
      await goToWithFeedback(href, label);
    } catch (error) {
      console.error(`[Header] Navigation failed for ${label}:`, error);
    }
  }, [goToWithFeedback]);

  // Optimized scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load header override CSS once on mount
  useEffect(() => {
    const loadOverride = async () => {
      const leftEl = document.getElementById('app-header-left');
      const homeEl = document.getElementById('app-home');
      const badgeEl = document.getElementById('app-badge-ca');
      if (leftEl && homeEl && badgeEl) {
        try {
          await import('../nav/AppHeaderOverride.module.css');
        } catch (error) {
          console.warn('[Header] Override CSS load failed:', error);
        }
      }
    };
    loadOverride();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  return <header data-site-header className={cn('sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 isolate', isScrolled ? 'shadow-lg py-2' : 'py-4')} style={{ isolation: 'isolate' }} data-lovable-lock="structure-only">
      <div data-header-inner className="container flex h-14 items-center justify-between gap-4" data-lovable-lock="structure-only">
        {/* Home Button & Badge */}
        <div id="app-header-left" data-slot="left" className="flex items-center gap-3 animate-fade-in" data-lovable-lock="structure-only">
          <Button 
            id="app-home"
            variant="default" 
            size={isScrolled ? 'sm' : 'default'}
            onClick={() => handleNavigation(paths.home, 'Home')} 
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

        {/* Desktop Navigation - Marketing Links Only */}
        <nav data-slot="center" aria-label="Primary" className="hidden lg:flex items-center gap-1 animate-fade-in" style={{ animationDelay: '200ms' }} data-lovable-lock="structure-only">
          <NavigationMenu data-lovable-lock="structure-only">
            <NavigationMenuList data-lovable-lock="structure-only" className="gap-1">
            {navigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                <NavigationMenuLink asChild>
                  <Link 
                    to={item.href} 
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 story-link hover-scale" 
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>)}
          </NavigationMenuList>
        </NavigationMenu>
        </nav>

        {/* Desktop App Navigation - Separate Section for Admin */}
        {isUserAdmin && (
          <nav data-slot="app-nav" aria-label="Application" className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-border animate-fade-in" style={{ animationDelay: '250ms' }} data-lovable-lock="structure-only">
            <NavigationMenu data-lovable-lock="structure-only">
              <NavigationMenuList data-lovable-lock="structure-only" className="gap-1">
              {adminNavigationItems.map((item, index) => <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link 
                      to={item.href} 
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigation(item.href, item.name);
                      }}
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/20 data-[state=open]:bg-primary/20 story-link hover-scale text-primary"
                      aria-label={`Navigate to ${item.name}`}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>)}
            </NavigationMenuList>
          </NavigationMenu>
          </nav>
        )}

        {/* Enhanced CTA Button & Mobile Menu */}
        <div data-slot="right" className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }} data-lovable-lock="structure-only">
          {/* Language Switcher - Single instance, always visible */}
          <LanguageSwitcher data-lovable-lock="structure-only" />

          {/* User Menu - Desktop: Dropdown, Mobile: Simplified */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Desktop: User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={isScrolled ? 'sm' : 'default'}
                    className="hidden lg:flex items-center gap-2 hover:bg-accent transition-all duration-300"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-foreground leading-tight">
                        {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                      </span>
                      {userRole && (
                        <span className={cn(
                          "text-xs font-medium leading-tight",
                          isUserAdmin ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                        )}>
                          {userRole.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isUserAdmin && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => handleNavigation(paths.dashboard, 'Dashboard')}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleNavigation(paths.voiceSettings, 'Settings')}
                        className="cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Desktop: Logout Button - Always visible */}
              <Button 
                variant="ghost" 
                size={isScrolled ? 'sm' : 'default'}
                onClick={() => signOut()} 
                className="hidden lg:flex items-center gap-2 hover:bg-accent transition-all duration-300 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Sign Out</span>
              </Button>

              {/* Mobile: Sign Out */}
              <Button 
                variant="ghost" 
                size={isScrolled ? 'sm' : 'default'}
                onClick={() => signOut()} 
                className="hidden lg:flex items-center gap-2 hover:bg-accent transition-all duration-300 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Sign Out</span>
              </Button>

              {/* Mobile: Language Switcher + Sign Out */}
              <div className="flex items-center gap-2 lg:hidden">
                <LanguageSwitcher data-lovable-lock="structure-only" />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => signOut()} 
                  className="hover:bg-accent transition-all duration-300"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <LanguageSwitcher data-lovable-lock="structure-only" className="lg:hidden" />
              <Button 
                variant="success" 
                size={isScrolled ? 'sm' : 'default'} 
                onClick={() => handleNavigation(paths.auth, 'Login')}
                className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl min-h-[44px]"
              >
                Login
              </Button>
            </>
          )}

          {/* Burger Menu Button - Always visible */}
          <button
            id="burger-menu-button"
            data-testid="burger-menu-button"
            className="flex items-center justify-center p-2 rounded-md border border-border bg-background hover:bg-accent transition-all duration-300 hover-scale min-w-[44px] min-h-[44px]"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
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
        </div>
      </div>

      {/* Enhanced Mobile Navigation with Slide Animation - MOBILE ONLY */}
      <nav
        id={mobileMenuId}
        aria-label="Mobile"
        aria-hidden={!isMobileMenuOpen}
        className={cn(
          "lg:hidden border-t bg-background/95 backdrop-blur transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="container py-4 space-y-1">
          {/* Marketing Links Section */}
          <div className="px-2 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Information
            </p>
            {navigationItems.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-4 py-2.5 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 animate-fade-in"
                onClick={() => handleNavigation(item.href, item.name, true)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* App Navigation Section (Admin Only) */}
          {isUserAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-2">
                  Application
                </p>
                {adminNavigationItems.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.href, item.name, true);
                    }}
                    className="block px-4 py-2.5 text-sm font-semibold rounded-md bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${(navigationItems.length + index) * 50}ms` }}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>;
};
