import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage, getFieldErrors } from '../services/api';
import type { FieldErrors } from '../types';

type Tab = 'profile' | 'password';

const tabClass = (active: boolean) =>
  `rounded-none border-b-2 bg-transparent px-1 pb-2.5 pt-0 text-[0.95rem] font-semibold hover:bg-transparent ${
    active
      ? 'border-[var(--accent)] text-[var(--text)]'
      : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
  }`;
const fieldClass = 'mb-4';
const labelClass = 'mb-1.5';
const inputClass = 'm-0 pr-11';
const fieldErrorClass = 'mt-2 text-[0.8rem] font-medium text-[var(--danger)]';
const eyeButtonClass =
  'absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md bg-transparent p-0 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]';
const formErrorClass =
  'mb-4 rounded border-l-4 border-[var(--danger)] bg-[#fdf0ee] px-3 py-2.5 text-[0.9rem] text-[var(--danger)]';
const successClass =
  'mb-4 rounded border-l-4 border-[#2e9d57] bg-[#eaf6ee] px-3 py-2.5 text-[0.9rem] text-[#1d6b3a]';

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [confirmation, setConfirmation] = useState<'save' | 'delete' | null>(null);

  /* ---------- User profile ---------- */
  const [name, setName] = useState(user?.name ?? '');
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({});
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setProfileFieldErrors({});
    setProfileSuccess('');
  };

  const handleProfileSave = async () => {
    setProfileError('');
    setProfileSuccess('');
    setProfileFieldErrors({});
    setProfileSaving(true);
    try {
      const data = await api.updateProfile({ name });
      updateUser(data.user);
      setProfileSuccess('Profile updated successfully');
    } catch (err) {
      const fields = getFieldErrors(err);
      setProfileFieldErrors(fields);
      if (Object.keys(fields).length === 0) setProfileError(getErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  };

  /* ---------- Delete account ---------- */
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await api.deleteAccount();
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const handleConfirmation = async () => {
    const action = confirmation;
    setConfirmation(null);
    if (action === 'save') await handleProfileSave();
    if (action === 'delete') await handleDeleteAccount();
  };

  useEffect(() => {
    if (!confirmation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !profileSaving && !deleting) setConfirmation(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmation, deleting, profileSaving]);

  /* ---------- Update password ---------- */
  const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors>({});
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name: field, value } = e.target;
    setPasswords({ ...passwords, [field]: value });
    setPasswordFieldErrors({ ...passwordFieldErrors, [field]: '' });
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordFieldErrors({});
    setPasswordSaving(true);
    try {
      await api.changePassword(passwords);
      setPasswords(emptyPasswords);
      setPasswordSuccess('Password updated successfully');
    } catch (err) {
      const fields = getFieldErrors(err);
      setPasswordFieldErrors(fields);
      if (Object.keys(fields).length === 0) setPasswordError(getErrorMessage(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  const passwordField = (
    id: 'currentPassword' | 'newPassword' | 'confirmPassword',
    label: string,
    autoComplete: string,
  ) => (
    <div className={fieldClass}>
      <label className={labelClass} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          className={inputClass}
          id={id}
          name={id}
          type={visiblePasswords[id] ? 'text' : 'password'}
          value={passwords[id]}
          onChange={handlePasswordChange}
          autoComplete={autoComplete}
          aria-invalid={!!passwordFieldErrors[id]}
        />
        <button
          type="button"
          className={eyeButtonClass}
          onClick={() => setVisiblePasswords((visible) => ({ ...visible, [id]: !visible[id] }))}
          aria-label={`${visiblePasswords[id] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
        >
          <EyeIcon off={!!visiblePasswords[id]} />
        </button>
      </div>
      {passwordFieldErrors[id] && (
        <p className={fieldErrorClass} role="alert">{passwordFieldErrors[id]}</p>
      )}
    </div>
  );

  return (
    <div className="p-[var(--gap)]">
      <div className="card max-w-[640px]">
        <h1 className="mb-4 text-xl">Profile</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-6 border-b border-[var(--border)]" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'profile'}
                  className={tabClass(tab === 'profile')} onClick={() => setTab('profile')}>
            User Profile
          </button>
          <button type="button" role="tab" aria-selected={tab === 'password'}
                  className={tabClass(tab === 'password')} onClick={() => setTab('password')}>
            Update Password
          </button>
        </div>

        {tab === 'profile' && (
          <>
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setConfirmation('save');
              }}
              noValidate
            >
              {profileError && <p className={formErrorClass} role="alert">{profileError}</p>}
              {profileSuccess && <p className={successClass} role="status">{profileSuccess}</p>}

              <div className={fieldClass}>
                <label className={labelClass} htmlFor="name">Username</label>
                <input className={inputClass} id="name" name="name" value={name}
                       onChange={handleNameChange} autoComplete="name"
                       aria-invalid={!!profileFieldErrors.name} />
                {profileFieldErrors.name && (
                  <p className={fieldErrorClass} role="alert">{profileFieldErrors.name}</p>
                )}
              </div>

              <div className={fieldClass}>
                <label className={labelClass} htmlFor="email">Email</label>
                <input className={inputClass} id="email" value={user?.email ?? ''} disabled />
                <small className="mt-1.5 mb-0">Your email cannot be changed.</small>
              </div>

              <button type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save changes'}
              </button>
            </form>

            {/* Delete account */}
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <h2 className="mb-1 text-base text-[var(--danger)]">Delete account</h2>
              <p className="mb-4 text-[0.9rem] text-[var(--muted)]">
                Your account will be deactivated and you will be signed out.
              </p>

              {deleteError && <p className={formErrorClass} role="alert">{deleteError}</p>}

              <button
                type="button"
                className="bg-[var(--danger)] hover:bg-[#96281f]"
                disabled={deleting}
                onClick={() => {
                  setDeleteError('');
                  setConfirmation('delete');
                }}
              >
                {deleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} noValidate>
            {passwordError && <p className={formErrorClass} role="alert">{passwordError}</p>}
            {passwordSuccess && <p className={successClass} role="status">{passwordSuccess}</p>}

            {passwordField('currentPassword', 'Current password', 'current-password')}
            {passwordField('newPassword', 'New password', 'new-password')}
            {passwordField('confirmPassword', 'Confirm password', 'new-password')}

            <button type="submit" disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>

      {confirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e3b43]/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmation(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-confirmation-title"
            className="w-full max-w-[400px] rounded-xl border border-[var(--border)] bg-white p-6 text-[var(--text)] shadow-xl"
          >
            <h2 id="profile-confirmation-title" className="mb-2 text-[1.15rem]">
              {confirmation === 'save' ? 'Save changes?' : 'Delete account?'}
            </h2>
            <p className="mb-5 text-[0.9rem] text-[var(--muted)]">
              {confirmation === 'save'
                ? 'Do you want to save your profile changes?'
                : 'Your account will be deactivated and you will be signed out. This action cannot be undone here.'}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" autoFocus onClick={() => setConfirmation(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={confirmation === 'delete' ? 'btn-danger' : ''}
                onClick={handleConfirmation}
              >
                {confirmation === 'save' ? 'Save changes' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}