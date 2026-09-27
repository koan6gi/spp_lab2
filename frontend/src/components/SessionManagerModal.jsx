import React, { useState, useEffect } from 'react';
import { X, Laptop, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';
import { getSessions, revokeSession, revokeOtherSessions } from '../api/authApi';

export default function SessionManagerModal({ isOpen, onClose, onSuccess, onError }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      onError(err.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleRevokeOne = async (id) => {
    setActionLoading(true);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onSuccess('Session revoked successfully.');
    } catch (err) {
      onError(err.message || 'Failed to revoke session.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeOthers = async () => {
    setActionLoading(true);
    try {
      const current = sessions.find((s) => s.isCurrent);
      await revokeOtherSessions(current ? current.id : null);
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      onSuccess('All other sessions revoked successfully.');
    } catch (err) {
      onError(err.message || 'Failed to revoke other sessions.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800">
            <Laptop className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-base">Active Devices & Sessions</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <p className="text-xs text-gray-500">
            Control which devices and browsers have active access to your account. You can disconnect unknown or inactive sessions at any time.
          </p>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No active sessions found.</div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600 mt-1">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 break-all">
                          {session.user_agent || 'Unknown Browser'}
                        </span>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Current
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 space-x-2">
                        <span>IP: {session.ip_address || 'Unknown'}</span>
                        <span>•</span>
                        <span>Last active: {session.last_active_at ? new Date(session.last_active_at).toLocaleString() : 'Just now'}</span>
                        {session.created_at && (
                          <>
                            <span>•</span>
                            <span>Started: {new Date(session.created_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleRevokeOne(session.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            disabled={actionLoading || sessions.length <= 1}
            onClick={handleRevokeOthers}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out All Other Devices</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
