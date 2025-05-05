import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompilerOutputPanelProps {
  open: boolean;
  onClose: () => void;
  content: string;
  title?: string;
}

export const CompilerOutputPanel: React.FC<CompilerOutputPanelProps> = ({
  open,
  onClose,
  content,
  title = '📘 Compiled Story Output'
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="prose prose-invert max-w-none text-white text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => {
            navigator.clipboard.writeText(content);
          }}>
            Copy to Clipboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
