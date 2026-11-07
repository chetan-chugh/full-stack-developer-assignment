import { ChangeEvent, FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import type { FieldErrors } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldErrorClass = 'mt-2 text-[0.8rem] font-medium text-[var(--danger)]';

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
            <input id="password" name="password" className="m-0 pr-16"
                   type={showPassword ? 'text' : 'password'} value={form.password}
                   onChange={handleChange} autoComplete="current-password"
                   aria-invalid={!!fieldErrors.password} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-transparent px-2 py-1 text-[0.8rem] font-medium text-[var(--primary)] hover:bg-[var(--bg)]">
              {showPassword ? 'Hide' : 'Show'}
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