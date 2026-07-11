import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Heart, MessageSquareText, Send } from 'lucide-react';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingPostId, setReplyingPostId] = useState(null);
  const [likeBusyId, setLikeBusyId] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const fetchFeed = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/posts/feed', { headers: authHeader });
      setPosts(response.data.posts || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load your feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [token]);

  const handleCreatePost = async (event) => {
    event.preventDefault();
    if (!token) {
      setError('Please log in to post a review.');
      return;
    }

    if (!draft.trim()) {
      setError('Write a short movie review before posting.');
      return;
    }

    setPosting(true);
    setError('');

    try {
      const response = await axios.post('/api/posts', { content: draft.trim() }, { headers: authHeader });
      setPosts((current) => [response.data.post, ...current]);
      setDraft('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not publish your review.');
    } finally {
      setPosting(false);
    }
  };

  const handleLikeToggle = async (postId) => {
    if (!token) {
      setError('Please log in to like reviews.');
      return;
    }

    setLikeBusyId(postId);
    setError('');

    try {
      const existing = posts.find((post) => post.post_id === postId);
      const currentlyLiked = existing?.liked_by_me || false;

      if (currentlyLiked) {
        await axios.delete(`/api/posts/${postId}/like`, { headers: authHeader });
        setPosts((current) => current.map((post) => (post.post_id === postId ? { ...post, like_count: Math.max(0, post.like_count - 1), liked_by_me: false } : post)));
      } else {
        await axios.post(`/api/posts/${postId}/like`, null, { headers: authHeader });
        setPosts((current) => current.map((post) => (post.post_id === postId ? { ...post, like_count: post.like_count + 1, liked_by_me: true } : post)));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the like.');
    } finally {
      setLikeBusyId(null);
    }
  };

  const handleReplySubmit = async (event, postId) => {
    event.preventDefault();
    const content = (replyDrafts[postId] || '').trim();
    if (!content) return;

    try {
      const response = await axios.post(`/api/posts/${postId}/replies`, { content }, { headers: authHeader });
      setPosts((current) => current.map((post) => (post.post_id === postId ? { ...post, reply_count: post.reply_count + 1, replies: [...(post.replies || []), response.data.reply] } : post)));
      setReplyDrafts((current) => ({ ...current, [postId]: '' }));
      setReplyingPostId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the reply.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl border border-gray-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-600">Community feed</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Movie reviews from the people you follow</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Share a short review, react to others, and keep up with the movie conversations that matter to you.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {token ? 'Your feed updates from the users you follow.' : 'Log in to view and create posts.'}
        </div>
      </div>

      <form onSubmit={handleCreatePost} className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="post-draft">
          Write a quick movie review
        </label>
        <textarea
          id="post-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          maxLength={280}
          placeholder="Share your thoughts on a film in under 280 characters..."
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-400"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">{draft.length}/280 characters</p>
          <button
            type="submit"
            disabled={posting || !token}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {posting ? 'Posting...' : 'Publish review'}
          </button>
        </div>
      </form>

      {error ? <p className="mt-4 text-sm text-slate-600">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm text-slate-600">Loading your feed...</p>
      ) : !token ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Sign in to follow users and see their reviews here.
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          No posts yet from the people you follow. Try discovering new users and following them.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <article key={post.post_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{post.display_name || post.username}</p>
                  <p className="text-sm text-slate-500">@{post.username}</p>
                </div>
                {post.movie_title ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{post.movie_title}</span> : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-700">{post.content}</p>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={() => handleLikeToggle(post.post_id)}
                  disabled={likeBusyId === post.post_id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 transition ${post.liked_by_me ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Heart className="h-4 w-4" />
                  {post.like_count}
                </button>

                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <MessageSquareText className="h-4 w-4" />
                  {post.reply_count}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Replies</p>
                  <button type="button" onClick={() => setReplyingPostId(replyingPostId === post.post_id ? null : post.post_id)} className="text-sm font-semibold text-blue-600">
                    {replyingPostId === post.post_id ? 'Cancel' : 'Reply'}
                  </button>
                </div>

                {(post.replies || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {post.replies.map((reply) => (
                      <div key={reply.reply_id} className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800">{reply.display_name || reply.username}</p>
                        <p className="mt-1">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No replies yet.</p>
                )}

                {replyingPostId === post.post_id ? (
                  <form onSubmit={(event) => handleReplySubmit(event, post.post_id)} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={replyDrafts[post.post_id] || ''}
                      onChange={(event) => setReplyDrafts((current) => ({ ...current, [post.post_id]: event.target.value }))}
                      placeholder="Write a reply"
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400"
                    />
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      <Send className="h-4 w-4" /> Reply
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
