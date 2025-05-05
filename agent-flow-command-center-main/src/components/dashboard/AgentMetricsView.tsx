
import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { agents, getAgentMetrics, getRecentTasks } from '@/data/agentData';

export function AgentMetricsView() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || "");
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="col-span-full mb-4">
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              className={`rounded px-3 py-1 text-sm ${
                selectedAgent === agent.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              {agent.name}
            </button>
          ))}
        </div>
      </div>
      
      {selectedAgent && (
        <>
          <Card className="bg-gray-900 text-white border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Task Completion Rate (24h)</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getAgentMetrics(selectedAgent)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#2a2a2a', border: 'none' }}
                      itemStyle={{ color: '#d1d5db' }}
                    />
                    <Line type="monotone" dataKey="completionRate" stroke="#8b5cf6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 text-white border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Error Rates by Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAgentMetrics(selectedAgent)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#2a2a2a', border: 'none' }}
                      itemStyle={{ color: '#d1d5db' }}
                    />
                    <Legend />
                    <Bar dataKey="syntaxErrors" fill="#ef4444" />
                    <Bar dataKey="timeoutErrors" fill="#f59e0b" />
                    <Bar dataKey="otherErrors" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-full bg-gray-900 text-white border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-medium">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Task ID</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getRecentTasks(selectedAgent).map((task) => (
                    <TableRow key={task.id} className="border-gray-800">
                      <TableCell className="font-mono">{task.id}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                          task.status === 'completed' 
                            ? 'bg-green-900/40 text-green-400' 
                            : task.status === 'failed'
                            ? 'bg-red-900/40 text-red-400'
                            : 'bg-yellow-900/40 text-yellow-400'
                        }`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>{task.duration}ms</TableCell>
                      <TableCell className="text-gray-400">{task.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
