import React, { useState, useCallback } from 'react';
import { Calculator, DollarSign, Type, Zap, Upload, File, X } from 'lucide-react';

const TokenEstimator = () => {
  const [inputText, setInputText] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [outputRatio, setOutputRatio] = useState(1.0); // Default 1:1 ratio (100%)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: number;
    name: string;
    size: number;
    text: string;
    tokens: number;
  }>>([]);

  // AI model pricing (per 1M tokens) - Updated October 2025
  const models = [
    {
      name: 'Grok 4 Fast',
      company: 'xAI',
      inputPrice: 0.20,   // per 1M input tokens
      outputPrice: 0.50,  // per 1M output tokens
      contextWindow: '2M tokens',
      color: 'bg-cyan-500',
      textColor: 'text-cyan-700'
    },
    {
      name: 'GPT-5 Nano',
      company: 'OpenAI',
      inputPrice: 0.05,
      outputPrice: 0.40,
      contextWindow: '400K tokens',
      color: 'bg-lime-500',
      textColor: 'text-lime-700'
    },
    {
      name: 'GPT-5 Mini',
      company: 'OpenAI',
      inputPrice: 0.25,
      outputPrice: 2.00,
      contextWindow: '400K tokens',
      color: 'bg-green-500',
      textColor: 'text-green-700'
    },
    {
      name: 'GPT-5',
      company: 'OpenAI',
      inputPrice: 1.25,
      outputPrice: 10.00,
      contextWindow: '400K tokens',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700'
    },
    {
      name: 'Gemini 2.5 Pro',
      company: 'Google',
      inputPrice: 1.25,  // ≤200K tokens
      outputPrice: 10.00, // ≤200K tokens
      contextWindow: '2M+ tokens',
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      name: 'Grok 4',
      company: 'xAI',
      inputPrice: 3.00,
      outputPrice: 15.00,
      contextWindow: '256K tokens',
      color: 'bg-gray-500',
      textColor: 'text-gray-700'
    },
    {
      name: 'Claude Sonnet 4.5',
      company: 'Anthropic',
      inputPrice: 3.00,  // ≤200K tokens
      outputPrice: 15.00, // ≤200K tokens
      contextWindow: '200K-1M tokens',
      color: 'bg-purple-500',
      textColor: 'text-purple-700'
    },
    {
      name: 'Claude Opus 4.1',
      company: 'Anthropic',
      inputPrice: 15.00,
      outputPrice: 75.00,
      contextWindow: '200K tokens',
      color: 'bg-orange-500',
      textColor: 'text-orange-700'
    }
  ];

  // Simple token estimation function
  const estimateTokens = useCallback((text: string) => {
    if (!text) return 0;
    
    // Rough approximation: ~4 characters per token on average
    // This accounts for spaces, punctuation, and typical word lengths
    const roughEstimate = Math.ceil(text.length / 4);
    
    // Adjust for different text characteristics
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);
    
    // Longer words typically use fewer tokens per character
    const adjustmentFactor = avgWordLength > 6 ? 0.85 : avgWordLength < 4 ? 1.15 : 1.0;
    
    return Math.max(1, Math.ceil(roughEstimate * adjustmentFactor));
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setEstimatedTokens(estimateTokens(text));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      try {
        const text = await readFileAsText(file);
        const tokens = estimateTokens(text);
        
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          text: text,
          tokens: tokens
        }]);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
    
    e.target.value = ''; // Reset input
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = (e) => {
        reject(e);
      };
      
      reader.readAsText(file);
    });
  };

  const removeFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getTotalTokens = () => {
    const textTokens = estimatedTokens;
    const fileTokens = uploadedFiles.reduce((sum, file) => sum + file.tokens, 0);
    return textTokens + fileTokens;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCost = (cost: number) => {
    if (cost < 0.001) {
      return `${(cost * 1000).toFixed(4)}¢`; // Show in fractions of cents
    } else if (cost < 0.01) {
      return `${(cost * 100).toFixed(3)}¢`; // Show in cents
    } else if (cost < 1) {
      return `$${cost.toFixed(4)}`; // Show in dollars with 4 decimal places
    }
    return `$${cost.toFixed(2)}`; // Show in dollars with 2 decimal places
  };

  const calculateCost = (tokens: number, pricePerMillion: number) => {
    return (tokens / 1_000_000) * pricePerMillion;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Token & Cost Estimator</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Estimate tokens and costs across flagship AI models
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Input Text</h2>
          </div>
          
          <textarea
            value={inputText}
            onChange={handleTextChange}
            placeholder="Paste or type your text here to estimate tokens and costs..."
            className="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Characters: {inputText.length}</span>
              <span className="text-sm text-gray-600">Words: {inputText.split(/\s+/).filter(word => word.length > 0).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-gray-800">Text Tokens: {estimatedTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Upload Documents</h2>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="fileUpload"
              multiple
              accept=".txt,.md,.json,.csv,.html,.xml,.js,.py,.java,.cpp,.c,.h,.css"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Click to upload documents or drag and drop</p>
              <p className="text-sm text-gray-500">Supports .txt, .md, .json, .csv, .html, .xml, and code files</p>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h3>
              {uploadedFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-800">{file.tokens.toLocaleString()} tokens</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-4 p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              ))}
              
              <div className="flex justify-end pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-gray-800">Total from Files: {uploadedFiles.reduce((sum, f) => sum + f.tokens, 0).toLocaleString()} tokens</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Combined Total Section */}
        {(estimatedTokens > 0 || uploadedFiles.length > 0) && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Grand Total</h2>
                <p className="text-blue-100">Combined tokens from text input and uploaded files</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-3 justify-end">
                  <Zap className="w-8 h-8" />
                  <span className="text-4xl font-bold">{getTotalTokens().toLocaleString()}</span>
                </div>
                <p className="text-blue-100 mt-1">tokens</p>
              </div>
            </div>
          </div>
        )}

        {/* Output Ratio Control */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Output Token Ratio</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="outputRatio" className="text-sm text-gray-600">
                Expected output tokens as a percentage of input tokens:
              </label>
              <span className="text-lg font-bold text-blue-600">{Math.round(outputRatio * 100)}%</span>
            </div>
            
            <input
              id="outputRatio"
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={outputRatio}
              onChange={(e) => setOutputRatio(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>10% (Summarization)</span>
              <span>100% (Equal)</span>
              <span>500% (Code Gen)</span>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Use case examples:</strong>
                <span className="block mt-1">• Summarization: 10-30% | Q&A: 10-50% | Translation: 80-120%</span>
                <span className="block">• Chat: 50-150% | Code generation: 200-500%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {models.map((model, index) => {
            const totalTokens = getTotalTokens();
            const inputCost = calculateCost(totalTokens, model.inputPrice);
            const outputTokens = totalTokens * outputRatio;
            const outputCost = calculateCost(outputTokens, model.outputPrice);
            const totalCost = inputCost + outputCost;

            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`${model.color} h-2`}></div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.company}</p>
                    </div>
                    <DollarSign className={`w-6 h-6 ${model.textColor}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Input Cost:</span>
                      <span className="font-semibold text-gray-900">{formatCost(inputCost)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Output Cost:</span>
                      <span className="font-semibold text-gray-900">{formatCost(outputCost)}</span>
                    </div>
                    
                    <div className="text-xs text-gray-500 italic">
                      ({Math.round(outputRatio * 100)}% output ratio)
                    </div>
                    
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total Est. Cost:</span>
                        <span className={`font-bold text-lg ${model.textColor}`}>
                          {formatCost(totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Input: ${model.inputPrice}/1M tokens</div>
                      <div>Output: ${model.outputPrice}/1M tokens</div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="font-medium text-gray-600">Context: {model.contextWindow}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p>• Token estimation uses a ~4 characters per token approximation with adjustments for word length</p>
            <p>• Adjust the output ratio slider to match your use case (e.g., summarization vs code generation)</p>
            <p>• Actual token counts may vary based on the specific tokenizer used by each model</p>
            <p>• Prices based on official October 2025 rates from OpenAI, Anthropic, xAI, and Google</p>
            <p>• Models with tiered pricing (Gemini 2.5 Pro, Claude Sonnet 4.5) show base tier rates (≤200K tokens)</p>
            <p>• <strong>Most Cost-Effective:</strong> Grok 4 Fast ($0.20/$0.50 per 1M tokens with 2M context)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenEstimator;
