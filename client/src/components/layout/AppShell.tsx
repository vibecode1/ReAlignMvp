import { ReactNode, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CollapsibleSidebar } from "./CollapsibleSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "@/components/ui/logo";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <CollapsibleSidebar 
        isMobileMenuOpen={mobileMenuOpen}
        setIsMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-16">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden"
                >
                  {/* Menu icon is handled in CollapsibleSidebar */}
                </Button>
              )}
              <Logo size="md" variant="full" />
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell size={20} />
                <Badge variant="destructive" className="ml-1 px-1 min-w-[1.25rem] h-5">
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/account">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
};

export default AppShell;
