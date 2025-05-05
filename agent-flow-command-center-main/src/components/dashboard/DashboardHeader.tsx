import { Save, Play, Download, Settings, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { FlowViewHandle } from "./FlowView";
interface DashboardHeaderProps {
  onRunFlow: () => void;
  onSaveFlow: () => void;
  onCode: () => void;
  onSettings: () => void;
  flowSettings?: {
    flowMode?: string;
  };
}
export function DashboardHeader({
  onRunFlow,
  onSaveFlow,
  onCode,
  onSettings,
  flowSettings
}: DashboardHeaderProps) {
  return <header className="border-b border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">AI Agent Dispatch: Dynamic Node-to-Model Mapping Interface</h1>
            <span className="text-xs mt-1 w-max px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-600">
              Mode: {flowSettings?.flowMode === 'novel'
                ? 'Novel'
                : flowSettings?.flowMode === 'agent-chain'
                ? 'Agent Chain'
                : flowSettings?.flowMode === 'data-pipeline'
                ? 'Data Pipeline'
                : 'Default'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <span className="h-1 w-1 rounded-full bg-green-500"></span>
            <span>Connected to AI models</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white" onClick={onSettings}>
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white" onClick={onCode}>
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Code</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white" onClick={onSaveFlow}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
        // Export logic if needed
        >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="gap-2 bg-purple-600 text-white hover:bg-purple-700" onClick={onRunFlow}>
            <Play className="h-4 w-4" />
            <span>Run Flow</span>
          </Button>
        </div>
      </div>
    </header>;
}