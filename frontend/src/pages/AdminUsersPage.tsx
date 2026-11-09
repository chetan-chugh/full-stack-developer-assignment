// src/pages/AdminUsersPage.tsx
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage } from '../services/api';
import type { Role, User } from '../types';

// The action waiting for the admin's confirmation
type Action =
  | { kind: 'rename'; user: User }
  | { kind: 'role'; user: User; role: Role }
  | { kind: 'status'; user: User }
  | { kind: 'delete'; user: User };

// Title, message and button text for each kind of action
function describe(action: Action) {
  const { user } = action;

  switch (action.kind) {
    case 'rename':
      return {
        title: 'Edit name',
        message: `Enter a new name for ${user.email}.`,
        confirmLabel: 'Save changes',
        danger: false,
      };
    case 'role':
      return {
        title: 'Change role',
        message: `Change ${user.email} from ${user.role} to ${action.role}?`,
        confirmLabel: 'Change role',
        danger: false,
      };
    case 'status':
      return user.isActive
        ? {
            title: 'Deactivate account',
            message: `${user.email} will no longer be able to sign in until you activate the account again.`,
            confirmLabel: 'Deactivate',
            danger: true,
          }
        : {
            title: 'Activate account',
            message: `${user.email} will be able to sign in again.`,
            confirmLabel: 'Activate',
            danger: false,
          };
    case 'delete':
      return {
        title: 'Delete user',
        message: `Permanently delete ${user.email}? This cannot be undone.`,
        confirmLabel: 'Delete user',
        danger: true,
      };
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [action, setAction] = useState<Action | null>(null);
  const [name, setName] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((data) => setUsers(data.users))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const closeDialog = () => {
    if (busy) return;
    setAction(null);
    setDialogError('');
  };

  // Close the dialog with the Escape key
  useEffect(() => {
    if (!action) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        setAction(null);
        setDialogError('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [action, busy]);

  const openDialog = (next: Action) => {
    setDialogError('');
    if (next.kind === 'rename') setName(next.user.name);
    setAction(next);
  };

  // Runs when the admin confirms
  const handleConfirm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!action) return;
    setDialogError('');

    if (action.kind === 'rename' && name.trim().length < 2) {
      setDialogError('Name must be at least 2 characters');
      return;
    }

    const id = action.user._id;
    setBusy(true);
    try {
      if (action.kind === 'delete') {
        await api.deleteUser(id);
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        const changes =
          action.kind === 'rename'
            ? { name }
            : action.kind === 'role'
              ? { role: action.role }
              : { isActive: !action.user.isActive };
        const { user } = await api.updateUser(id, changes);
        setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
      }
      setAction(null);
    } catch (err) {
      // The message comes from the backend and stays inside the dialog
      setDialogError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const dialog = action ? describe(action) : null;

  return (
    <div className="card">
      <h1>User Management</h1>
      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody aria-busy={loading}>
            {loading
              ? Array.from({ length: 5 }, (_, index) => (
                  <tr key={`skeleton-${index}`} aria-hidden="true">
                    <td><span className="block h-4 w-24 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-40 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-9 w-20 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-16 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-4 w-20 animate-pulse rounded bg-[var(--border)]" /></td>
                    <td><span className="block h-8 w-40 animate-pulse rounded bg-[var(--border)]" /></td>
                  </tr>
                ))
              : users.map((u) => {
              const isSelf = u._id === currentUser?._id;
              return (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {/* Stays on the saved role until the admin confirms the change */}
                    <select value={u.role} disabled={isSelf}
                            onChange={(e) => openDialog({ kind: 'role', user: u, role: e.target.value as Role })}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-secondary" onClick={() => openDialog({ kind: 'rename', user: u })}>
                        Edit name
                      </button>
                      <button className="btn-secondary" disabled={isSelf}
                              onClick={() => openDialog({ kind: 'status', user: u })}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-danger" disabled={isSelf}
                              onClick={() => openDialog({ kind: 'delete', user: u })}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && !error && users.length === 0 && (
              <tr><td colSpan={6} className="text-center text-[var(--muted)]">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation dialog */}
      {action && dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e3b43]/50 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <form
            onSubmit={handleConfirm}
            noValidate
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="w-full max-w-[420px] rounded-xl border border-[var(--border)] bg-white p-6 shadow-xl"
          >
            <h2 id="dialog-title" className="mb-2 text-[1.15rem]">{dialog.title}</h2>
            <p className="mb-4 text-[0.9rem] text-[var(--muted)]">{dialog.message}</p>

            {action.kind === 'rename' && (
              <div className="mb-4">
                <label htmlFor="rename-input" className="mb-1.5">Name</label>
                <input id="rename-input" className="m-0" value={name} autoFocus
                       onChange={(e) => { setName(e.target.value); setDialogError(''); }}
                       aria-invalid={!!dialogError} />
              </div>
            )}

            {dialogError && <p className="field-error mb-3" role="alert">{dialogError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={closeDialog}
                      disabled={busy} autoFocus={action.kind !== 'rename'}>
                Cancel
              </button>
              <button type="submit" className={dialog.danger ? 'btn-danger' : ''} disabled={busy}>
                {busy ? 'Please wait...' : dialog.confirmLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}