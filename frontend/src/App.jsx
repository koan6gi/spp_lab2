import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NoteForm from './components/NoteForm';
import NoteCard from './components/NoteCard';
import EditNoteModal from './components/EditNoteModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ToastContainer from './components/ToastContainer';
import AuthModal from './components/AuthModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import SessionManagerModal from './components/SessionManagerModal';
import AdminUsersModal from './components/AdminUsersModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchNotes, createNote, updateNote, deleteNote } from './api/notesApi';
import { StickyNote, LogIn } from 'lucide-react';

function NotesApp() {
  const { user, isAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [resetToken, setResetToken] = useState(null);

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
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleRevoked = () => {
      addToast('Your session was revoked from another device. Please log in again.', 'error');
    };
    window.addEventListener('auth_session_revoked', handleRevoked);
    return () => window.removeEventListener('auth_session_revoked', handleRevoked);
  }, [addToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessionsModalOpen(false);
      setAdminModalOpen(false);
      setEditingNote(null);
      setDeletingNoteId(null);
    }
  }, [isAuthenticated]);

  const loadNotes = useCallback(async () => {
    if (!isAuthenticated) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotes();
      setNotes(data);
    } catch (err) {
      if (err.status !== 401) {
        addToast(err.message || 'Failed to load notes.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSessions={() => setSessionsModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {isAuthenticated ? (
          <>
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
                <p className="text-xs text-gray-400 mt-1">Notes you create will appear here</p>
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
          </>
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <StickyNote className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Minimalist Note Keeping</h2>
            <p className="text-sm text-gray-500">
              Sign in with your credentials to access your notes, or register for a new account.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Get Started / Sign In</span>
              </button>
            </div>
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
        onError={(msg) => addToast(msg, 'error')}
      />

      <ResetPasswordModal
        token={resetToken}
        onClose={() => setResetToken(null)}
        onSuccess={(msg) => {
          addToast(msg, 'success');
          setAuthModalOpen(true);
        }}
        onError={(msg) => addToast(msg, 'error')}
      />

      <SessionManagerModal
        isOpen={sessionsModalOpen}
        onClose={() => setSessionsModalOpen(false)}
        onSuccess={(msg) => addToast(msg, 'success')}
        onError={(msg) => addToast(msg, 'error')}
      />

      {user?.role === 'admin' && (
        <AdminUsersModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          onSuccess={(msg) => addToast(msg, 'success')}
          onError={(msg) => addToast(msg, 'error')}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotesApp />
    </AuthProvider>
  );
}
