import { ChangeEvent, FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { FieldErrors } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldErrorClass = 'mt-2 text-[0.8rem] font-medium text-[var(--danger)]';

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

export default function AdminLoginPage() {
  const { user, loading, adminLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already signed in as an admin: go straight to the admin area
  if (!loading && user?.role === 'admin') return <Navigate to="/dadmin/users" replace />;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email)) errors.email = 'A valid email is required';
    if (!form.password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await adminLogin(form);
      navigate('/dadmin/users');
    } catch (err) {
      const fields = getFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[400px] rounded-xl border border-[var(--border)] bg-white p-8"
      >
        <div className="mb-6 flex items-center gap-2.5 font-bold text-[var(--ink)]">
          <span className="brand-mark" />
          Admin Panel
        </div>

        <h1 className="mb-1 text-[1.5rem]">Admin sign in</h1>
        <p className="mb-5 text-[0.9rem] text-[var(--muted)]">For administrators only.</p>

        {error && (
          <p className="mb-4 rounded border-l-4 border-[var(--danger)] bg-[#fdf0ee] px-3 py-2.5 text-[0.9rem] text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}

        <div className="mb-3.5">
          <label className="mb-1.5" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="m-0" value={form.email}
                 onChange={handleChange} autoComplete="username" aria-invalid={!!fieldErrors.email} />
          {fieldErrors.email && <p className={fieldErrorClass} role="alert">{fieldErrors.email}</p>}
        </div>

        <div className="mb-4">
          <label className="mb-1.5" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" name="password" className="m-0 pr-11"
                   type={showPassword ? 'text' : 'password'} value={form.password}
                   onChange={handleChange} autoComplete="current-password"
                   aria-invalid={!!fieldErrors.password} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md bg-transparent p-0 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon off={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p className={fieldErrorClass} role="alert">{fieldErrors.password}</p>}
        </div>

        <button type="submit" className="w-full p-3" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}