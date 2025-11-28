import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Users,
  CreditCard,
  MessageSquare,
  Menu,
  X,
  Briefcase,
  FileText
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

const navigation = [
  { name: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
  { name: "Post Job", href: "/employer/post-job", icon: PlusCircle },
  { name: "My Projects", href: "/employer/projects", icon: FolderOpen },
  { name: "Workers", href: "/employer/workers", icon: Users },
  { name: "Applications", href: "/employer/applications", icon: FileText },
  { name: "Payments", href: "/employer/payments", icon: CreditCard },
  { name: "Messages", href: "/employer/messages", icon: MessageSquare },
];

export function EmployerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuthStore();

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">
              <span className="text-primary">Rozgaar</span>
              <span className="text-secondary">Hub</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                activeClassName="bg-primary/10 text-primary font-medium"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
