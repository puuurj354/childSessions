import React from "react"
import {
  Home,
  Users,
  Calendar,
  Activity,
  Award,
  FileText,
  Settings,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Clock,
  BookOpen,
} from "lucide-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  activePage: string
  setActivePage: (page: string) => void
}

export function AppSidebar({ activePage, setActivePage }: AppSidebarProps) {
  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      value: "dashboard",
    },
    { icon: <Users size={20} />, label: "Anak", value: "children" },
    { icon: <Calendar size={20} />, label: "Sesi", value: "sessions" },
    { icon: <BookOpen size={20} />, label: "Template", value: "templates" },
    { icon: <Activity size={20} />, label: "Aktivitas", value: "activities" },
    {
      icon: <TrendingUp size={20} />,
      label: "Progres Anak",
      value: "progress",
    },
    { icon: <Award size={20} />, label: "Rewards", value: "rewards" },
    { icon: <FileText size={20} />, label: "Catatan", value: "notes" },
    { icon: <Clock size={20} />, label: "Jadwal", value: "schedule" },
    { icon: <BarChart3 size={20} />, label: "Analytics", value: "analytics" },
    { icon: <Settings size={20} />, label: "Pengaturan", value: "settings" },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-2">
          {" "}
          {/* Added padding for alignment */}
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Child Sessions
          </h1>
          <p className="text-sm text-sidebar-foreground/70">Toolkit Terapis</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.value}>
              <SidebarMenuButton
                isActive={activePage === item.value}
                onClick={() => setActivePage(item.value)}
                tooltip={item.label} // Use shadcn's tooltip feature for collapsed state
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <p className="text-xs text-sidebar-foreground/70">
          Child Sessions v1.0.0
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
