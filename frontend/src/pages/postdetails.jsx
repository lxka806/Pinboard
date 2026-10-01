import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api";

function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [comment, setComment] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [commentError, setCommentError] = useState("");
    const [likeError, setLikeError] = useState("");
    const [liking, setLiking] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadPost = () => {
        setLoading(true);
        setError("");
        setNotFound(false);
        apiRequest(`/api/posts/${id}`)
            .then((data) => setPost(data.post))
            .catch((requestError) => {
                if (/not found/i.test(requestError.message) || requestError.status === 404) {
                    setNotFound(true);
                } else {
                    setError(requestError.message || "Something went wrong");
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPost();

        apiRequest("/api/auth/session")
            .then((data) => setCurrentUserId(data.user?._id ?? null))
            .catch(() => setCurrentUserId(null))
            .finally(() => setAuthChecked(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const liked = Boolean(
        currentUserId &&
            post?.likes?.some((like) => {
                const likeUserId = like.user?._id || like.user;
                return String(likeUserId) === String(currentUserId);
            })
    );

    async function toggleLike() {
        setLikeError("");
        setLiking(true);
        // Optimistic update
        const wasLiked = liked;
        const prevLikes = post?.likes ?? [];
        const optimisticLikes = wasLiked
            ? prevLikes.filter((l) => String(l.user?._id || l.user) !== String(currentUserId))
            : [...prevLikes, { user: { _id: currentUserId } }];
        setPost((p) => ({
            ...p,
            likes: optimisticLikes,
            likesCount: optimisticLikes.length,
        }));

        try {
            await apiRequest(`/api/likes/${id}/${wasLiked ? "unlike" : "like"}`, {
                method: wasLiked ? "DELETE" : "POST",
            });
        } catch (requestError) {
            // Revert
            setPost((p) => ({
                ...p,
                likes: prevLikes,
                likesCount: prevLikes.length,
            }));
            setLikeError(requestError.message);
        } finally {
            setLiking(false);
        }
    }

    async function submitComment(event) {
        event.preventDefault();
        if (!comment.trim()) return;
        setCommentError("");
        setSubmitting(true);

        const content = comment.trim();
        const tempId = `temp-${Date.now()}`;
        const optimisticComment = {
            _id: tempId,
            content,
            user: { _id: currentUserId, username: post.user?.username },
            createdAt: new Date().toISOString(),
            pending: true,
        };

        // Optimistic add
        setPost((p) => ({
            ...p,
            comments: [...(p.comments ?? []), optimisticComment],
            commentsCount: (p.commentsCount ?? p.comments?.length ?? 0) + 1,
        }));
        setComment("");

        try {
            await apiRequest(`/api/posts/${id}/comments`, {
                method: "POST",
                body: JSON.stringify({ content }),
            });
            // Replace optimistic entry with the real one
            const data = await apiRequest(`/api/posts/${id}`);
            setPost(data.post);
        } catch (requestError) {
            // Roll back
            setPost((p) => ({
                ...p,
                comments: (p.comments ?? []).filter((c) => c._id !== tempId),
                commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1),
            }));
            setCommentError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function deleteComment(commentId) {
        const prev = post.comments ?? [];
        setPost((p) => ({
            ...p,
            comments: prev.filter((c) => c._id !== commentId),
            commentsCount: Math.max(0, (p.commentsCount ?? prev.length) - 1),
        }));
        try {
            await apiRequest(`/api/posts/${id}/comments/${commentId}`, {
                method: "DELETE",
            });
        } catch {
            // Roll back
            setPost((p) => ({ ...p, comments: prev }));
        }
    }

    if (loading) return <PostSkeleton />;

    if (notFound) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
                <h1 className="text-2xl font-semibold text-neutral-900">Post not found</h1>
                <p className="text-[15px] text-neutral-500">
                    This post may have been removed or the link is incorrect.
                </p>
                <Link
                    to="/"
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700"
                >
                    Back to Home
                </Link>
            </main>
        );
    }

    if (error) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
                <h1 className="text-2xl font-semibold text-neutral-900">Something went wrong</h1>
                <p className="text-[15px] text-neutral-500">{error}</p>
                <button
                    onClick={loadPost}
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700"
                >
                    Try again
                </button>
            </main>
        );
    }

    if (!post) return null;

    const likesCount = post.likesCount ?? post.likes?.length ?? 0;
    const commentsCount = post.commentsCount ?? post.comments?.length ?? 0;

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-16 sm:px-6 sm:pt-6 lg:px-8">

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 inline-flex items-center gap-1.5 text-[14px] text-neutral-600 transition-colors hover:text-neutral-900"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                    </svg>
                    Back
                </button>

                {/* Two-column viewer */}
                <article className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">

                    {/* Image */}
                    <div className="overflow-hidden rounded-2xl bg-neutral-100">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="block max-h-[80vh] w-full object-contain"
                        />
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col">

                        {/* Title + description */}
                        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-3xl">
                            {post.title}
                        </h1>
                        {post.description && (
                            <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
                                {post.description}
                            </p>
                        )}

                        {/* Creator */}
                        <Link
                            to={
                                post.user?._id
                                    ? `/profile/${post.user._id}`
                                    : "/profile"
                            }
                            className="mt-5 flex items-center gap-3 rounded-full p-1 pr-3 transition-colors hover:bg-neutral-100"
                        >
                            {post.user?.profilePicture ? (
                                <img
                                    src={post.user.profilePicture}
                                    alt=""
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-600">
                                    {(post.user?.username || "?").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[14px] font-medium text-neutral-900">
                                    {post.user?.username || "Community member"}
                                </p>
                                {post.createdAt && (
                                    <p className="text-[12px] text-neutral-500">
                                        {formatDate(post.createdAt)}
                                    </p>
                                )}
                            </div>
                        </Link>

                        {/* Actions */}
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button
                                onClick={toggleLike}
                                disabled={!authChecked || liking || !currentUserId}
                                aria-pressed={liked}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                                    liked
                                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                        : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                                } disabled:cursor-default disabled:opacity-60`}
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill={liked ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                                </svg>
                                <span>{likesCount}</span>
                                <span className="sr-only">likes</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: post.title,
                                            url: window.location.href,
                                        }).catch(() => {});
                                    } else {
                                        navigator.clipboard?.writeText(window.location.href);
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-[14px] font-medium text-neutral-800 transition-colors hover:bg-neutral-200"
                            >
                                Share
                            </button>
                        </div>

                        {likeError && (
                            <p className="mt-3 text-[13px] text-rose-600">
                                {likeError}
                                {!currentUserId && (
                                    <>
                                        {" "}
                                        <Link to="/login" className="underline">
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </p>
                        )}

                        {/* Divider */}
                        <hr className="my-6 border-neutral-200" />

                        {/* Comments */}
                        <section className="flex flex-col">
                            <h2 className="text-[15px] font-semibold text-neutral-900">
                                Comments{" "}
                                {commentsCount > 0 && (
                                    <span className="ml-1 text-[13px] font-normal text-neutral-500">
                                        {commentsCount}
                                    </span>
                                )}
                            </h2>

                            <div className="mt-4 flex flex-col gap-4">
                                {post.comments?.length ? (
                                    post.comments.map((item) => (
                                        <CommentRow
                                            key={item._id}
                                            comment={item}
                                            canDelete={
                                                currentUserId &&
                                                String(item.user?._id || item.user) ===
                                                    String(currentUserId)
                                            }
                                            onDelete={() => deleteComment(item._id)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-[14px] text-neutral-500">
                                        No comments yet.
                                    </p>
                                )}
                            </div>

                            {/* Add comment */}
                            <div className="mt-6">
                                {authChecked && currentUserId ? (
                                    <form
                                        onSubmit={submitComment}
                                        className="flex items-start gap-2"
                                    >
                                        <input
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            maxLength={500}
                                            className="h-11 flex-1 rounded-full border border-neutral-200 bg-white px-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!comment.trim() || submitting}
                                            className="h-11 rounded-full bg-neutral-900 px-5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-50"
                                        >
                                            {submitting ? "Sending…" : "Send"}
                                        </button>
                                    </form>
                                ) : authChecked ? (
                                    <p className="text-[14px] text-neutral-500">
                                        <Link
                                            to="/login"
                                            className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
                                        >
                                            Log in
                                        </Link>{" "}
                                        to leave a comment.
                                    </p>
                                ) : null}

                                {commentError && (
                                    <p className="mt-2 text-[13px] text-rose-600">
                                        {commentError}
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </article>
            </div>
        </main>
    );
}

function CommentRow({ comment, canDelete, onDelete }) {
    const username = comment.user?.username || "Member";
    const avatar = comment.user?.profilePicture;

    return (
        <div className="flex items-start gap-3">
            {avatar ? (
                <img
                    src={avatar}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
            ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[12px] font-semibold text-neutral-600">
                    {username.charAt(0).toUpperCase()}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <p className="truncate text-[13.5px] font-medium text-neutral-900">
                        {username}
                    </p>
                    {comment.createdAt && (
                        <span className="shrink-0 text-[12px] text-neutral-500">
                            {timeAgo(comment.createdAt)}
                        </span>
                    )}
                    {comment.pending && (
                        <span className="shrink-0 text-[12px] text-neutral-400">
                            sending…
                        </span>
                    )}
                </div>
                <p className="mt-0.5 break-words text-[14px] leading-relaxed text-neutral-700">
                    {comment.content}
                </p>
            </div>
            {canDelete && !comment.pending && (
                <button
                    onClick={onDelete}
                    aria-label="Delete comment"
                    className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-rose-600"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                    </svg>
                </button>
            )}
        </div>
    );
}

function PostSkeleton() {
    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-16 sm:px-6 sm:pt-6 lg:px-8">
                <div className="mb-4 h-5 w-16 animate-pulse rounded bg-neutral-100" />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
                    {/* Image skeleton */}
                    <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-neutral-100" />

                    {/* Right column */}
                    <div className="flex flex-col">
                        <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-100" />
                        <div className="mt-3 h-4 w-full animate-pulse rounded bg-neutral-100" />
                        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-neutral-100" />

                        <div className="mt-5 flex items-center gap-3">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100" />
                            <div className="flex-1">
                                <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
                                <div className="mt-1.5 h-3 w-20 animate-pulse rounded bg-neutral-100" />
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <div className="h-10 w-24 animate-pulse rounded-full bg-neutral-100" />
                            <div className="h-10 w-20 animate-pulse rounded-full bg-neutral-100" />
                            <div className="h-10 w-20 animate-pulse rounded-full bg-neutral-100" />
                        </div>

                        <hr className="my-6 border-neutral-200" />

                        <div className="space-y-4">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100" />
                                    <div className="flex-1">
                                        <div className="h-3.5 w-28 animate-pulse rounded bg-neutral-100" />
                                        <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-neutral-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

/* --- helpers --- */

function formatDate(value) {
    try {
        return new Date(value).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "";
    }
}

function timeAgo(value) {
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Math.floor((Date.now() - then) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(value);
}

export default PostDetails;