import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

// Small curated collage — swap with your own URLs if you like
const COLLAGE_IMAGES = [
    {
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=70",
        alt: "Mountain landscape",
    },
    {
        src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=70",
        alt: "Snowy peaks",
    },
    {
        src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=70",
        alt: "Coastal sunset",
    },
    {
        src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=70",
        alt: "Forest",
    },
];

function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function updateField(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((f) => ({ ...f, [key]: "" }));
        }
    }

    function validate() {
        const errors = {};
        const email = form.email.trim();

        if (!email) errors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.email = "Enter a valid email address.";

        if (!form.password) errors.password = "Password is required.";

        return errors;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password,
                }),
            });
            // Cookie is set by the backend; no localStorage involved.
            navigate("/");
        } catch (requestError) {
            setError(requestError.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] grid-cols-1 lg:grid-cols-2">

                {/* Left — visual collage, hidden on mobile */}
                <aside className="relative hidden overflow-hidden bg-neutral-50 lg:block">
                    <div className="grid h-full grid-cols-2 gap-3 p-6">
                        <div className="flex flex-col gap-3 pt-6">
                            <CollageImg {...COLLAGE_IMAGES[0]} className="h-64" />
                            <CollageImg {...COLLAGE_IMAGES[1]} className="h-80" />
                        </div>
                        <div className="flex flex-col gap-3 pb-6">
                            <CollageImg {...COLLAGE_IMAGES[2]} className="h-72" />
                            <CollageImg {...COLLAGE_IMAGES[3]} className="h-56" />
                        </div>
                    </div>

                    {/* Soft fade so the collage doesn't fight the form */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
                </aside>

                {/* Right — form */}
                <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                    <div className="w-full max-w-md">

                        <header className="mb-8">
                            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                                Welcome back
                            </h1>
                            <p className="mt-1.5 text-[15px] text-neutral-500">
                                Log in to continue discovering and sharing ideas.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                            {/* Email */}
                            <Field label="Email" error={fieldErrors.email}>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    placeholder="Enter your email"
                                    className={inputClass(fieldErrors.email)}
                                />
                            </Field>

                            {/* Password with visibility toggle */}
                            <Field label="Password" error={fieldErrors.password}>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={form.password}
                                        onChange={(e) =>
                                            updateField("password", e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        className={`${inputClass(
                                            fieldErrors.password
                                        )} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={
                                            showPassword ? "Hide password" : "Show password"
                                        }
                                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon />
                                        ) : (
                                            <EyeIcon />
                                        )}
                                    </button>
                                </div>
                            </Field>

                            {/* Server error */}
                            {error && (
                                <p className="text-[13px] text-rose-600">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-2 h-12 rounded-full bg-neutral-900 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60"
                            >
                                {submitting ? "Signing in…" : "Sign in"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-[14px] text-neutral-500">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-neutral-900 underline underline-offset-2 transition-colors hover:text-neutral-700"
                            >
                                Create one
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

/* ---------- Helpers ---------- */

function Field({ label, error, children }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-neutral-700">{label}</span>
            {children}
            {error && <span className="text-[12px] text-rose-600">{error}</span>}
        </label>
    );
}

function inputClass(hasError) {
    return `h-12 w-full rounded-lg border bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400 ${
        hasError ? "border-rose-300" : "border-neutral-200"
    }`;
}

function CollageImg({ src, alt, className = "" }) {
    return (
        <img
            src={src}
            alt={alt}
            className={`w-full rounded-2xl object-cover ${className}`}
        />
    );
}

function EyeIcon() {
    return (
        <svg
            className="h-4.5 w-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            className="h-4.5 w-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M17.94 17.94A10.6 10.6 0 0 1 12 20c-6.5 0-10-8-10-8a17.6 17.6 0 0 1 4.22-5.32" />
            <path d="M9.9 4.24A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19" />
            <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
            <path d="m2 2 20 20" />
        </svg>
    );
}

export default Login;