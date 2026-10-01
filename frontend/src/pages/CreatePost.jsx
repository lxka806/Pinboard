import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function CreatePost() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({ title: "", description: "", image: "", category: "Other" });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    /* ---------- Image picking ---------- */

    function handleFileChange(event) {
        setError("");
        setFieldErrors((f) => ({ ...f, image: "" }));

        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setFieldErrors((f) => ({ ...f, image: "Please choose an image file." }));
            return;
        }
        const MAX_MB = 4;
        if (file.size > MAX_MB * 1024 * 1024) {
            setFieldErrors((f) => ({
                ...f,
                image: `Image is too large. Max ${MAX_MB}MB.`,
            }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setForm((prev) => ({ ...prev, image: reader.result }));
        };
        reader.onerror = () =>
            setFieldErrors((f) => ({ ...f, image: "Could not read that file." }));
        reader.readAsDataURL(file);
    }

    function removeImage() {
        setForm((prev) => ({ ...prev, image: "" }));
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    /* ---------- Submit ---------- */

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        // Client-side validation
        const nextFieldErrors = {};
        if (!form.title.trim()) nextFieldErrors.title = "Title is required.";
        if (!form.image) nextFieldErrors.image = "Image is required.";

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            return;
        }

        setSubmitting(true);
        try {
            const data = await apiRequest("/api/posts", {
                method: "POST",
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    image: form.image,
                    category: form.category,
                }),
            });
            navigate(`/post/${data.post._id}`);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8">

                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                        Create a post
                    </h1>
                    <p className="mt-1 text-[15px] text-neutral-500">
                        Share an idea, a photo, or something you love.
                    </p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10"
                >

                    {/* ---------- Left: image area ---------- */}
                    <div className="flex flex-col">

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {form.image ? (
                            <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
                                <img
                                    src={form.image}
                                    alt={form.title || "Preview"}
                                    className="block max-h-[70vh] w-full object-contain"
                                />
                                <div className="absolute right-3 top-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-full bg-white/95 px-3.5 py-2 text-[13px] font-medium text-neutral-900 shadow-sm transition-colors hover:bg-white"
                                    >
                                        Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        aria-label="Remove image"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm transition-colors hover:bg-white hover:text-rose-600"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M6 6l12 12M18 6L6 18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-neutral-50 p-8 text-center transition-colors hover:border-neutral-400 hover:bg-neutral-100 ${
                                    fieldErrors.image
                                        ? "border-rose-300"
                                        : "border-neutral-200"
                                }`}
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                                    <svg
                                        className="h-6 w-6 text-neutral-700"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-4.5-4.5L5 22" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[15px] font-medium text-neutral-900">
                                        Choose an image
                                    </p>
                                    <p className="mt-1 text-[13px] text-neutral-500">
                                        Upload an image to create your post
                                    </p>
                                </div>
                                <p className="text-[12px] text-neutral-400">
                                    JPG, PNG or GIF · max 4MB
                                </p>
                            </button>
                        )}

                        {fieldErrors.image && (
                            <p className="mt-2 text-[13px] text-rose-600">
                                {fieldErrors.image}
                            </p>
                        )}
                    </div>

                    {/* ---------- Right: form ---------- */}
                    <div className="flex flex-col gap-5">

                        {/* Title */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-medium text-neutral-700">
                                Title
                            </span>
                            <input
                                value={form.title}
                                onChange={(e) => {
                                    setForm({ ...form, title: e.target.value });
                                    if (fieldErrors.title)
                                        setFieldErrors((f) => ({ ...f, title: "" }));
                                }}
                                placeholder="Add a title"
                                maxLength={120}
                                className={`h-12 rounded-lg border bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400 ${
                                    fieldErrors.title
                                        ? "border-rose-300"
                                        : "border-neutral-200"
                                }`}
                            />
                            {fieldErrors.title && (
                                <span className="text-[12px] text-rose-600">
                                    {fieldErrors.title}
                                </span>
                            )}
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-medium text-neutral-700">Category</span>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="h-12 rounded-lg border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 outline-none transition-colors focus:border-neutral-400"
                            >
                                {["Photography", "Travel", "Food", "Design", "Nature", "Technology", "Other"].map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </label>

                        {/* Description */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[13px] font-medium text-neutral-700">
                                Description{" "}
                                <span className="font-normal text-neutral-400">
                                    Optional
                                </span>
                            </span>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                                placeholder="Tell everyone about your post..."
                                rows={6}
                                maxLength={2000}
                                className="resize-none rounded-lg border border-neutral-200 bg-white p-4 text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
                            />
                            <span className="self-end text-[12px] text-neutral-400">
                                {form.description.length}/2000
                            </span>
                        </label>

                        {/* Global error */}
                        {error && (
                            <p className="text-[13px] text-rose-600">
                                {error}
                                {error.toLowerCase().includes("authorized") && (
                                    <>
                                        {" "}
                                        <Link
                                            to="/login"
                                            className="font-medium underline underline-offset-2"
                                        >
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="mt-2 flex items-center justify-end gap-2">
                            <Link
                                to="/"
                                className="rounded-full border border-neutral-300 px-4 py-2.5 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full bg-neutral-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60"
                            >
                                {submitting ? "Creating…" : "Create Post"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default CreatePost;