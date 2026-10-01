import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api";

const CATEGORIES = ["All", "Photography", "Travel", "Food", "Design", "Nature", "Technology", "Other"];

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = (searchParams.get("q") || "").trim().toLowerCase();

    useEffect(() => {
        apiRequest("/api/posts")
            .then((data) => setPosts(data.posts || []))
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    const visiblePosts = posts.filter((post) => {
        const category = post.category || "Other";
        const matchesCategory = activeCategory === "All" || category === activeCategory;
        const searchableText = [
            post.title,
            post.description,
            post.user?.username,
            category
        ].join(" ").toLowerCase();

        return matchesCategory && (!searchTerm || searchableText.includes(searchTerm));
    });

    function clearFilters() {
        setActiveCategory("All");
        setSearchParams({});
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <header className="mx-auto max-w-[1600px] px-4 pt-6 pb-4 sm:px-6 sm:pt-8 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                            Find your next idea.
                        </h1>
                        <p className="mt-1 text-[15px] text-neutral-500">
                            Discover ideas, inspiration, and things you love.
                        </p>
                    </div>

                    <Link
                        to="/create"
                        className="hidden rounded-full bg-neutral-900 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700 sm:inline-block"
                    >
                        Create a post
                    </Link>
                </div>

                {/* Category chips */}
                <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {CATEGORIES.map((cat) => {
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                aria-pressed={isActive}
                                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-neutral-900 text-white"
                                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Feed */}
            <section
                className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-8"
                aria-label="All posts"
            >
                {loading && (
                    <p className="py-10 text-center text-sm text-neutral-500">Loading posts…</p>
                )}
                {error && (
                    <p className="py-10 text-center text-sm text-rose-600">{error}</p>
                )}
                {!loading && !error && visiblePosts.length === 0 && (
                    <div className="py-10 text-center text-sm text-neutral-500">
                        <p>{posts.length === 0 ? "No posts yet. Check back soon." : "No posts match these filters."}</p>
                        {posts.length > 0 && (searchTerm || activeCategory !== "All") && (
                            <button onClick={clearFilters} className="mt-3 font-medium text-neutral-900 underline underline-offset-4">
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && visiblePosts.length > 0 && (
                    <div
                        className="
                            columns-2 gap-3
                            sm:columns-3 sm:gap-4
                            lg:columns-4 lg:gap-4
                            xl:columns-5 xl:gap-5
                            [column-fill:_balance]
                        "
                    >
                        {visiblePosts.map((post, index) => (
                            <PostCard key={post._id} post={post} index={index} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

function PostCard({ post, index }) {
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes?.length ?? post.likesCount ?? 0);

    // Give a little extra weight to a few posts to break the rhythm
    const isFeature = index % 11 === 3;

    const handleLike = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setLiked((v) => !v);
        setLikeCount((c) => (liked ? c - 1 : c + 1));
        // TODO: call apiRequest(`/api/posts/${post._id}/like`, { method: "POST" })
    };

    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((v) => !v);
        // TODO: call apiRequest(`/api/posts/${post._id}/save`, { method: "POST" })
    };

    return (
        <Link
            to={`/post/${post._id}`}
            className="group mb-3 block break-inside-avoid sm:mb-4 xl:mb-5"
        >
            <div className="relative overflow-hidden rounded-xl bg-neutral-100">
                <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    className={`w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
                        isFeature ? "min-h-[320px]" : ""
                    }`}
                />

                {/* Hover overlay */}
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />

                {/* Save button — top right, appears on hover */}
                <button
                    onClick={handleSave}
                    aria-label={saved ? "Unsave" : "Save"}
                    className={`absolute right-2 top-2 rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-sm transition-all duration-200 ${
                        saved
                            ? "bg-neutral-900 text-white"
                            : "bg-white text-neutral-900 hover:bg-neutral-100"
                    } opacity-0 group-hover:opacity-100 focus:opacity-100`}
                >
                    {saved ? "Saved" : "Save"}
                </button>
            </div>

            {/* Meta */}
            <div className="mt-2 px-1">
                <h2 className="line-clamp-2 text-[14px] font-medium leading-snug text-neutral-900">
                    {post.title}
                </h2>

                <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        {post.user?.avatar ? (
                            <img
                                src={post.user.avatar}
                                alt=""
                                className="h-5 w-5 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-600">
                                {(post.user?.username || "?").charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="truncate text-[12px] text-neutral-500">
                            {post.user?.username || "Community member"}
                        </span>
                    </div>

                    <button
                        onClick={handleLike}
                        aria-label={liked ? "Unlike" : "Like"}
                        className="flex shrink-0 items-center gap-1 text-[12px] text-neutral-500 transition-colors hover:text-rose-600"
                    >
                        <svg
                            className="h-3.5 w-3.5"
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
                        <span className={liked ? "text-rose-600" : ""}>{likeCount}</span>
                    </button>
                </div>
            </div>
        </Link>
    );
}

export default Home;