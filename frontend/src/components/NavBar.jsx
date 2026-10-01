import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
function NavBar() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check session on mount
    useEffect(() => {
        let cancelled = false;

        async function fetchUser() {
            try {
                const data = await apiRequest("/api/auth/session");
                if (!cancelled) setUser(data.user ?? null);
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchUser();
        return () => {
            cancelled = true;
        };
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await apiRequest("/api/auth/logout", { method: "POST" });
        } catch {
            // ignore — still clear UI
        }
        setUser(null);
        setMenuOpen(false);
        navigate("/");
    };

    const isAuthenticated = !!user;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex shrink-0 items-center gap-1.5 text-[22px] font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-70"
                >
                    <span className="text-rose-600">◈</span>
                    <span>pinboard<span className="text-rose-600">.</span></span>
                </Link>

                {/* Search */}
                <SearchBar
                    key={`${location.pathname}${location.search}`}
                    initialQuery={new URLSearchParams(location.search).get("q") || ""}
                    onSearch={(search) => navigate(search ? `/?q=${encodeURIComponent(search)}` : "/")}
                />

                {/* Desktop nav — only shows once auth state is known */}
                <div className="hidden items-center gap-1 md:flex">
                    {loading ? (
                        <div className="h-9 w-24" aria-hidden="true" />
                    ) : isAuthenticated ? (
                        <>
                            <Link
                                to="/create"
                                className="rounded-full bg-neutral-900 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700"
                            >
                                Create
                            </Link>

                            <Link
                                to="/profile"
                                aria-label="Profile"
                                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <circle cx="12" cy="8" r="3.5" />
                                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                                </svg>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="ml-1 rounded-full px-3.5 py-2 text-[15px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-full px-3.5 py-2 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="ml-1 rounded-full bg-neutral-900 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-neutral-700"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile */}
                <div className="flex items-center gap-1 md:hidden">
                    {!loading && isAuthenticated && (
                        <Link
                            to="/create"
                            aria-label="Create post"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-neutral-700"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </Link>
                    )}

                    {!loading && (
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                {menuOpen ? (
                                    <>
                                        <path d="M6 6l12 12" />
                                        <path d="M18 6L6 18" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M4 7h16" />
                                        <path d="M4 12h16" />
                                        <path d="M4 17h16" />
                                    </>
                                )}
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && !loading && (
                <div className="border-t border-neutral-200 bg-white md:hidden">
                    <div className="mx-auto flex max-w-[1600px] flex-col px-4 py-2 sm:px-6">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-lg px-3 py-3 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg px-3 py-3 text-left text-[15px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-lg px-3 py-3 text-[15px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="mt-1 rounded-full bg-neutral-900 px-4 py-2.5 text-center text-[15px] font-medium text-white transition-colors hover:bg-neutral-700"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

function SearchBar({ initialQuery, onSearch }) {
    const [query, setQuery] = useState(initialQuery);

    function handleSubmit(event) {
        event.preventDefault();
        onSearch(query.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="relative max-w-2xl flex-1" role="search">
            <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for ideas"
                aria-label="Search"
                className="h-11 w-full rounded-full border border-transparent bg-neutral-100 pl-11 pr-4 text-[15px] text-neutral-900 placeholder:text-neutral-500 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
            />
        </form>
    );
}

export default NavBar;