import { useState, useEffect } from 'react';
import { Search, Filter, Download, AlertCircle, FileJson } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logs, flowOutputs } from '@/data/logData';
import { FlowOutputPanel } from '@/components/flow/FlowOutputPanel';
import { logger } from "../../lib/utils"; // Corrected logger import to use named import

export function LogsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('logs');
  const [showOutputDetails, setShowOutputDetails] = useState(false);

  useEffect(() => {
    logger.info("LogsView component mounted");
    return () => logger.info("LogsView component unmounted");
  }, []);

  const filteredLogs = logs
    .filter(log => 
      (agentFilter === 'all' || log.agentName === agentFilter) &&
      (eventFilter === 'all' || log.eventType === eventFilter) &&
      (searchTerm === '' || 
       log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.eventType.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const agents = Array.from(new Set(logs.map(log => log.agentName)));
  const eventTypes = Array.from(new Set(logs.map(log => log.eventType)));

  const downloadCSV = () => {
    try {
      const headers = ['Timestamp', 'Agent Name', 'Event Type', 'Details'].join(',');
      const csvContent = filteredLogs.map(log => 
        [
          log.timestamp,
          `"${log.agentName}"`,
          `"${log.eventType}"`,
          `"${log.details.replace(/"/g, '""')}"`
        ].join(',')
      ).join('\n');
      
      const csv = `${headers}\n${csvContent}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `agent_logs_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logger.error("Error exporting logs to CSV", error);
    }
  };

  return (
    <Card className="bg-gray-900 text-white border-gray-800 p-4">
      <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-4 flex justify-between items-center">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="logs">System Logs</TabsTrigger>
            <TabsTrigger value="outputs">Flow Outputs</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={downloadCSV}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export {activeTab === 'logs' ? 'Logs' : 'Outputs'}</span>
            </Button>
          </div>
        </div>

        <TabsContent value="logs" className="p-0 border-none">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search logs..."
                className="border-gray-800 bg-gray-800 pl-8 text-white placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[160px] border-gray-800 bg-gray-800 text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Agent" />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-gray-800 text-white">
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-[160px] border-gray-800 bg-gray-800 text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Event" />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-gray-800 text-white">
                  <SelectItem value="all">All Events</SelectItem>
                  {eventTypes.map(event => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 w-40">Timestamp</TableHead>
                  <TableHead className="text-gray-400">Agent Name</TableHead>
                  <TableHead className="text-gray-400">Event Type</TableHead>
                  <TableHead className="text-gray-400">Details</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className={`border-gray-800 hover:bg-gray-800/50 ${
                      log.eventType === 'error' ? 'bg-red-900/10' : ''
                    }`}>
                      <TableCell className="text-xs text-gray-400">{log.timestamp}</TableCell>
                      <TableCell>{log.agentName}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          log.eventType === 'error' 
                            ? 'bg-red-900/40 text-red-400' 
                            : log.eventType === 'warning'
                            ? 'bg-yellow-900/40 text-yellow-400'
                            : log.eventType === 'info'
                            ? 'bg-blue-900/40 text-blue-400'
                            : 'bg-green-900/40 text-green-400'
                        }`}>
                          {log.eventType === 'error' && <AlertCircle className="mr-1 h-3 w-3" />}
                          {log.eventType}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.details}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.eventType === 'error' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                          >
                            Debug
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No logs match the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="outputs" className="p-0 border-none">
          {showOutputDetails ? (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowOutputDetails(false)}
                className="mb-2"
              >
                Back to Output List
              </Button>
              <FlowOutputPanel 
                outputs={flowOutputs} 
                isVisible={true} 
                onClose={() => setShowOutputDetails(false)} 
                title="Historical Flow Outputs" 
              />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Input
                  placeholder="Search flow outputs..."
                  className="border-gray-800 bg-gray-800 text-white placeholder:text-gray-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="rounded-md border border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 w-40">Timestamp</TableHead>
                      <TableHead className="text-gray-400">Flow Run</TableHead>
                      <TableHead className="text-gray-400">Nodes</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flowOutputs.length > 0 ? (
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-xs text-gray-400">
                          {new Date().toLocaleString()}
                        </TableCell>
                        <TableCell>Last Flow Execution</TableCell>
                        <TableCell>{flowOutputs.length} nodes processed</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                            onClick={() => setShowOutputDetails(true)}
                          >
                            <FileJson className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No flow outputs available. Run a flow to generate outputs.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
