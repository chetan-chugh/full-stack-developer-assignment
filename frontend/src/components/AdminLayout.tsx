import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 py-2.5 no-underline ${
    isActive
      ? 'border-[var(--accent)] text-white'
      : 'border-transparent text-[#a9c4c7] hover:text-white'
  }`;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Close the dialog with the Escape key
  useEffect(() => {
    if (!confirmOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [confirmOpen]);

  // Runs only after the admin confirms
  const handleLogout = () => {
    setConfirmOpen(false);
    logout();
    navigate('/dadmin');
  };

  return (
    <>
      <header className="bg-[var(--ink)] text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5 font-bold">
              <span className="brand-mark" />
              Admin Panel
            </div>
            <div className="flex items-center gap-3 text-[0.9rem]">
              <span>{user?.name}</span>
              <button type="button" onClick={() => setConfirmOpen(true)}
                      className="rounded-lg border border-white/35 bg-transparent px-3 py-1.5 text-[0.85rem] text-white hover:bg-white/10">
                Logout
              </button>
            </div>
          </div>

          <nav className="flex gap-6 border-t border-white/[0.18]">
            <NavLink to="/dadmin/users" className={linkClass}>Users</NavLink>
            <NavLink to="/dadmin/logs" className={linkClass}>Usage Logs</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-7">
        <Outlet />
      </main>

      {/* Logout confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e3b43]/50 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-[400px] rounded-xl border border-[var(--border)] bg-white p-6 text-[var(--text)] shadow-xl"
          >
            <h2 id="logout-title" className="mb-2 text-[1.15rem]">Log out?</h2>
            <p className="mb-5 text-[0.9rem] text-[var(--muted)]">
              You will need to sign in again to continue.
            </p>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" autoFocus onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}