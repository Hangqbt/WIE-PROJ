import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      navigate(`/users/${user.user_id}`, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const path = mode === 'login' ? '/api/users/login' : '/api/users/register';
    const payload = mode === 'login'
      ? { username, password }
      : { username, password, display_name: displayName };

    try {
      const response = await axios.post(path, payload);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuthSuccess(user, token);
      navigate(`/users/${user.user_id}`);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Unable to authenticate.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-gray-200 mt-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">{mode === 'login' ? 'Login' : 'Register'}</h1>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {mode === 'login' ? 'Create a new account' : 'Already have an account?'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Enter a username"
            required
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="How others will see you"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Enter a password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Want to browse without logging in? <Link to="/" className="text-blue-600 hover:underline">Go back to search</Link>.
      </p>
    </div>
  );
};

export default Login;
