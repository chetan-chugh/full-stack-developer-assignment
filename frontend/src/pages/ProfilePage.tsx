import { ChangeEvent, FormEvent, useState } from 'react';
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
const inputClass = 'm-0';
const fieldErrorClass = 'mt-2 text-[0.8rem] font-medium text-[var(--danger)]';
const formErrorClass =
  'mb-4 rounded border-l-4 border-[var(--danger)] bg-[#fdf0ee] px-3 py-2.5 text-[0.9rem] text-[var(--danger)]';
const successClass =
  'mb-4 rounded border-l-4 border-[#2e9d57] bg-[#eaf6ee] px-3 py-2.5 text-[0.9rem] text-[#1d6b3a]';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');

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

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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

  /* ---------- Update password ---------- */
  const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<FieldErrors>({});
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

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
      <input
        className={inputClass}
        id={id}
        name={id}
        type="password"
        value={passwords[id]}
        onChange={handlePasswordChange}
        autoComplete={autoComplete}
        aria-invalid={!!passwordFieldErrors[id]}
      />
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
            <form onSubmit={handleProfileSubmit} noValidate>
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

              {!confirmingDelete ? (
                <button type="button"
                        className="bg-[var(--danger)] hover:bg-[#96281f]"
                        onClick={() => setConfirmingDelete(true)}>
                  Delete account
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[0.9rem] font-semibold">Are you sure?</span>
                  <button type="button"
                          className="bg-[var(--danger)] hover:bg-[#96281f]"
                          disabled={deleting}
                          onClick={handleDeleteAccount}>
                    {deleting ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                  <button type="button"
                          className="border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg)]"
                          disabled={deleting}
                          onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </button>
                </div>
              )}
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
    </div>
  );
}