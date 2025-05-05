
// Sample agent data for the metrics view

export const agents = [
  { id: 'input-1', name: 'User Input' },
  { id: 'action-1', name: 'Query Parser' },
  { id: 'action-2', name: 'Context Retriever' },
  { id: 'action-3', name: 'Reasoning Agent' },
  { id: 'action-4', name: 'Content Generator' },
  { id: 'output-1', name: 'Response Formatter' },
];

// Generate metrics data for the last 24 hours (hourly)
export const getAgentMetrics = (agentId: string) => {
  const baseData = [];
  const now = new Date();
  
  // Get agent for randomization based on type
  const agent = agents.find(a => a.id === agentId);
  const isReasoningAgent = agent?.id === 'action-3';
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(now.getHours() - i);
    
    // Create some variation in metrics
    const baseCompletion = Math.floor(70 + Math.random() * 30);
    const baseErrors = isReasoningAgent ? 5 + Math.random() * 10 : Math.random() * 5;
    
    // Add a spike in errors for the reasoning agent
    const syntaxErrors = isReasoningAgent && i === 4 
      ? 25 + Math.random() * 10 
      : Math.random() * 3;
      
    const timeoutErrors = isReasoningAgent && i === 4
      ? 15 + Math.random() * 10
      : Math.random() * 2;
    
    baseData.push({
      time: hour.getHours() + ':00',
      completionRate: baseCompletion,
      errorRate: baseErrors,
      syntaxErrors: Math.round(syntaxErrors * 10) / 10,
      timeoutErrors: Math.round(timeoutErrors * 10) / 10,
      otherErrors: Math.round(Math.random() * 5 * 10) / 10,
    });
  }
  
  return baseData;
};

// Generate recent tasks data
export const getRecentTasks = (agentId: string) => {
  const tasks = [];
  const now = new Date();
  const statuses = ['completed', 'failed', 'running'];
  
  // Get agent for randomization based on type
  const agent = agents.find(a => a.id === agentId);
  const isReasoningAgent = agent?.id === 'action-3';
  
  // More failures for the reasoning agent
  const failureProbability = isReasoningAgent ? 0.3 : 0.05;
  
  for (let i = 0; i < 10; i++) {
    const taskTime = new Date(now);
    taskTime.setMinutes(now.getMinutes() - i * 5 - Math.random() * 5);
    
    // Randomize status with weighted probability
    const random = Math.random();
    let status;
    
    if (i === 0) {
      status = 'running';
    } else if (random < failureProbability) {
      status = 'failed';
    } else {
      status = 'completed';
    }
    
    tasks.push({
      id: `task-${agentId}-${i}`,
      status,
      duration: Math.floor(100 + Math.random() * 400),
      timestamp: `${taskTime.toLocaleTimeString()} ${taskTime.toLocaleDateString()}`,
    });
  }
  
  return tasks;
};
