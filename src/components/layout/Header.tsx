import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu';
import { Menu, X, LogOut, User, Settings, ChevronDown, Phone, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
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
import '@/components/nav/AppHeaderOverride.module.css';

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  return <header
      id="app-header"
      data-site-header
      data-testid="app-header"
      className={cn(
        'sticky top-0 z-40 w-full bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b isolate transition-all duration-300',
        isScrolled ? 'shadow-lg' : ''
      )}
      data-lovable-lock="structure-only"
      role="banner"
    >
      <div
        data-header-inner
        className="mx-auto w-full max-w-screen-2xl flex h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6"
        data-lovable-lock="structure-only"
      >
        {/* Home Button & Badge */}
        <div
          id="app-header-left"
          data-testid="app-header-left"
          data-slot="left"
          className="flex items-center gap-2 shrink-0 min-w-0 ml-0"
          data-lovable-lock="structure-only"
          role="navigation"
          aria-label="Header left section"
        >
          <Button
            id="app-home"
            variant="default"
            size={isScrolled ? 'sm' : 'default'}
            onClick={() => handleNavigation(paths.home, 'Home')}
            className="hover-scale transition-all duration-300 h-11 px-4"
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
        <nav
          data-slot="center"
          aria-label="Primary"
          className="hidden lg:flex items-center gap-2 min-w-0"
          data-lovable-lock="structure-only"
        >
          <NavigationMenu data-lovable-lock="structure-only">
            <NavigationMenuList data-lovable-lock="structure-only" className="gap-2">
              {navigationItems.map((item, index) => (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'group inline-flex h-10 min-w-[44px] items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50 story-link hover-scale',
                          isActive && 'bg-accent/50 text-foreground'
                        )
                      }
                      aria-current={({ isActive }: { isActive: boolean }) => isActive ? 'page' : undefined}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {item.name}
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
          </NavigationMenuList>
        </NavigationMenu>
        </nav>

        {/* Enhanced CTA Button & Mobile Menu */}
        <div
          data-slot="right"
          className="flex items-center gap-2"
          data-lovable-lock="structure-only"
        >
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <LanguageSwitcher data-lovable-lock="structure-only" />
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isScrolled ? 'sm' : 'default'}
                      className="hidden lg:flex items-center gap-2 hover:bg-accent transition-all duration-300 h-11 px-4"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-foreground leading-tight">
                          {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                        </span>
                        {userRole && (
                          <span
                            className={cn(
                              'text-xs font-medium leading-tight',
                              isUserAdmin ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                            )}
                          >
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
                    {isUserAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Application
                          </p>
                        </div>
                        <DropdownMenuItem
                          onClick={() => handleNavigation(paths.dashboard, 'Dashboard')}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleNavigation(paths.calls, 'Calls')}
                          className="cursor-pointer"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Calls
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleNavigation(paths.phoneApps, 'Phone Apps')}
                          className="cursor-pointer"
                        >
                          <Smartphone className="mr-2 h-4 w-4" />
                          Phone Apps
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleNavigation(paths.voiceSettings, 'Settings')}
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:text-red-400 dark:focus:bg-red-950/20"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="success"
                size={isScrolled ? 'sm' : 'default'}
                onClick={() => handleNavigation(paths.auth, 'Login')}
                className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl h-11 px-4"
              >
                Login
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            {!user && (
              <Button
                variant="success"
                size={isScrolled ? 'sm' : 'default'}
                onClick={() => handleNavigation(paths.auth, 'Login')}
                className="hover-scale transition-all duration-300 shadow-lg hover:shadow-xl h-11 px-4"
              >
                Login
              </Button>
            )}
            <button
              id="burger-menu-button"
              data-testid="burger-menu-button"
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background hover:bg-accent transition-all duration-300 hover-scale"
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
        <div className="container py-4 space-y-3 px-4">
          {/* Marketing Links Section */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Information
            </p>
            {navigationItems.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent/50 text-foreground'
                  )
                }
                aria-current={({ isActive }: { isActive: boolean }) => isActive ? 'page' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavigation(item.href, item.name, true);
                }}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* App Navigation Section (Admin Only) */}
          {isUserAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-2">
                  Application
                </p>
                {adminNavigationItems.map((item, index) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-md px-4 py-2.5 text-sm font-semibold transition-all duration-300 bg-primary/5 hover:bg-primary/10 text-primary',
                        isActive && 'bg-primary/20'
                      )
                    }
                    aria-current={({ isActive }: { isActive: boolean }) => isActive ? 'page' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavigation(item.href, item.name, true);
                    }}
                    style={{ animationDelay: `${(navigationItems.length + index) * 75}ms` }}
                    aria-label={`Navigate to ${item.name}`}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-border" />
          <div className="space-y-3">
            <LanguageSwitcher data-lovable-lock="structure-only" className="w-full" />
            {user ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={() => handleNavigation(paths.auth, 'Login', true)}
                className="w-full justify-center px-4 py-2.5 text-sm font-semibold"
              >
                Login
              </Button>
            )}
          </div>

        </div>
      </nav>
    </header>;
};
