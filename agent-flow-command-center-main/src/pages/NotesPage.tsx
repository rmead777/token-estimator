
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Type guard to check if data from Supabase matches our Note interface
function isNote(item: any): item is Note {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'content' in item &&
    'created_at' in item
  );
}

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript's type checking
      const { data, error } = await (supabase as any)
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        toast({ title: "Error loading notes", description: error.message, variant: "destructive" });
      } else if (Array.isArray(data)) {
        // Validate that each item in data conforms to our Note interface
        const validNotes = data.filter(isNote);
        setNotes(validNotes);
      }
    } catch (error: any) {
      toast({ title: "Error loading notes", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript's type checking
      const { error } = await (supabase as any)
        .from("notes")
        .insert([{ title, content }]);
      
      if (error) {
        toast({ title: "Error adding note", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Note added" });
        setTitle("");
        setContent("");
        fetchNotes();
      }
    } catch (error: any) {
      toast({ title: "Error adding note", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Notes</h1>
      <form
        onSubmit={handleAddNote}
        className="mb-8 bg-white dark:bg-gray-900 rounded-lg p-4 shadow flex flex-col gap-2"
      >
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <Textarea
          placeholder="Content (optional)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Note"}
        </Button>
      </form>
      <div className="space-y-4">
        {notes.length === 0 && (
          <div className="text-gray-500 text-center">No notes yet. Add one!</div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="font-semibold text-xl">{note.title}</div>
            {note.content && <div className="mt-2 text-gray-700 dark:text-gray-300">{note.content}</div>}
            <div className="mt-2 text-xs text-gray-400">
              Created: {new Date(note.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesPage;
