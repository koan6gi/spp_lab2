import React, { useState, useRef } from 'react';
import { ImagePlus, X, Plus } from 'lucide-react';

export default function NoteForm({ onNoteCreated, onError }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      onError('File size exceeds the 20 MB limit.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedImage = () => {
    setImageFile(null);
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
      let payload;
      if (imageFile) {
        payload = new FormData();
        payload.append('title', title.trim());
        if (text.trim()) payload.append('text', text.trim());
        payload.append('image', imageFile);
      } else {
        payload = {
          title: title.trim(),
          text: text.trim() ? text.trim() : null,
        };
      }

      await onNoteCreated(payload);

      setTitle('');
      setText('');
      removeSelectedImage();
    } catch (err) {
      onError(err.message || 'Failed to create note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden focus-within:shadow-md transition duration-200"
      >
        {previewUrl && (
          <div className="relative w-full max-h-72 bg-gray-100 overflow-hidden border-b border-gray-100">
            <img
              src={previewUrl}
              alt="Selected preview"
              className="w-full h-full object-cover max-h-72"
            />
            <button
              type="button"
              onClick={removeSelectedImage}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-medium text-lg text-gray-900 placeholder-gray-400 focus:outline-none"
          />

          <textarea
            placeholder="Take a note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none resize-none"
          />
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="create-note-image"
            />
            <label
              htmlFor="create-note-image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-200 cursor-pointer transition"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{imageFile ? 'Change image' : 'Add image'}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Add Note'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
