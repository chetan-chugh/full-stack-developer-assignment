import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Update the field and clear its error while the user types
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  // Same rules and messages as the backend
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!form.name.trim()) errors.name = 'Name is required';
    else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email)) errors.email = 'A valid email is required';

    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }

    if (!form.confirmPassword) errors.confirmPassword = 'Confirm password is required';
    else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Password and confirm password do not match';
    }

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

    // 2. Then send it to the backend, which validates again
    setFieldErrors({});
    setSubmitting(true);

    try {
      await register(form);
      navigate('/chat');
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
        <h1 className="mb-1 text-[1.75rem]">Create account</h1>
        <p className="mb-[18px] text-[var(--muted)]">It takes less than a minute.</p>

        {error && <p className={formErrorClass} role="alert">{error}</p>}

        {/* Name */}
        <div className="mb-3.5">
          <label className={labelClass} htmlFor="name">Name</label>
          <input className={inputClass} id="name" name="name" value={form.name}
                 onChange={handleChange} autoComplete="name" aria-invalid={!!fieldErrors.name} />
          {fieldErrors.name && <p className={fieldErrorClass} role="alert">{fieldErrors.name}</p>}
        </div>

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
                   onChange={handleChange} autoComplete="new-password"
                   aria-invalid={!!fieldErrors.password} />
            <button type="button" className={eyeBtnClass} onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <EyeIcon off={showPassword} />
            </button>
          </div>
          {fieldErrors.password && <p className={fieldErrorClass} role="alert">{fieldErrors.password}</p>}
        </div>

        {/* Confirm password */}
        <div className="mb-3.5">
          <label className={labelClass} htmlFor="confirmPassword">Confirm password</label>
          <div className="relative">
            <input className={passwordInputClass} id="confirmPassword" name="confirmPassword"
                   type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                   onChange={handleChange} autoComplete="new-password"
                   aria-invalid={!!fieldErrors.confirmPassword} />
            <button type="button" className={eyeBtnClass} onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
              <EyeIcon off={showConfirm} />
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className={fieldErrorClass} role="alert">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <small className="-mt-1.5 mb-4 block text-[var(--muted)]">
          At least 8 characters, with one letter and one number.
        </small>

        <button type="submit" className="mt-1 w-full p-3" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="mt-[22px] text-[var(--muted)]">
          Already registered? <Link className="font-semibold" to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}