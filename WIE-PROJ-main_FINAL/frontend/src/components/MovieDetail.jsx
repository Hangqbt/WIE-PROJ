import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-react';

const MovieDetail = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [reaction, setReaction] = useState('upvote');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem('token');

  const currentUser = useMemo(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  }, []);

  const hasReviewed = existingReview !== null;

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/movies/${id}`);
        const movieData = response.data.movie;
        setMovie(movieData);

        if (currentUser && movieData.reviews) {
          const mine = movieData.reviews.find((r) => r.username === currentUser.username);
          if (mine) {
            setExistingReview(mine);
            setComment(mine.content);
            setReaction(mine.reaction === 'upvote' ? 'upvote' : 'downvote');
            setIsEditing(false);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load this movie.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, currentUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('Please log in to add a review.');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter a short comment before posting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isEditing && existingReview) {
        const response = await axios.put(`/api/posts/${existingReview.post_id}`, {
          content: comment.trim(),
          reaction,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const updated = response.data.post;
        setExistingReview(updated);
        setMovie((current) => current ? {
          ...current,
          reviews: (current.reviews || []).map((r) =>
            r.post_id === updated.post_id ? updated : r
          ),
        } : current);
        setIsEditing(false);
      } else {
        const response = await axios.post('/api/posts', {
          movie_id: Number(id),
          content: comment.trim(),
          reaction,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const created = response.data.post;
        setExistingReview(created);
        setMovie((current) => current ? { ...current, reviews: [created, ...(current.reviews || [])] } : current);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (existingReview) {
      setComment(existingReview.content);
      setReaction(existingReview.reaction === 'upvote' ? 'upvote' : 'downvote');
      setIsEditing(true);
    }
  };

  const handleDelete = async (review) => {
    if (!token) return;
    if (!window.confirm('Delete your review? This cannot be undone.')) return;

    setDeleting(true);
    setError('');

    try {
      await axios.delete(`/api/posts/${review.post_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMovie((current) => current ? {
        ...current,
        reviews: (current.reviews || []).filter((r) => r.post_id !== review.post_id),
      } : current);

      if (existingReview && existingReview.post_id === review.post_id) {
        setExistingReview(null);
        setComment('');
        setReaction('upvote');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete your review.');
    } finally {
      setDeleting(false);
    }
  };

  const formDisabled = !token || (hasReviewed && !isEditing);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-gray-600">Loading movie...</div>;
  }

  if (error || !movie) {
    return <div className="max-w-4xl mx-auto p-6 text-red-600">{error || 'Movie not found.'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 bg-white shadow-xl rounded-2xl mt-12 border border-gray-100">
      <div className="md:flex md:gap-10">
        <div className="md:w-1/3 flex-shrink-0 mb-6 md:mb-0">
          <img
            src={movie.poster_url || 'https://via.placeholder.com/300x450'}
            alt={`Poster for ${movie.title}`}
            className="w-full h-auto rounded-lg shadow-md border-2 border-gray-200"
          />
        </div>

        <div className="md:w-2/3 space-y-4 text-gray-700">
          <h1 className="text-3xl font-extrabold text-gray-900">{movie.title}</h1>
          <p className="text-base font-medium text-gray-600">{movie.director} / {movie.year}</p>
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Summary</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{movie.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {isEditing ? 'Edit your review' : hasReviewed ? 'Your review' : 'Leave a comment'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isEditing ? 'Update your reaction and comment below.' : hasReviewed ? 'You can edit your review using the edit button.' : 'Tell others whether this movie was a hit or a miss.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleEdit}
            disabled={!hasReviewed || isEditing || submitting}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              hasReviewed && !isEditing && !submitting
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setReaction('upvote')}
            disabled={formDisabled}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${reaction === 'upvote' ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-700'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ThumbsUp className="h-4 w-4" /> Liked
          </button>
          <button
            type="button"
            onClick={() => setReaction('downvote')}
            disabled={formDisabled}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${reaction === 'downvote' ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300 bg-white text-gray-700'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <ThumbsDown className="h-4 w-4" /> Disliked
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={280}
            placeholder={
              !token
                ? 'Log in to add your comment.'
                : hasReviewed && !isEditing
                  ? 'You have already reviewed this movie.'
                  : 'Share your thoughts on this movie...'
            }
            disabled={formDisabled}
            className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-800 outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || formDisabled}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? 'Posting...' : isEditing ? 'Update review' : 'Post comment'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setComment(existingReview.content);
                  setReaction(existingReview.reaction === 'upvote' ? 'upvote' : 'downvote');
                  setError('');
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Comments on this movie</h2>

        {movie.reviews && movie.reviews.length > 0 ? (
          movie.reviews.map((review) => {
            const isOwn = currentUser && review.username === currentUser.username;
            return (
              <div key={review.post_id || review.id} className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className={`p-3 rounded-full flex-shrink-0 ${review.reaction === 'upvote' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                  {review.reaction === 'upvote' ? <ThumbsUp className="h-6 w-6" /> : <ThumbsDown className="h-6 w-6" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">{review.display_name || review.username}</p>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(review)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 py-6">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;