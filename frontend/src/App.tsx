import React, { useState } from "react"
import { Layout as AppLayout } from "./components/layout/Layout"
import { AppSidebar } from "./components/layout/sidebar"
import { Header } from "./components/layout/header"
import { Dashboard } from "./pages/Dashboard"
import { SidebarProvider } from "./components/ui/sidebar"
import { ChildrenList } from "./pages/children/ChildrenList"
import { SessionManager } from "./pages/sessions/SessionManager"
import { ChildProgressDashboard } from "./pages/children/ChildProgressDashboard"
import { RewardsSystem } from "./pages/rewards/RewardsSystem"
import { NotesLibrary } from "./pages/notes/NotesLibrary"
import { ActivityLibrary } from "./pages/activities/ActivityLibrary"
import { Settings } from "./pages/Settings"
import { Toaster } from "./components/ui/sonner"
import ScheduleManager from "./pages/schedule/ScheduleManager"
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard"

function App() {
  const [activePage, setActivePage] = useState("dashboard")

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />
      case "children":
        return <ChildrenList />
      case "sessions":
        return <SessionManager />
      case "activities":
        return <ActivityLibrary />
      case "progress":
        return <ChildProgressDashboard />
      case "rewards":
        return <RewardsSystem />
      case "notes":
        return <NotesLibrary />
      case "schedule":
        return <ScheduleManager />
      case "analytics":
        return <AnalyticsDashboard />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <AppLayout
        sidebar={
          <AppSidebar activePage={activePage} setActivePage={setActivePage} />
        }
        header={<Header pageTitle={getPageTitle(activePage)} />}
      >
        {renderPage()}
        <Toaster />
      </AppLayout>
    </SidebarProvider>
  )
}

function getPageTitle(page: string): string {
  switch (page) {
    case "dashboard":
      return "Dashboard"
    case "children":
      return "Manajemen Anak"
    case "sessions":
      return "Sesi Terapi"
    case "activities":
      return " Aktivitas"
    case "progress":
      return "Progres Anak"
    case "rewards":
      return "Sistem Reward"
    case "notes":
      return "Catatan"
    case "schedule":
      return "Manajemen Jadwal"
    case "analytics":
      return "Analytics & Insights"
    case "settings":
      return "Pengaturan"
    default:
      return "Dashboard"
  }
}

export default App