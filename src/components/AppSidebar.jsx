import {
  LayoutDashboard,
  Settings,
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  canManageApplicants,
  canManageMasters,
  canViewOnly,
} from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { session, logout } = useAuth();
  const role = session?.role || "Management";
  const isActive = (path) => location.pathname === path;

  const mainNav = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, show: true },
    {
      title: "Applicants",
      url: "/applicants",
      icon: Users,
      show: canManageApplicants(role),
    },
    {
      title: "Admissions",
      url: "/admissions",
      icon: GraduationCap,
      show: canManageApplicants(role),
    },
    {
      title: "Seat Matrix",
      url: "/seat-matrix",
      icon: BarChart3,
      show: !canViewOnly(role),
    },
  ].filter((item) => item.show);

  const setupNav = [
    {
      title: "Master Setup",
      url: "/master-setup",
      icon: Settings,
      show: canManageMasters(role),
    },
    {
      title: "Quota Config",
      url: "/quota-config",
      icon: ClipboardList,
      show: canManageMasters(role),
    },
    {
      title: "Institution Caps",
      url: "/institution-caps",
      icon: Shield,
      show: canManageMasters(role),
    },
  ].filter((item) => item.show);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="font-display text-sm font-bold text-sidebar-foreground truncate">
                AdmitFlow
              </h2>
              <p className="text-[10px] text-sidebar-foreground/60">
                Admission CRM
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider mb-2 px-3">
            {!collapsed && "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive(item.url)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {setupNav.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-wider mb-2 px-3">
              {!collapsed && "Configuration"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {setupNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          isActive(item.url)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && session && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {session.name}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50">
              {session.role}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={toggleSidebar}
            className="flex-1 flex items-center justify-center py-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center py-2 px-3 rounded-lg text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
