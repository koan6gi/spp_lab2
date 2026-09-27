import React from 'react';
import { StickyNote, Shield, Laptop, LogIn, LogOut, FileText, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAuth, onOpenSessions, onOpenAdmin }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3.5 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <StickyNote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-800">
              Minimalist Notes
            </h1>
            <p className="text-xs text-gray-500">RBAC • Secure Sessions • REST API</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
            title="Swagger API Documentation"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Swagger API</span>
          </a>

          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition"
            title="Mailpit Web UI (Password Reset Inbox)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mailpit</span>
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-700">{user?.email}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : user?.role === 'moderator'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition"
                  title="Admin User Management"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Users</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenSessions}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                title="Active Sessions & Devices"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sessions</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
