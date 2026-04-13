import { useState, useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { AuthScreen } from "./components/AuthScreen";
import { WalletSetup } from "./components/WalletSetup";
import { WalletDashboard } from "./components/WalletDashboard";

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const wallets = useQuery(api.wallets.list);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  // Generate encryption key from session
  useEffect(() => {
    if (isAuthenticated) {
      // Use a simple key derivation for demo
      // In production, derive from user password or use Web Crypto API
      const key = `kaspa-vault-${Date.now()}-${Math.random().toString(36)}`;
      setEncryptionKey(key);
    }
  }, [isAuthenticated]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-6 animate-pulse">
            <span className="text-[#0a0b0d] font-bold text-3xl">K</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading KaspaVault...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Wallets loading
  if (wallets === undefined) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-4 animate-pulse">
            <svg className="w-8 h-8 text-[#0a0b0d] animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-gray-500">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // No wallets - show setup
  if (wallets.length === 0 || showSetup) {
    return (
      <WalletSetup
        encryptionKey={encryptionKey}
        onComplete={() => setShowSetup(false)}
      />
    );
  }

  // Show dashboard
  return <WalletDashboard encryptionKey={encryptionKey} />;
}

export default App;
