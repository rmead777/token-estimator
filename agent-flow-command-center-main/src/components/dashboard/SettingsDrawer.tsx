import React, { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: FlowSettings;
  onChange: (settings: FlowSettings) => void;
}

export interface FlowSettings {
  retryOnError: boolean;
  defaultModel: string;
  autoExpandOutputs: boolean;
  useMemoryByDefault: boolean;
  memoryWindow: number;
  enableDynamicRouting: boolean;
  routingStrategy: 'fastest' | 'cheapest' | 'mostAccurate';
  theme: 'dark' | 'light';
  nodeSpacing: number;
  colorMode: 'status' | 'model' | 'custom';
  flowMode: 'default' | 'novel' | 'agent-chain' | 'data-pipeline'; // 🧠 FLOWMODE INTEGRATION
}

const defaultModels = ['gpt-4o', 'gpt-4.1', 'claude-3', 'gemini-1.5', 'sonar-pro'];
const routingStrategies: FlowSettings['routingStrategy'][] = ['fastest', 'cheapest', 'mostAccurate'];
const themes: FlowSettings['theme'][] = ['dark', 'light'];
const colorModes: FlowSettings['colorMode'][] = ['status', 'model', 'custom'];

const DEFAULT_SETTINGS: FlowSettings = {
  retryOnError: true,
  defaultModel: 'gpt-4o',
  autoExpandOutputs: true,
  useMemoryByDefault: false,
  memoryWindow: 3,
  enableDynamicRouting: false,
  routingStrategy: 'fastest',
  theme: 'dark',
  nodeSpacing: 100,
  colorMode: 'model',
  flowMode: 'default', // 🧠 FLOWMODE INTEGRATION
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose, settings, onChange }) => {
  const update = <K extends keyof FlowSettings>(key: K, value: FlowSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onChange(updated);
    localStorage.setItem('flowSettings', JSON.stringify(updated));
    if (key === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  };

  const handleReset = () => {
    onChange(DEFAULT_SETTINGS);
    localStorage.setItem('flowSettings', JSON.stringify(DEFAULT_SETTINGS));
    document.documentElement.classList.toggle('dark', DEFAULT_SETTINGS.theme === 'dark');
  };

  useEffect(() => {
    const syncSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('agent_settings' as any).upsert({
              agent_id: session.user.id,
              details: settings
            });
    };
    syncSettings();
  }, [settings]);

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent
        side="right"
        className="bg-slate-900 text-white !max-w-none"
        style={{ width: "1000px", maxWidth: "1000px" }}
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold mb-4 text-yellow-300 drop-shadow">⚙️ Flow Settings</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="general" className="w-full mt-4">
          <div className="overflow-x-auto hide-scrollbar">
            <TabsList className="grid grid-cols-4 gap-4 mb-4 bg-white rounded-t-md overflow-hidden ring-1 ring-slate-300 px-2 h-16 items-center">
              <TabsTrigger
                value="general"
                className="whitespace-nowrap px-6 py-3 text-lg font-semibold text-black transition-colors duration-150 flex items-center justify-center h-full aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:ring-2 aria-selected:ring-emerald-400"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="output"
                className="whitespace-nowrap px-6 py-3 text-lg font-semibold text-black transition-colors duration-150 flex items-center justify-center h-full aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:ring-2 aria-selected:ring-emerald-400"
              >
                Output
              </TabsTrigger>
              <TabsTrigger
                value="memory"
                className="whitespace-nowrap px-6 py-3 text-lg font-semibold text-black transition-colors duration-150 flex items-center justify-center h-full aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:ring-2 aria-selected:ring-emerald-400"
              >
                Memory + Routing
              </TabsTrigger>
              <TabsTrigger
                value="theme"
                className="whitespace-nowrap px-6 py-3 text-lg font-semibold text-black transition-colors duration-150 flex items-center justify-center h-full aria-selected:bg-emerald-500 aria-selected:text-white aria-selected:ring-2 aria-selected:ring-emerald-400"
              >
                Visual Theme
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-180px)] pt-4 pr-2">
            {/* General */}
            <TabsContent value="general" className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retry on Error</span>
                <Switch checked={settings.retryOnError} onCheckedChange={(val) => update('retryOnError', val)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Default Model</label>
                <Select value={settings.defaultModel} onValueChange={(val) => update('defaultModel', val)}>
                  <SelectTrigger className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultModels.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Flow Mode</label>
                <Select value={settings.flowMode} onValueChange={(val) => update('flowMode', val as FlowSettings['flowMode'])}>
                  <SelectTrigger className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="novel">Novel / Story Engine</SelectItem>
                    <SelectItem value="agent-chain">Agent Chain</SelectItem>
                    <SelectItem value="data-pipeline">Data Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Output */}
            <TabsContent value="output" className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto Expand Outputs</span>
                <Switch checked={settings.autoExpandOutputs} onCheckedChange={(val) => update('autoExpandOutputs', val)} />
              </div>
            </TabsContent>

            {/* Memory + Routing */}
            <TabsContent value="memory" className="space-y-6">
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Memory Settings</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Memory by Default</span>
                <Switch checked={settings.useMemoryByDefault} onCheckedChange={(val) => update('useMemoryByDefault', val)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Memory Window (past runs)</label>
                <input
                  type="number"
                  value={settings.memoryWindow}
                  onChange={(e) => update('memoryWindow', parseInt(e.target.value))}
                  className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm w-full text-white"
                />
              </div>

              <Separator className="my-2" />
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Routing Strategy</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Dynamic Routing</span>
                <Switch checked={settings.enableDynamicRouting} onCheckedChange={(val) => update('enableDynamicRouting', val)} />
              </div>
              <div>
                <label className="block text-sm mb-1">Routing Logic</label>
                <Select value={settings.routingStrategy} onValueChange={(val) => update('routingStrategy', val as FlowSettings['routingStrategy'])}>
                  <SelectTrigger className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routingStrategies.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Visual Theme */}
            <TabsContent value="theme" className="space-y-6">
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Appearance</h3>

              <div>
                <label className="block text-sm mb-1">Theme</label>
                <Select value={settings.theme} onValueChange={(val) => update('theme', val as FlowSettings['theme'])}>
                  <SelectTrigger className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-1">Node Spacing</label>
                <Slider
                  value={[settings.nodeSpacing]}
                  onValueChange={([val]) => update('nodeSpacing', val)}
                  min={20}
                  max={200}
                  step={10}
                  className="w-full custom-slider"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Color Mode</label>
                <Select value={settings.colorMode} onValueChange={(val) => update('colorMode', val as FlowSettings['colorMode'])}>
                  <SelectTrigger className="bg-slate-800 border border-slate-700 rounded px-2 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="mt-6 flex justify-between">
          <Button variant="destructive" onClick={handleReset}>Reset to Defaults</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
