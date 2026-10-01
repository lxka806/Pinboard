import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [createdPosts, setCreatedPosts] = useState([]);
    const [likedPosts, setLikedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("created");
    const [editing, setEditing] = useState(false);

    // Edit form state
    const [form, setForm] = useState({ username: "", profilePicture: "", bio: "" });
    const [savingProfile, setSavingProfile] = useState(false);
    const [formError, setFormError] = useState("");
    const [formMessage, setFormMessage] = useState("");

    useEffect(() => {
        Promise.all([
            apiRequest("/api/auth/profile"),
            apiRequest("/api/posts"),
            apiRequest("/api/likes/mine"),
        ])
            .then(([profileData, postsData, likedData]) => {
                const me = profileData.user;
                setUser(me);
                setForm({
                    username: me.username || "",
                    profilePicture: me.profilePicture || "",
                    bio: me.bio || "",
                });
                setCreatedPosts(
                    (postsData.posts || []).filter(
                        (post) => String(post.user?._id) === String(me._id)
                    )
                );
                setLikedPosts(likedData.posts || []);
            })
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoading(false));
    }, []);

    /* ---------- Image upload ---------- */

    function handleFileChange(event) {
        setFormError("");
        setFormMessage("");

        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setFormError("Please choose an image file.");
            return;
        }
        const MAX_MB = 3;
        if (file.size > MAX_MB * 1024 * 1024) {
            setFormError(`Image is too large. Max ${MAX_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setForm((f) => ({ ...f, profilePicture: reader.result }));
        };
        reader.onerror = () => setFormError("Could not read that file.");
        reader.readAsDataURL(file);
    }

    function removePicture() {
        setForm((f) => ({ ...f, profilePicture: "" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    /* ---------- Save ---------- */

    async function saveProfile(event) {
        event.preventDefault();
        setFormError("");
        setFormMessage("");
        setSavingProfile(true);
        try {
            const data = await apiRequest("/api/auth/edit-profile", {
                method: "PUT",
                body: JSON.stringify(form),
            });
            setUser(data.user);
            setFormMessage("Profile updated.");
            setEditing(false);
        } catch (requestError) {
            setFormError(requestError.message);
        } finally {
            setSavingProfile(false);
        }
    }

    function cancelEdit() {
        setEditing(false);
        setFormError("");
        setFormMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (user) {
            setForm({
                username: user.username || "",
                profilePicture: user.profilePicture || "",
                bio: user.bio || "",
            });
        }
    }

    async function logout() {
        try {
            await apiRequest("/api/auth/logout", { method: "POST" });
        } finally {
            navigate("/login");
        }
    }

    const postCount = createdPosts.length;

    // Total likes received across all of the user's created posts
    const totalLikes = useMemo(() => {
        return createdPosts.reduce((sum, post) => {
            const count = post.likes?.length ?? post.likesCount ?? 0;
            return sum + count;
        }, 0);
    }, [createdPosts]);

    const visiblePosts = useMemo(
        () => (activeTab === "created" ? createdPosts : likedPosts),
        [activeTab, createdPosts, likedPosts]
    );

    if (loading) return <ProfileSkeleton />;

    if (error && !user) {
        return (
            <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
                <h1 className="text-2xl font-semibold text-neutral-900">
                    Couldn't load profile
                </h1>
                <p className="text-[15px] text-neutral-500">{error}</p>
                <Link
                    to="/login"
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700"
                >
                    Sign in
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1700px] px-4 pt-8 pb-16 sm:px-6 lg:px-8">

                {/* Header */}
                <header className="flex flex-col items-center text-center">
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture}
                            alt=""
                            className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28"
                        />
                    ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-200 text-3xl font-semibold text-neutral-600 sm:h-28 sm:w-28">
                            {(user?.username || "?").charAt(0).toUpperCase()}
                        </div>
                    )}

                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        {user?.username}
                    </h1>

                    {user?.bio && (
                        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-neutral-600">
                            {user.bio}
                        </p>
                    )}

                    {/* Stats — Posts · Likes */}
                    <div className="mt-5 flex items-center gap-8 text-[14px] text-neutral-600">
                        <div className="flex flex-col items-center">
                            <span className="text-[16px] font-semibold text-neutral-900">
                                {postCount}
                            </span>
                            <span className="text-[12px] text-neutral-500">Posts</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[16px] font-semibold text-neutral-900">
                                {totalLikes}
                            </span>
                            <span className="text-[12px] text-neutral-500">Likes</span>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                        <button
                            onClick={() => setEditing((v) => !v)}
                            className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700"
                        >
                            {editing ? "Close editor" : "Edit Profile"}
                        </button>
                        <button
                            onClick={logout}
                            className="rounded-full border border-neutral-300 px-5 py-2.5 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                {/* Edit form */}
                {editing && (
                    <section className="mx-auto mt-8 max-w-lg rounded-2xl border border-neutral-200 p-5 sm:p-6">
                        <h2 className="text-[15px] font-semibold text-neutral-900">
                            Edit profile
                        </h2>

                        <form onSubmit={saveProfile} className="mt-4 flex flex-col gap-5">

                            {/* Picture uploader */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {form.profilePicture ? (
                                        <img
                                            src={form.profilePicture}
                                            alt=""
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 text-2xl font-semibold text-neutral-600">
                                            {(form.username || "?").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-full bg-neutral-100 px-4 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
                                    >
                                        {form.profilePicture ? "Change picture" : "Upload picture"}
                                    </button>
                                    {form.profilePicture && (
                                        <button
                                            type="button"
                                            onClick={removePicture}
                                            className="rounded-full px-3 py-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-rose-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-[12px] text-neutral-400">
                                    JPG, PNG or GIF · max 3MB
                                </p>
                            </div>

                            {/* Username */}
                            <label className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-medium text-neutral-700">
                                    Username
                                </span>
                                <input
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                    required
                                    className="h-11 rounded-lg border border-neutral-200 bg-white px-3.5 text-[14px] text-neutral-900 outline-none transition-colors focus:border-neutral-400"
                                />
                            </label>

                            {/* Bio */}
                            <label className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-medium text-neutral-700">
                                    Bio
                                </span>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) =>
                                        setForm({ ...form, bio: e.target.value })
                                    }
                                    maxLength={160}
                                    rows={3}
                                    className="resize-none rounded-lg border border-neutral-200 bg-white p-3.5 text-[14px] text-neutral-900 outline-none transition-colors focus:border-neutral-400"
                                />
                                <span className="self-end text-[12px] text-neutral-400">
                                    {form.bio.length}/160
                                </span>
                            </label>

                            {formError && (
                                <p className="text-[13px] text-rose-600">{formError}</p>
                            )}
                            {formMessage && (
                                <p className="text-[13px] text-emerald-600">
                                    {formMessage}
                                </p>
                            )}

                            <div className="mt-1 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-full border border-neutral-300 px-4 py-2 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="rounded-full bg-neutral-900 px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
                                >
                                    {savingProfile ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {/* Tabs — Created · Liked */}
                <div className="mt-10 flex justify-center border-b border-neutral-200">
                    <TabButton
                        active={activeTab === "created"}
                        onClick={() => setActiveTab("created")}
                    >
                        Created
                    </TabButton>
                    <TabButton
                        active={activeTab === "liked"}
                        onClick={() => setActiveTab("liked")}
                    >
                        Liked
                    </TabButton>
                </div>

                {/* Posts */}
                <section
                    className="mt-6"
                    aria-label={activeTab === "created" ? "Created posts" : "Liked posts"}
                >
                    {visiblePosts.length === 0 ? (
                        <EmptyTab
                            tab={activeTab}
                            onCreate={() => navigate("/create")}
                        />
                    ) : (
                        <div
                            className="
                                columns-2 gap-3
                                sm:columns-3 sm:gap-4
                                lg:columns-4 lg:gap-4
                                xl:columns-5 xl:gap-5
                                2xl:columns-6
                            "
                        >
                            {visiblePosts.map((post) => (
                                <ProfilePostCard key={post._id} post={post} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`relative px-5 pb-3 pt-1 text-[15px] font-medium transition-colors ${
                active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
            }`}
        >
            {children}
            <span
                className={`absolute -bottom-px left-0 right-0 h-0.5 rounded-full transition-colors ${
                    active ? "bg-neutral-900" : "bg-transparent"
                }`}
            />
        </button>
    );
}

function ProfilePostCard({ post }) {
    const likeCount = post.likesCount ?? post.likes?.length ?? 0;

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
                    className="block w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            </div>

            <div className="mt-2 px-1">
                <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-neutral-900">
                    {post.title}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[12px] text-neutral-500">
                    <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                    <span>{likeCount}</span>
                </div>
            </div>
        </Link>
    );
}

function EmptyTab({ tab, onCreate }) {
    if (tab === "liked") {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <p className="text-[15px] text-neutral-700">No liked posts yet</p>
                <p className="max-w-sm text-[14px] text-neutral-500">
                    Posts you like from the feed will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-[15px] text-neutral-700">No posts yet</p>
            <button
                onClick={onCreate}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700"
            >
                Create a post
            </button>
        </div>
    );
}

function ProfileSkeleton() {
    const heights = [
        "h-40", "h-64", "h-32", "h-72", "h-48",
        "h-56", "h-36", "h-80", "h-44", "h-60",
    ];

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-[1700px] px-4 pt-8 pb-16 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center">
                    <div className="h-24 w-24 animate-pulse rounded-full bg-neutral-100 sm:h-28 sm:w-28" />
                    <div className="mt-4 h-7 w-40 animate-pulse rounded bg-neutral-100" />
                    <div className="mt-3 h-4 w-64 animate-pulse rounded bg-neutral-100" />
                    <div className="mt-5 flex gap-8">
                        <div className="h-10 w-14 animate-pulse rounded bg-neutral-100" />
                        <div className="h-10 w-14 animate-pulse rounded bg-neutral-100" />
                    </div>
                    <div className="mt-5 h-10 w-32 animate-pulse rounded-full bg-neutral-100" />
                </div>

                <div className="mt-10 flex justify-center gap-6 border-b border-neutral-200 pb-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-neutral-100" />
                    <div className="h-4 w-12 animate-pulse rounded bg-neutral-100" />
                </div>

                <div className="mt-6 columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4 lg:gap-4 xl:columns-5 xl:gap-5 2xl:columns-6">
                    {heights.map((h, i) => (
                        <div
                            key={i}
                            className={`mb-3 break-inside-avoid animate-pulse rounded-xl bg-neutral-100 sm:mb-4 xl:mb-5 ${h}`}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}

export default Profile;