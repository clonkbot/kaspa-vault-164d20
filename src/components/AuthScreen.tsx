import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("flow", flow);
      await signIn("password", formData);
    } catch (err) {
      setError(flow === "signIn" ? "Invalid credentials" : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#49eacb]/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#70c4ff]/10 rounded-full blur-[128px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#49eacb]/5 rounded-full animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#70c4ff]/5 rounded-full animate-spin-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-4 shadow-lg shadow-[#49eacb]/20">
            <svg className="w-10 h-10 text-[#0a0b0d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Kaspa<span className="text-[#49eacb]">Vault</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm tracking-wide uppercase">
            Secure Kaspa Wallet
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#12141a] rounded-3xl border border-gray-800/50 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex mb-8 bg-[#0a0b0d] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setFlow("signIn")}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                flow === "signIn"
                  ? "bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setFlow("signUp")}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                flow === "signUp"
                  ? "bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#49eacb]/50 focus:ring-2 focus:ring-[#49eacb]/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#49eacb]/50 focus:ring-2 focus:ring-[#49eacb]/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : flow === "signIn" ? (
                "Sign In to Wallet"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => signIn("anonymous")}
              className="text-gray-500 hover:text-[#49eacb] text-sm transition-colors"
            >
              Continue as Guest →
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>End-to-end encrypted • Non-custodial</span>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 60s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 90s linear infinite; }
      `}</style>
    </div>
  );
}
