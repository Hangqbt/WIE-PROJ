import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import MovieSearch from './components/MovieSearch';
import MovieDetail from './components/MovieDetail';
import UserProfile from './components/UserProfile';
import UserSearch from './components/UserSearch';
import Login from './components/Login';

const TopNav = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const profileUrl = user ? `/users/${user.user_id}` : '/login';

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-3">
      <Link to="/" className="text-blue-500 underline">Search Page</Link>
      <Link to="/users" className="text-blue-500 underline">Discover People</Link>
      <Link to={profileUrl} className="text-blue-500 underline">{user ? 'My Profile' : 'Login'}</Link>
      {user ? (
        <>
          <span className="text-sm text-slate-600">Signed in as {user.display_name || user.username}</span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              onLogout();
              navigate('/');
            }}
            className="text-blue-500 underline"
          >
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" className="text-blue-500 underline">Login / Register</Link>
      )}
    </nav>
  );
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleAuthSuccess = (profile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="p-4 bg-gray-100 min-h-screen">
        <TopNav user={user} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={<MovieSearch />} />
          <Route path="/users" element={<UserSearch />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route
            path="/login"
            element={user ? <Navigate to={`/users/${user.user_id}`} replace /> : <Login onAuthSuccess={handleAuthSuccess} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
