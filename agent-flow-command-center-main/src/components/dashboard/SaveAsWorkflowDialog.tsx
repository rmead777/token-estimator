
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SaveAsWorkflowDialog({
  open,
  onClose,
  onSave,
  defaultName,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);

  return (
    <Dialog open={open} onOpenChange={val => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name your workflow</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Flow name"
          className="mb-2"
        />
        <DialogFooter>
          <Button onClick={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}>Save</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
