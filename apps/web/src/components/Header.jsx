
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import { Menu, LogOut, User, Bell, CalendarDays, Home, LayoutDashboard, Briefcase, Calendar, Eye, List } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useNotifications } from '@/hooks/useNotifications.js';

const Header = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log(`[Header] Path changed to: ${location.pathname}`);
  }, [location.pathname]);

  const handleLogout = () => {
    console.log('[Header] Logging out');
    pb.authStore.clear();
    window.location.href = '/login';
  };

  const getNavLinks = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'owner':
        return [
          { name: 'Dashboard', path: '/owner-dashboard' },
          { name: 'Orders', path: '/orders' },
          { name: 'Products', path: '/products' },
          { name: 'Calendar', path: '/owner/calendar-events' },
          { name: 'Financials', path: '/financial' },
          { name: 'Team', path: '/team-management' }
        ];
      case 'designer':
        return [
          { name: 'Dashboard', path: '/designer-dashboard', icon: LayoutDashboard },
          { name: 'My Projects', path: '/designer/my-projects', icon: Briefcase },
          { name: 'Calendar', path: '/designer-calendar', icon: Calendar }
        ];
      case 'crew':
        return [
          { name: 'Dashboard', path: '/crew-dashboard', icon: Home },
          { name: 'Crew Calendar', path: '/crew-calendar', icon: CalendarDays }
        ];
      case 'design_reviewer':
        return [
          { name: 'Review Dashboard', path: '/design-reviewer-dashboard', icon: Eye },
          { name: 'Calendar', path: '/design-reviewer-calendar', icon: Calendar },
          { name: 'Work Directory', path: '/design-work-list', icon: List }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Menu */}
        {currentUser && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-xl mb-4">Thenarsis</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.path 
                        ? 'bg-[hsl(var(--accent-yellow))]/10 text-[hsl(var(--accent-yellow-active))]' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    {link.name}
                  </Link>
                ))}
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive mt-4 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Logo */}
        <Link to={currentUser ? `/${currentUser.role.replace('_', '-')}-dashboard` : '/'} className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            T
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">Thenarsis</span>
          {currentUser?.role === 'design_reviewer' && (
            <Badge variant="outline" className="hidden lg:flex ml-2 text-[10px] uppercase tracking-wider bg-purple-100 text-purple-800 border-purple-200">
              Reviewer Portal
            </Badge>
          )}
        </Link>

        {/* Desktop Navigation */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors flex items-center gap-1.5 hover:text-primary ${
                  location.pathname === link.path 
                    ? 'text-primary border-b-2 border-primary py-5 -mb-[22px]' 
                    : 'text-muted-foreground'
                }`}
              >
                {link.icon && ['crew', 'designer', 'design_reviewer'].includes(currentUser.role) && <link.icon className="w-4 h-4" />}
                {link.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-3">
          {!currentUser ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--accent-yellow))]/10"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-xl ml-1 p-0 overflow-hidden">
                    <Avatar className="h-9 w-9 border border-border rounded-xl">
                      <AvatarImage src={currentUser.avatar ? pb.files.getURL(currentUser, currentUser.avatar) : ''} alt={currentUser.name} />
                      <AvatarFallback className="bg-[hsl(var(--accent-yellow))]/20 text-[hsl(var(--accent-yellow-active))] font-bold rounded-xl">
                        {currentUser.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                      <div className="pt-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-[hsl(var(--accent-yellow))]/10 text-[hsl(var(--accent-yellow-active))] border-[hsl(var(--accent-yellow))]/20">
                          {currentUser.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
