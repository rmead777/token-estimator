import { useState, useRef, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FlowView, FlowViewHandle } from "@/components/dashboard/FlowView";
import { AgentMetricsView } from "@/components/dashboard/AgentMetricsView";
import { LogsView } from "@/components/dashboard/LogsView";
import { NotificationBar } from "@/components/dashboard/NotificationBar";
import APIKeysPage from "@/pages/APIKeysPage";
import ModelSystemValidator from "@/components/admin/ModelSystemValidator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { FlowSettings } from '@/components/dashboard/SettingsDrawer';
import { DebugPanel } from "@/components/dashboard/DebugPanel";
import { Button } from "@/components/ui/button";

type View = "flow" | "metrics" | "logs" | "api-keys" | "system-validator";

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    const savedView = localStorage.getItem('dashboard-active-view');
    return (savedView as View) || "flow";
  });

  useEffect(() => {
    localStorage.setItem('dashboard-active-view', currentView);
  }, [currentView]);
  
  const isMobile = useIsMobile();

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      message: string;
      type: "error" | "warning" | "info";
      timestamp: Date;
    }>
  >([
    {
      id: "1",
      message: "Agent X has failed 5 tasks in the last hour",
      type: "error",
      timestamp: new Date(),
    },
    {
      id: "2",
      message: "High latency detected in Agent Y",
      type: "warning",
      timestamp: new Date(),
    },
  ]);

  const [masterUserPrompt, setMasterUserPrompt] = useState<string>("");

  const flowViewRef = useRef<FlowViewHandle>(null);

  const [flowSettings, setFlowSettings] = useState<FlowSettings>({
    retryOnError: true,
    defaultModel: "gpt-4o",
    autoExpandOutputs: true,
    useMemoryByDefault: false,
    memoryWindow: 3,
    enableDynamicRouting: false,
    routingStrategy: "fastest",
    theme: "dark",
    nodeSpacing: 60,
    colorMode: "model",
    flowMode: "default",
  });

  const [showDebug, setShowDebug] = useState(false);

  const handleRunFlow = () => {
    flowViewRef.current?.runFlow();
  };
  const handleSaveFlow = () => {
    flowViewRef.current?.saveFlow();
  };
  const handleCode = () => {
    flowViewRef.current?.showCode();
  };
  const handleSettings = () => {
    flowViewRef.current?.showSettings();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <DashboardSidebar 
          currentView={currentView} 
          setCurrentView={(view) => {
            setCurrentView(view as View);
          }} 
        />
        <div className="flex flex-1 flex-col h-screen">
          <NotificationBar notifications={notifications} />
          <DashboardHeader
            onRunFlow={handleRunFlow}
            onSaveFlow={handleSaveFlow}
            onCode={handleCode}
            onSettings={handleSettings}
            flowSettings={flowSettings}
          />
          {currentView === "flow" && (
            <div className="bg-gray-950 border-b border-gray-800 p-3 flex gap-2 items-center">
              <label htmlFor="masterUserPrompt" className="text-sm font-medium text-gray-300 mr-2 flex-shrink-0">User Prompt:</label>
              <Input
                id="masterUserPrompt"
                type="text"
                className="bg-gray-900 border-gray-700 text-gray-100 w-full"
                value={masterUserPrompt}
                onChange={e => setMasterUserPrompt(e.target.value)}
                placeholder="Enter prompt for this run (optional)"
                autoComplete="off"
              />
            </div>
          )}
          <main className="flex-1 overflow-hidden p-4">
            <div className="h-full">
              <div style={{ height: '100%', display: currentView === "flow" ? "block" : "none" }}>
                <FlowView
                  ref={flowViewRef}
                  masterUserPrompt={masterUserPrompt}
                  flowSettings={flowSettings}
                  setFlowSettings={setFlowSettings}
                />
              </div>
              <div style={{ display: currentView === "metrics" ? "block" : "none" }}>
                <AgentMetricsView />
              </div>
              <div style={{ display: currentView === "logs" ? "block" : "none" }}>
                <LogsView />
              </div>
              <div style={{ display: currentView === "api-keys" ? "block" : "none" }}>
                <APIKeysPage />
              </div>
              <div style={{ display: currentView === "system-validator" ? "block" : "none" }}>
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-2xl font-bold mb-6">System Validation</h1>
                  <ModelSystemValidator />
                </div>
              </div>
            </div>
          </main>
          <Button onClick={() => setShowDebug(true)} className="fixed bottom-4 right-4 z-50">🪵 Show Debug</Button>
          {showDebug && (
            <div className="fixed inset-0 z-50 bg-black/80">
              <div className="absolute inset-0 overflow-y-auto">
                <DebugPanel onClose={() => setShowDebug(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
