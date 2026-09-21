import React from 'react';
import { Trash2 } from 'lucide-react';

export default function NoteCard({ note, onEdit, onDeleteClick }) {
  const formattedDate = note.created_at
    ? new Date(note.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      onClick={() => onEdit(note)}
      className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between break-inside-avoid mb-4"
    >
      {note.image_url && (
        <div className="w-full max-h-64 overflow-hidden bg-gray-100">
          <img
            src={note.image_url}
            alt={note.title}
            className="w-full h-auto object-cover max-h-64 group-hover:scale-[1.01] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 flex-1">
        <h3 className="font-semibold text-gray-900 text-base mb-1.5 break-words">
          {note.title}
        </h3>
        {note.text && (
          <p className="text-gray-600 text-sm whitespace-pre-wrap break-words line-clamp-6">
            {note.text}
          </p>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>{formattedDate}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(note.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          title="Delete note"
          aria-label="Delete note"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
