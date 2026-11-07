import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkBase = 'rounded-lg px-3 py-2.5 no-underline';
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${
    isActive
      ? 'bg-white/[0.12] text-white shadow-[inset_3px_0_0_var(--accent)]'
      : 'text-[#a9c4c7] hover:bg-white/10 hover:text-white'
  }`;

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  'aria-hidden': true,
};

function MenuIcon() {
  return (
    <svg {...iconProps}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

const iconBtnClass =
  'size-10 flex-none items-center justify-center rounded-lg bg-transparent p-0 text-white hover:bg-white/10';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the logout dialog first, otherwise the mobile menu
  useEffect(() => {
    if (!confirmOpen && !menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmOpen) setConfirmOpen(false);
      else setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [confirmOpen, menuOpen]);

  // Stop the page behind the open menu from scrolling
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // If the window grows to desktop size, close the mobile menu
  useEffect(() => {
    const query = window.matchMedia('(min-width: 861px)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  if (!user) return null;

  // Runs only after the user confirms
  const handleLogout = () => {
    setConfirmOpen(false);
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile top bar: logo and menu button only */}
      <header className="sticky top-0 z-20 hidden items-center justify-between bg-[var(--ink)] px-4 py-2.5 text-white max-[860px]:flex">
        <Link to="/chat" className="flex items-center gap-2.5 font-bold text-white no-underline">
          <span className="brand-mark" />
          Assignment App
        </Link>
        <button
          type="button"
          className={`${iconBtnClass} flex`}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Dark background behind the open mobile menu */}
      <div
  className={`fixed inset-0 z-30 hidden bg-[#0e3b43]/50 transition-opacity duration-300 ease-in-out max-[860px]:block ${
    menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
  }`}
  onClick={() => setMenuOpen(false)}
  aria-hidden="true"
/>

      {/* Sidebar on desktop, sliding drawer on mobile */}
    <aside
  id="app-sidebar"
  className={`fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] flex-col bg-[var(--ink)] px-3 py-4 text-white transition-[transform,visibility,box-shadow] duration-300 ease-in-out max-[860px]:w-[280px] max-[860px]:max-w-[85vw] ${
    menuOpen
      ? 'max-[860px]:visible max-[860px]:[transform:translateX(0)] max-[860px]:shadow-2xl'
      : 'max-[860px]:invisible max-[860px]:[transform:translateX(-100%)]'
  }`}

      >
        <div className="mb-3 flex items-center justify-between border-b border-white/[0.18] pb-4 pl-2.5 pt-2">
          <Link
            to="/chat"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 text-[1.05rem] font-bold text-white no-underline"
          >
            <span className="brand-mark" />
            Assignment App
          </Link>
          <button
            type="button"
            className={`${iconBtnClass} hidden max-[860px]:flex`}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* A click on any link or button here closes the mobile menu */}
        <nav className="flex flex-col gap-1" onClick={() => setMenuOpen(false)}>
          <NavLink to="/chat" className={linkClass}>Chatbot</NavLink>
          {user.role === 'admin' && (
            <>
              <NavLink to="/dadmin/users" className={linkClass}>Users</NavLink>
              <NavLink to="/dadmin/logs" className={linkClass}>Usage Logs</NavLink>
            </>
          )}
          <NavLink to="/profile" className={linkClass}>Profile</NavLink>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="w-full rounded-lg bg-transparent px-3 py-2.5 text-left font-normal text-[#ff9d94] hover:bg-white/10 hover:text-[#ffb8b1]"
          >
            Logout
          </button>
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-white/[0.18] px-2.5 pb-1 pt-3">
          <span className="flex size-9 flex-none items-center justify-center rounded-full bg-[var(--accent)] font-semibold text-[#2a1f00]">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <strong className="truncate">{user.name}</strong>
        </div>
      </aside>

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