import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const NotesSection = ({ orderId }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchNotes();
    }
  }, [orderId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('notes').getList(1, 50, {
        filter: `order_id = "${orderId}"`,
        sort: '-created',
        $autoCancel: false
      });
      setNotes(records.items);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSubmitting(true);
      const record = await pb.collection('notes').create({
        order_id: orderId,
        user_id: currentUser.id,
        user_role: currentUser.role,
        user_name: currentUser.name,
        note_content: newNote.trim(),
      }, { $autoCancel: false });
      
      setNotes([record, ...notes]);
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Notes & Feedback</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          placeholder="Add a note or feedback..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[100px] resize-none bg-background text-foreground"
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || !newNote.trim()}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Post Note
          </Button>
        </div>
      </form>

      <div className="space-y-4 mt-8">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No notes yet. Be the first to add one!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-card border rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{note.user_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                    {note.user_role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.created), 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.note_content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesSection;