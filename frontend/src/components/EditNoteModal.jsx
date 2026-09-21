import React, { useState, useEffect, useRef } from 'react';
import { X, ImagePlus, Trash2 } from 'lucide-react';

export default function EditNoteModal({ note, onClose, onSave, onError }) {
  const [title, setTitle] = useState(note.title || '');
  const [text, setText] = useState(note.text || '');
  const [removeImage, setRemoveImage] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewImageFile(file);
    setRemoveImage(false);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setRemoveImage(true);
    setNewImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      onError('Title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('text', text.trim());

      if (newImageFile) {
        formData.append('image', newImageFile);
      } else if (removeImage) {
        formData.append('remove_image', 'true');
      }

      await onSave(note.id, formData);
      onClose();
    } catch (err) {
      onError(err.message || 'Failed to update note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVisibleImage = (!removeImage && (previewUrl || note.image_url));
  const activeImageSrc = previewUrl || (note.image_url && !removeImage ? note.image_url : null);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Edit Note</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
            aria-label="Close edit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          {hasVisibleImage && activeImageSrc && (
            <div className="relative w-full max-h-72 bg-gray-100 border-b border-gray-100">
              <img
                src={activeImageSrc}
                alt="Note attachment"
                className="w-full h-full object-cover max-h-72"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Image</span>
              </button>
            </div>
          )}

          <div className="p-5 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Text
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Note content..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-y"
              />
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="edit-note-image"
              />
              <label
                htmlFor="edit-note-image"
                className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 cursor-pointer transition"
              >
                <ImagePlus className="w-4 h-4 text-gray-500" />
                <span>{hasVisibleImage ? 'Replace Image' : 'Add Image'}</span>
              </label>
            </div>
          </div>

          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
