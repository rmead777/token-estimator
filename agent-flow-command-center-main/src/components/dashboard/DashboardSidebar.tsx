import React from "react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { BarChart, PanelLeft, Activity, Key, Settings, CheckCircle } from "lucide-react";
interface DashboardSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}
export function DashboardSidebar({
  currentView,
  setCurrentView
}: DashboardSidebarProps) {
  return <Sidebar className="border-r border-border">
      <SidebarHeader className="px-6 py-5">
        <h2 className="text-xl font-semibold tracking-tight">AI-gency</h2>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <nav className="grid gap-1">
          <Button variant={currentView === "flow" ? "default" : "ghost"} className="justify-start" onClick={() => setCurrentView("flow")}>
            <PanelLeft className="mr-2 h-5 w-5" />
            Flows
          </Button>
          <Button variant={currentView === "metrics" ? "default" : "ghost"} className="justify-start" onClick={() => setCurrentView("metrics")}>
            <BarChart className="mr-2 h-5 w-5" />
            Metrics
          </Button>
          <Button variant={currentView === "logs" ? "default" : "ghost"} className="justify-start" onClick={() => setCurrentView("logs")}>
            <Activity className="mr-2 h-5 w-5" />
            Logs
          </Button>
          <Button variant={currentView === "api-keys" ? "default" : "ghost"} className="justify-start" onClick={() => setCurrentView("api-keys")}>
            <Key className="mr-2 h-5 w-5" />
            API Keys
          </Button>
          <Button variant={currentView === "system-validator" ? "default" : "ghost"} className="justify-start" onClick={() => setCurrentView("system-validator")}>
            <CheckCircle className="mr-2 h-5 w-5" />
            System Validator
          </Button>
        </nav>
      </SidebarContent>
      <SidebarFooter className="px-4 py-4">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </SidebarFooter>
    </Sidebar>;
}