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
  FileText,
  User
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";

export function EmployerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadMessages();
  const { logout } = useAuthStore();
  const { t } = useTranslation();

  const navigation = [
    { name: t('nav.dashboard'), href: "/employer/dashboard", icon: LayoutDashboard },
    { name: t('nav.postJob'), href: "/employer/post-job", icon: PlusCircle },
    { name: t('nav.myProjects'), href: "/employer/projects", icon: FolderOpen },
    { name: t('nav.workers'), href: "/employer/workers", icon: Users },
    { name: t('nav.applications'), href: "/employer/applications", icon: FileText },
    { name: t('nav.payments'), href: "/employer/payments", icon: CreditCard },
    { name: t('nav.messages'), href: "/employer/messages", icon: MessageSquare, badge: unreadCount },
    { name: t('nav.profile'), href: "/employer/profile", icon: User },
  ];

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
            <img src="/logo.jpg" alt="RozgaarHub" className="h-10 w-auto object-contain" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                activeClassName="bg-primary/10 text-primary font-medium"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-medium">{t('language')}</span>
              <LanguageSwitcher />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              {t('nav.logout')}
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
