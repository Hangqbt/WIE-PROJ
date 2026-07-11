import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, HeartOff, ArrowLeft, MessageSquareText, UserCheck, UserPlus } from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const currentUser = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/users/${id}`, {
          headers: authHeader,
        });

        if (!cancelled) {
          setProfile(response.data.user);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.error || 'Unable to load profile.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [id, authHeader]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-600">
        <p className="text-sm">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-600">
        <p className="font-semibold">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const likedMovies = profile.liked_movies || [];
  const dislikedMovies = profile.disliked_movies || [];
  const comments = profile.comments || [];
  const isOwnProfile = currentUser?.user_id === profile.user_id;

  const handleFollowToggle = async () => {
    if (!token) {
      setError('Please log in to follow people.');
      return;
    }

    setFollowBusy(true);
    setError(null);

    try {
      if (profile.is_following) {
        await axios.delete(`/api/users/${profile.user_id}/follow`, { headers: authHeader });
      } else {
        await axios.post(`/api/users/${profile.user_id}/follow`, null, { headers: authHeader });
      }

      setProfile((current) => ({
        ...current,
        is_following: !current.is_following,
        followers: current.followers + (current.is_following ? -1 : 1),
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to update this follow.');
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-200">
      <div className="flex flex-col gap-6 lg:gap-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-blue-600 uppercase tracking-[0.32em]">{isOwnProfile ? 'Your Movie Profile' : 'Movie Profile'}</p>
            <h1 className="text-4xl font-extrabold text-slate-900">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-gray-500 mt-2">@{profile.username}</p>
          </div>
          {!isOwnProfile && token ? (
            <button
              type="button"
              onClick={handleFollowToggle}
              disabled={followBusy}
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                profile.is_following
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {profile.is_following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {profile.is_following ? 'Following' : 'Follow'}
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Share the movies you loved, the ones you disliked, and your quick reactions here.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{profile.followers}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Followers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{new Date(profile.created_at).toLocaleDateString()}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Joined</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
            <div className="mt-4 space-y-3">
              <Link to="/" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                Browse movies
              </Link>
              <Link to="/users" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100">
                Discover people
              </Link>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquareText className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">{isOwnProfile ? 'Your Comments' : 'Comments'}</h3>
            </div>

            {comments.length > 0 ? (
              <div className="mt-5 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.post_id} className="rounded-3xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{comment.movie_title || 'Untitled movie'}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">“{comment.content}”</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No comments posted yet.</p>
            )}
          </section>

          <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-slate-900">Liked Movies</h3>
            </div>

            {likedMovies.length > 0 ? (
              <div className="mt-5 space-y-4">
                {likedMovies.map((movie) => (
                  <Link key={movie.movie_id} to={`/movie/${movie.movie_id}`} className="block rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50">
                    <p className="font-semibold text-slate-900">{movie.title}</p>
                    <p className="text-sm text-slate-600">{movie.director} • {movie.year}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No liked movies yet.</p>
            )}
          </section>

          <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <HeartOff className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-slate-900">Disliked Movies</h3>
            </div>

            {dislikedMovies.length > 0 ? (
              <div className="mt-5 space-y-4">
                {dislikedMovies.map((movie) => (
                  <Link key={movie.movie_id} to={`/movie/${movie.movie_id}`} className="block rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50">
                    <p className="font-semibold text-slate-900">{movie.title}</p>
                    <p className="text-sm text-slate-600">{movie.director} • {movie.year}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No disliked movies yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
