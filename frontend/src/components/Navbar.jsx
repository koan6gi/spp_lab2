import React from 'react';
import { StickyNote } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3.5 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-800">
              Minimalist Notes
            </h1>
            <p className="text-xs text-gray-500">Fast & responsive note-taking</p>
          </div>
        </div>
      </div>
    </header>
  );
}
