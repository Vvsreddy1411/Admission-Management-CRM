import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
export function AppLayout({ children }) {
    const { session } = useAuth();
    return (<SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4"/>
              <span className="text-sm text-muted-foreground font-body">Admission Management System</span>
            </div>
            {session && (<div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{session.name}</span>
                <Badge variant="outline" className="text-xs">{session.role}</Badge>
              </div>)}
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>);
}
