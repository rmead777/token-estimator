import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface OutlineViewerPanelProps {
  open: boolean;
  onClose: () => void;
  outline: { title: string; summary: string }[];
}

export const OutlineViewerPanel: React.FC<OutlineViewerPanelProps> = ({
  open,
  onClose,
  outline
}) => {
  const markdown = outline.map((entry, i) => `### Chapter ${i + 1}: ${entry.title}\n\n${entry.summary}`).join('\n\n');

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>🧭 Full Outline</DialogTitle>
        </DialogHeader>
        <div className="prose prose-invert text-white text-sm">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
};
