import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Heart, MessageSquareText, Search, UserCheck, UserPlus } from 'lucide-react';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const token = localStorage.getItem('token');
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const fetchUsers = async (search = query) => {
    setLoading(true);
    setFeedback('');

    try {
      const response = await axios.get('/api/users', {
        params: search.trim() ? { search: search.trim() } : {},
        headers: authHeader,
      });
      setUsers(response.data.users || []);
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Unable to load people right now.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers('');
  }, [authHeader]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchUsers(query);
  };

  const handleFollowToggle = async (user) => {
    if (!token) {
      setFeedback('Please log in to follow other users.');
      return;
    }

    setBusyId(user.user_id);
    setFeedback('');

    try {
      if (user.is_following) {
        await axios.delete(`/api/users/${user.user_id}/follow`, { headers: authHeader });
      } else {
        await axios.post(`/api/users/${user.user_id}/follow`, null, { headers: authHeader });
      }

      setUsers((current) => current.map((item) => (
        item.user_id === user.user_id
          ? {
              ...item,
              is_following: !item.is_following,
              followers: item.followers + (item.is_following ? -1 : 1),
            }
          : item
      )));
    } catch (err) {
      setFeedback(err.response?.data?.error || 'Unable to update this follow.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-600">Discover people</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Find users with similar movie taste</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Browse real profiles, compare liked movies, read recent comments, and follow people whose taste overlaps with yours.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {token ? 'Sorted by shared liked movies first.' : 'Log in to see similarity and follow people.'}
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="user-search">
          Search by username or name
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="user-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try 'nolan', 'sci-fi' or 'ava'"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none ring-0 focus:border-blue-400"
            />
          </div>
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </form>

      {feedback ? <p className="mt-4 text-sm text-slate-600">{feedback}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-slate-600">Loading people...</p>
      ) : users.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {users.map((user) => (
            <article key={user.user_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{user.display_name || user.username}</h2>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>

                {token ? (
                  <button
                    type="button"
                    onClick={() => handleFollowToggle(user)}
                    disabled={busyId === user.user_id}
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      user.is_following
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {user.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {user.is_following ? 'Following' : 'Follow'}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{user.followers} followers</span>
                <span>{user.comment_count} comments</span>
                {token ? <span>{user.shared_movie_count} shared liked movies</span> : null}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Liked movies
                </div>
                {user.liked_movies.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {user.liked_movies.map((movie) => (
                      <Link key={movie.movie_id} to={`/movie/${movie.movie_id}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100">
                        {movie.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No liked movies yet.</p>
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MessageSquareText className="h-4 w-4 text-blue-500" />
                  Recent comments
                </div>
                {user.comments.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {user.comments.map((comment) => (
                      <div key={comment.post_id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold text-slate-500">{comment.movie_title || 'Untitled movie'}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No comments yet.</p>
                )}
              </div>

              <Link
                to={`/users/${user.user_id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
              >
                View full profile <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          No users match that search yet.
        </div>
      )}
    </div>
  );
};

export default UserSearch;
