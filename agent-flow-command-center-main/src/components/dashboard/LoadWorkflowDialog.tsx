import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listUserFlows, UserFlow } from "@/data/workflowStorage";
export function LoadWorkflowDialog({
  open,
  onClose,
  onLoad
}: {
  open: boolean;
  onClose: () => void;
  onLoad: (flow: UserFlow) => void;
}) {
  const [flows, setFlows] = useState<UserFlow[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      setLoading(true);
      listUserFlows().then(flows => {
        setFlows(flows);
        setLoading(false);
      });
    }
  }, [open]);
  return <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent className="bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-slate-50 text-center font-bold text-lg">Load Saved Workflow</DialogTitle>
        </DialogHeader>
        {loading ? <div className="py-4 text-center text-muted">Loading...</div> : <div className="space-y-2">
            {flows.length === 0 && <div className="text-sm text-muted">No saved workflows found.</div>}
            {flows.map(flow => <div key={flow.id} className="flex justify-between items-center border px-3 py-2 bg-stone-200 rounded-md">
                <div>
                  <span className="font-medium">{flow.name}</span>
                  <span className="ml-2 text-xs text-zinc-950">{new Date(flow.updated_at).toLocaleString()}</span>
                </div>
                <Button className="px-3 py-1 text-xs" onClick={() => {
            onLoad(flow);
            onClose();
          }}>
                  Load
                </Button>
              </div>)}
          </div>}
      </DialogContent>
    </Dialog>;
}