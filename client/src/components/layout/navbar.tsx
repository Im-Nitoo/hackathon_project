import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  User,
  LogOut,
  Settings
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 shadow-sm border-b border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-primary dark:text-white">TruthNode</span>
            </Link>
            <span className="hidden sm:inline-block px-2 py-1 text-xs bg-secondary/10 text-secondary dark:text-neutral-200 dark:bg-secondary/20 rounded-full">Testnet</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link href="/#featured" className="text-sm font-medium hover:text-primary dark:hover:text-neutral-200 transition-colors">
              Featured
            </Link>
            <Link href="/articles" className="text-sm font-medium hover:text-primary dark:hover:text-neutral-200 transition-colors">
              Verified
            </Link>
            <Link href="/community" className="text-sm font-medium hover:text-primary dark:hover:text-neutral-200 transition-colors">
              Community
            </Link>
            <Link href="/whistleblower" className="text-sm font-medium hover:text-primary dark:hover:text-neutral-200 transition-colors">
              Whistleblower
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-primary/20">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                      {user.truthTokens || 0} TT
                    </span>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            )}
            
            <button
              className="md:hidden p-2"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/#featured"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Featured
            </Link>
            <Link
              href="/articles"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Verified
            </Link>
            <Link
              href="/community"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              href="/whistleblower"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Whistleblower
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
