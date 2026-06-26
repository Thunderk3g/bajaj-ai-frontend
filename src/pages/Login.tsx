import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticate } from "@/lib/auth";
import { BajajMark } from "@/icons";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (authenticate(username, password)) {
      navigate("/");
    } else {
      setError("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand/5 via-white to-brand/5 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-white p-8 shadow-lg">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <BajajMark width={48} height={48} />
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-navy mb-2">
            Bajaj AI Platform
          </h1>
          <p className="text-center text-sm text-ink-muted mb-8">
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-down-soft px-3 py-2 text-sm text-down-text">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-navy mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:shadow-focus"
                placeholder="Enter your username"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:shadow-focus"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-hover disabled:opacity-50 disabled:pointer-events-none active:translate-y-px"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Demo credentials: <br />
            <span className="font-mono text-ink-subtle">ai.bajajmarketing</span>
          </p>
        </div>
      </div>
    </div>
  );
}
