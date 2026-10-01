import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

// Small curated collage — replace with your own URLs if you want
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

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
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
        const username = form.username.trim();
        const email = form.email.trim();

        if (!username) errors.username = "Username is required.";
        else if (username.length < 3)
            errors.username = "Username must be at least 3 characters.";

        if (!email) errors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.email = "Enter a valid email address.";

        if (!form.password) errors.password = "Password is required.";
        else if (form.password.length < 6)
            errors.password = "Password must be at least 6 characters.";

        if (!form.confirmPassword)
            errors.confirmPassword = "Please confirm your password.";
        else if (form.password !== form.confirmPassword)
            errors.confirmPassword = "Passwords do not match.";

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
            await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                }),
            });
            navigate("/profile");
        } catch (requestError) {
            setError(requestError.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] grid-cols-1 lg:grid-cols-2">

                {/* Left visual collage — hidden on mobile */}
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
                                Create your account
                            </h1>
                            <p className="mt-1.5 text-[15px] text-neutral-500">
                                Join and start discovering and sharing ideas.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                            {/* Username */}
                            <Field
                                label="Username"
                                error={fieldErrors.username}
                            >
                                <input
                                    type="text"
                                    autoComplete="username"
                                    value={form.username}
                                    onChange={(e) => updateField("username", e.target.value)}
                                    placeholder="Choose a username"
                                    className={inputClass(fieldErrors.username)}
                                />
                            </Field>

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

                            {/* Password */}
                            <Field label="Password" error={fieldErrors.password}>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={(e) => updateField("password", e.target.value)}
                                    placeholder="Create a password"
                                    className={inputClass(fieldErrors.password)}
                                />
                            </Field>

                            {/* Confirm password */}
                            <Field
                                label="Confirm password"
                                error={fieldErrors.confirmPassword}
                            >
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        updateField("confirmPassword", e.target.value)
                                    }
                                    placeholder="Confirm your password"
                                    className={inputClass(fieldErrors.confirmPassword)}
                                />
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
                                {submitting ? "Creating account…" : "Create account"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-[14px] text-neutral-500">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-neutral-900 underline underline-offset-2 transition-colors hover:text-neutral-700"
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

/* ---------- Small helpers ---------- */

function Field({ label, error, children }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-neutral-700">
                {label}
            </span>
            {children}
            {error && (
                <span className="text-[12px] text-rose-600">{error}</span>
            )}
        </label>
    );
}

function inputClass(hasError) {
    return `h-12 rounded-lg border bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400 ${
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

export default Register;