import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, UserMinus, Heart, HeartOff, ArrowLeft } from 'lucide-react';
import { mockMovieList } from '../mockData';

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [followState, setFollowState] = useState(false);

  const token = localStorage.getItem('token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`/api/users/${id}`, {
          headers: authHeader,
        });

        setProfile(response.data.user);
        setFollowState(response.data.user.is_following);
      } catch (err) {
        const message = err.response?.data?.error || 'Unable to load profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, authHeader]);

  const likedMovieIds = useMemo(() => {
    if (!profile) return [];
    return profile.user_id % 2 === 0 ? [2, 3] : [1, 3];
  }, [profile]);

  const dislikedMovieIds = useMemo(() => {
    if (!profile) return [];
    return profile.user_id % 2 === 0 ? [1] : [2];
  }, [profile]);

  const likedMovies = useMemo(
    () => mockMovieList.filter((movie) => likedMovieIds.includes(movie.id)),
    [likedMovieIds]
  );

  const dislikedMovies = useMemo(
    () => mockMovieList.filter((movie) => dislikedMovieIds.includes(movie.id)),
    [dislikedMovieIds]
  );

  const handleFollowToggle = async () => {
    if (!token) {
      setError('Please log in to follow or unfollow users.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (followState) {
        await axios.delete(`/api/users/${id}/follow`, {
          headers: authHeader,
        });
        setFollowState(false);
        setProfile((prev) => prev && { ...prev, followers: prev.followers - 1 });
      } else {
        await axios.post(`/api/users/${id}/follow`, null, {
          headers: authHeader,
        });
        setFollowState(true);
        setProfile((prev) => prev && { ...prev, followers: prev.followers + 1 });
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to update follow state.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-200">
      <div className="flex flex-col gap-6 lg:gap-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-blue-600 uppercase tracking-[0.32em]">User Profile</p>
            <h1 className="text-4xl font-extrabold text-slate-900">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-gray-500 mt-2">@{profile.username}</p>
          </div>

          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors duration-200 ${
              followState
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {followState ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {followState ? 'Unfollow' : 'Follow'}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {profile.description || 'This user has not added a profile description yet.'}
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{profile.followers}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Followers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{profile.following}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Following</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{new Date(profile.created_at).toLocaleDateString()}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Joined</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-900">Community</h3>
              <p className="mt-2 text-sm text-slate-600">Follow this user to see their posts and movie reactions in your feed.</p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Profile Actions</h3>
              <div className="mt-4 space-y-3">
                <Link
                  to="/"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Browse movies
                </Link>
                <a
                  href="mailto:support@example.com"
                  className="block rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 hover:bg-blue-100"
                >
                  Ask for account help
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-slate-900">Liked Movies</h3>
            </div>

            {likedMovies.length > 0 ? (
              <div className="mt-5 space-y-4">
                {likedMovies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="block rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
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
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="block rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
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
