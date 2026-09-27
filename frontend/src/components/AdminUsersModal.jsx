import React, { useState, useEffect } from 'react';
import { X, Shield, Ban, CheckCircle, UserCheck } from 'lucide-react';
import { getUsers, updateUserRole, toggleBlockUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersModal({ isOpen, onClose, onSuccess, onError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      onError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)));
      onSuccess(`User role updated to ${newRole}.`);
    } catch (err) {
      onError(err.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async (userId) => {
    setActionLoading(true);
    try {
      const updated = await toggleBlockUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, is_blocked: updated.is_blocked } : u)));
      onSuccess(`User ${updated.is_blocked ? 'suspended' : 'unblocked'} successfully.`);
    } catch (err) {
      onError(err.message || 'Failed to toggle block status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-base">User Management & RBAC Roles</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading user list...</div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-center">Notes</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.email}</div>
                        <div className="text-xs text-gray-400">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={actionLoading || u.id === currentUser?.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                        {u.notes_count || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_blocked ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Blocked</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleBlock(u.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition border ${
                              u.is_blocked
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {u.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
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
