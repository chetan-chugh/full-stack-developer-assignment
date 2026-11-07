import { ChangeEvent, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

interface Props {
  mode: 'login' | 'register';
}

// One form for both login and registration pages.
export default function AuthForm({ mode }: Props) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = isRegister ? await register(form) : await login(form);
      navigate(user.role === 'admin' ? '/admin/users' : '/chat');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={handleSubmit}>
      <h1>{isRegister ? 'Create account' : 'Sign in'}</h1>
      {error && <p className="error">{error}</p>}

      {isRegister && (
        <label>Name
          <input name="name" value={form.name} onChange={handleChange} required minLength={2} />
        </label>
      )}
      <label>Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      <label>Password
        <input name="password" type="password" value={form.password} onChange={handleChange}
               required minLength={isRegister ? 8 : undefined} />
      </label>
      {isRegister && <small>Min 8 characters, with at least one letter and one number.</small>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
      </button>
      <p>
        {isRegister
          ? <>Already have an account? <Link to="/login">Login</Link></>
          : <>New here? <Link to="/register">Register</Link></>}
      </p>
    </form>
  );
}