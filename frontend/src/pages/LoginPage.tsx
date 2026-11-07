import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { FieldErrors } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const labelClass = 'mb-1.5';
const inputClass = 'm-0';
const passwordInputClass = 'm-0 pr-11';
const fieldErrorClass = 'mt-2 text-[0.8rem] font-medium text-[var(--danger)]';
const formErrorClass =
  'mb-4 rounded border-l-4 border-[var(--danger)] bg-[#fdf0ee] px-3 py-2.5 text-[0.9rem] text-[var(--danger)]';
const eyeBtnClass =
  'absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md bg-transparent p-0 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]';

// Eye icon: "off" shows the crossed-out eye
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update the field and clear its error while the user types
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  // Same rules and messages as the backend
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

    // 1. Check the form in the browser first
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 2. Then send it to the backend
    setFieldErrors({});
    setSubmitting(true);

    try {
      const user = await login(form);
      // Go back to the page the user wanted, or to their default page
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? (user.role === 'admin' ? '/dadmin/users' : '/chat'));
    } catch (err) {
      const fields = getFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form className="m-auto w-full max-w-[380px]" onSubmit={handleSubmit} noValidate>
        <h1 className="mb-1 text-[1.75rem]">Sign in</h1>
        <p className="mb-[18px] text-[var(--muted)]">Welcome back. Pick up where you left off.</p>

        {error && <p className={formErrorClass} role="alert">{error}</p>}

        {/* Email */}
        <div className="mb-3.5">
          <label className={labelClass} htmlFor="email">Email</label>
          <input className={inputClass} id="email" name="email" type="email" value={form.email}
                 onChange={handleChange} autoComplete="email" aria-invalid={!!fieldErrors.email} />
          {fieldErrors.email && <p className={fieldErrorClass} role="alert">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-3.5">
          <label className={labelClass} htmlFor="password">Password</label>
          <div className="relative">
            <input className={passwordInputClass} id="password" name="password"
                   type={showPassword ? 'text' : 'password'} value={form.password}
                   onChange={handleChange} autoComplete="current-password"
                   aria-invalid={!!fieldErrors.password} />
            <button type="button" className={eyeBtnClass} onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon off={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p className={fieldErrorClass} role="alert">{fieldErrors.password}</p>}
        </div>

        <button type="submit" className="mt-1 w-full p-3" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="mt-[22px] text-[var(--muted)]">
          New here? <Link className="font-semibold" to="/register">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}