import { useDebugStore } from '../../lib/debugStore';

export function DebugPanel({ onClose }: { onClose?: () => void }) {
  const logs = useDebugStore((s) => s.logs);
  const clearAll = useDebugStore((s) => s.clearAll);
  return (
    <div className="relative p-4 text-sm overflow-y-auto bg-black/90 text-green-300">
      {onClose && (
        <button
          className="absolute top-2 right-2 text-green-400 hover:text-red-400 text-lg font-bold bg-transparent border-none cursor-pointer"
          aria-label="Close Debug Panel"
          onClick={onClose}
        >
          ×
        </button>
      )}
      <h2 className="text-lg font-bold mb-2">🪵 Debug Prompts + Outputs</h2>
      <button
        className="mb-4 px-3 py-1 rounded bg-green-800 hover:bg-red-700 text-white font-bold"
        onClick={clearAll}
      >
        Clear All
      </button>
      {logs.map((log, i) => (
        <div key={i} className="mb-4 border-b border-green-800 pb-3">
          <div className="font-mono text-xs opacity-70">
            [{log.timestamp}] Node: {log.nodeId} | Model: {log.modelId} | Duration: {log.durationMs}ms
          </div>
          <pre className="whitespace-pre-wrap mt-2"><strong>Prompt:</strong>{'\n'}{log.prompt}</pre>
          <pre className="whitespace-pre-wrap mt-2"><strong>Raw Output:</strong>{'\n'}{log.rawOutput}</pre>
          {log.parsedOutput && (
            <pre className="whitespace-pre-wrap mt-2"><strong>Parsed Output:</strong>{'\n'}{JSON.stringify(log.parsedOutput, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
