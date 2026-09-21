import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import EditNoteModal from './components/EditNoteModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastContainer from './components/ToastContainer';
import { fetchNotes, createNote, updateNote, deleteNote } from './api/notesApi';
import { StickyNote } from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await fetchNotes();
        setNotes(data);
      } catch (err) {
        addToast(err.message || 'Failed to load notes.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, [addToast]);

  const handleCreateNote = async (payload) => {
    const newNote = await createNote(payload);
    setNotes((prev) => [newNote, ...prev]);
    addToast('Note created successfully.', 'success');
  };

  const handleSaveEditedNote = async (id, payload) => {
    const updated = await updateNote(id, payload);
    setNotes((prev) => prev.map((note) => (note.id === updated.id ? updated : note)));
    addToast('Note saved successfully.', 'success');
  };

  const handleConfirmDelete = async () => {
    if (!deletingNoteId) return;

    setIsDeleting(true);
    try {
      await deleteNote(deletingNoteId);
      setNotes((prev) => prev.filter((note) => note.id !== deletingNoteId));
      addToast('Note deleted successfully.', 'success');
      setDeletingNoteId(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete note.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <NoteForm
          onNoteCreated={handleCreateNote}
          onError={(msg) => addToast(msg, 'error')}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <StickyNote className="w-12 h-12 stroke-1 mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-500">No notes yet</p>
            <p className="text-xs text-gray-400 mt-1">Notes you add will appear here</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(n) => setEditingNote(n)}
                onDeleteClick={(id) => setDeletingNoteId(id)}
              />
            ))}
          </div>
        )}
      </main>

      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onSave={handleSaveEditedNote}
          onError={(msg) => addToast(msg, 'error')}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deletingNoteId)}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
