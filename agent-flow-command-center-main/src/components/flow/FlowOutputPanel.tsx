import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download, X, Maximize2, Minimize2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { toast } from '@/components/ui/use-toast';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

export interface FlowOutput {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  modelId?: string;
  timestamp: string;
  input: any;
  output: any;
  executionTime?: number;
  config?: {
    systemPrompt?: string;
    [key: string]: any;
  };
}

interface FlowOutputPanelProps {
  outputs: FlowOutput[];
  isVisible: boolean;
  onClose: () => void;
  title?: string;
}

function formatOutputForCopy(output: FlowOutput): string {
  const parts = [];
  
  parts.push(`Node: ${output.nodeName}`);
  if (output.nodeType) parts.push(`Type: ${output.nodeType}`);
  if (output.modelId) parts.push(`Model: ${output.modelId}`);
  if (output.executionTime) parts.push(`Execution Time: ${output.executionTime}ms`);
  
  if (output.input) {
    parts.push('\nInput:');
    parts.push(extractInputSummaries(output.input));
  }
  
  parts.push('\nOutput:');
  parts.push(extractCleanText(output.output));
  
  if (output.config?.systemPrompt) {
    parts.push('\nSystem Prompt:');
    parts.push(output.config.systemPrompt);
  }
  
  return parts.join('\n');
}

function extractJustOutputText(data: any): string {
  if (!data) return '';
  
  if (typeof data === 'string') return data;
  
  if (typeof data === 'object' && typeof data.output === 'string') return data.output;
  
  if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
  
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
  
  if (typeof data.content === 'string') return data.content;
  if (typeof data.text === 'string') return data.text;
  
  if (data.raw) {
    return extractJustOutputText(data.raw);
  }
  
  return '';
}

function extractInputSummaries(input: any): string {
  if (Array.isArray(input)) {
    return input.map(item => extractJustOutputText(item)).filter(Boolean).join('\n---\n');
  } else {
    return extractJustOutputText(input);
  }
}

function extractCleanText(data: any): string {
  const text = extractJustOutputText(data) || (typeof data === 'object' ? JSON.stringify(data) : String(data));
  return text.trim();
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
        p: ({ children }) => <p className="mb-4">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ children }) => (
          <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-100 p-3 rounded-md mb-4 overflow-x-auto">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">{children}</blockquote>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function FlowOutputPanel({ outputs, isVisible, onClose, title = "Flow Execution Results" }: FlowOutputPanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isVisible) return null;

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleExportOutputs = () => {
    const jsonContent = JSON.stringify(outputs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow-outputs-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCopyOutput = (output: FlowOutput) => {
    const formattedText = formatOutputForCopy(output);
    navigator.clipboard.writeText(formattedText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The output has been copied with formatting",
      });
    }).catch(err => {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    });
  };

  const openLastOutputInNewWindow = async () => {
    if (outputs.length === 0) {
      toast({
        title: "No outputs available",
        description: "There is no output to display in a new window.",
        variant: "destructive",
      });
      return;
    }

    const lastOutput = outputs[outputs.length - 1];
    const rawHtml = await marked(extractCleanText(lastOutput.output)); // Convert Markdown to HTML
    const sanitizedHtml = DOMPurify.sanitize(rawHtml); // Sanitize the HTML

    const newWindow = window.open('', '_blank', 'width=800,height=600');

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Last Output</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body {
              background-color: white;
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              font-size: 2.5rem;
              font-weight: bold;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <h1>Last Output</h1>
          <div class="prose prose-invert max-w-none text-gray-900">
            ${sanitizedHtml}
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      toast({
        title: "Failed to open window",
        description: "Could not open a new window to display the output.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ease-in-out z-30 ${
        isFullscreen ? 'top-0' : ''
      }`}
    >
      {isFullscreen ? (
        <div className="h-full border-t border-gray-800">
          <Card className="bg-gray-900 text-white h-full overflow-hidden rounded-b-none">
            <div className="flex items-center justify-between p-3 border-b border-gray-800">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Badge variant="outline" className="ml-2 bg-gray-800">
                  {outputs.length} outputs
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-gray-300 border-gray-700"
                  onClick={openLastOutputInNewWindow}
                >
                  Open in New Window
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-gray-300 border-gray-700"
                  onClick={handleExportOutputs}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-300"
                  onClick={toggleFullscreen}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-gray-300"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-64px)]">
              {outputs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No output data available. Run the flow to see results.
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {outputs.map((output, index) => {
                    const nodeKey = `${output.nodeId}-${index}`;
                    const isExpanded = expandedNodes[nodeKey] || false;
                    const systemPrompt = output.config?.systemPrompt || '';

                    return (
                      <Collapsible
                        key={nodeKey}
                        open={isExpanded} 
                        onOpenChange={() => toggleNodeExpansion(nodeKey)}
                        className="rounded-md overflow-hidden"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 cursor-pointer rounded-t-md">
                            <div className="flex items-center">
                              {isExpanded ? 
                                <ChevronDown className="h-4 w-4 mr-2 text-gray-400" /> : 
                                <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                              }
                              <div className="flex flex-col">
                                <span className="font-medium">{output.nodeName}</span>
                                <div className="flex gap-2 text-xs text-gray-400">
                                  <span>{output.timestamp}</span>
                                  {output.executionTime && (
                                    <span>{output.executionTime}ms</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="capitalize bg-gray-700">
                                {output.nodeType}
                              </Badge>
                              {output.modelId && (
                                <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                                  {output.modelId}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="bg-white text-gray-900 p-4 rounded-b-md space-y-4">
                            {output.input && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium text-gray-600">Input:</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCopyOutput(output)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                                  <MarkdownContent content={extractInputSummaries(output.input)} />
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium text-gray-600">Output:</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleCopyOutput(output)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                                <MarkdownContent content={extractCleanText(output.output)} />
                              </div>
                            </div>
                            {systemPrompt && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium text-gray-600">System Prompt:</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCopyOutput(output)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto text-blue-600">
                                  <MarkdownContent content={systemPrompt} />
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      ) : (
        <ResizablePanelGroup 
          direction="vertical"
          className="h-full border-t border-gray-800"
          autoSaveId="flow-output-layout"
        >
          <ResizablePanel
            id="main-content"
            defaultSize={70}
            minSize={20}
          />
          
          <ResizableHandle 
            withHandle 
            id="resize-handle"
            className="h-4 bg-gray-800 hover:bg-gray-700" 
          />
          
          <ResizablePanel 
            id="output-panel"
            defaultSize={30}
            minSize={15}
            maxSize={80}
            className="min-h-[200px]"
          >
            <Card className="bg-gray-900 text-white h-full overflow-hidden rounded-b-none">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <Badge variant="outline" className="ml-2 bg-gray-800">
                    {outputs.length} outputs
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-gray-300 border-gray-700"
                    onClick={openLastOutputInNewWindow}
                  >
                    Open in New Window
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-gray-300 border-gray-700"
                    onClick={handleExportOutputs}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-300"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-300"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[300px]">
                {outputs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No output data available. Run the flow to see results.
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {outputs.map((output, index) => {
                      const nodeKey = `${output.nodeId}-${index}`;
                      const isExpanded = expandedNodes[nodeKey] || false;
                      const systemPrompt = output.config?.systemPrompt || '';

                      return (
                        <Collapsible
                          key={nodeKey}
                          open={isExpanded} 
                          onOpenChange={() => toggleNodeExpansion(nodeKey)}
                          className="rounded-md overflow-hidden"
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 cursor-pointer rounded-t-md">
                              <div className="flex items-center">
                                {isExpanded ? 
                                  <ChevronDown className="h-4 w-4 mr-2 text-gray-400" /> : 
                                  <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                                }
                                <div className="flex flex-col">
                                  <span className="font-medium">{output.nodeName}</span>
                                  <div className="flex gap-2 text-xs text-gray-400">
                                    <span>{output.timestamp}</span>
                                    {output.executionTime && (
                                      <span>{output.executionTime}ms</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="capitalize bg-gray-700">
                                  {output.nodeType}
                                </Badge>
                                {output.modelId && (
                                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-200">
                                    {output.modelId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="bg-white text-gray-900 p-4 rounded-b-md space-y-4">
                              {output.input && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-600">Input:</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleCopyOutput(output)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                                    <MarkdownContent content={extractInputSummaries(output.input)} />
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-sm font-medium text-gray-600">Output:</h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleCopyOutput(output)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto">
                                  <MarkdownContent content={extractCleanText(output.output)} />
                                </div>
                              </div>
                              {systemPrompt && (
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-medium text-gray-600">System Prompt:</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleCopyOutput(output)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-md text-sm overflow-x-auto text-blue-600">
                                    <MarkdownContent content={systemPrompt} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
