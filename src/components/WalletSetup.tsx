import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  generateWallet,
  importFromMnemonic,
  encryptData,
} from "../lib/kaspa";

interface WalletSetupProps {
  onComplete: () => void;
  encryptionKey: string;
}

export function WalletSetup({ onComplete, encryptionKey }: WalletSetupProps) {
  const [mode, setMode] = useState<"choose" | "create" | "import">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState("");
  const [walletName, setWalletName] = useState("My Kaspa Wallet");
  const [createdWallet, setCreatedWallet] = useState<{
    mnemonic: string;
    address: string;
  } | null>(null);

  const createWalletMutation = useMutation(api.wallets.create);

  const handleCreateWallet = async () => {
    setLoading(true);
    setError("");

    try {
      const wallet = await generateWallet();
      setCreatedWallet({
        mnemonic: wallet.mnemonic,
        address: wallet.address,
      });
      setMnemonic(wallet.mnemonic);

      // Save wallet to database
      await createWalletMutation({
        name: walletName,
        address: wallet.address,
        encryptedPrivateKey: encryptData(wallet.privateKey, encryptionKey),
        encryptedMnemonic: encryptData(wallet.mnemonic, encryptionKey),
      });

      setMode("create");
    } catch (err) {
      setError("Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    setLoading(true);
    setError("");

    try {
      const cleanMnemonic = importMnemonic.trim().toLowerCase();
      const wallet = await importFromMnemonic(cleanMnemonic);

      if (!wallet) {
        setError("Invalid mnemonic phrase");
        setLoading(false);
        return;
      }

      // Save wallet to database
      await createWalletMutation({
        name: walletName,
        address: wallet.address,
        encryptedPrivateKey: encryptData(wallet.privateKey, encryptionKey),
        encryptedMnemonic: encryptData(cleanMnemonic, encryptionKey),
      });

      onComplete();
    } catch (err) {
      setError("Failed to import wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBackup = () => {
    onComplete();
  };

  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-4">
              <svg className="w-8 h-8 text-[#0a0b0d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Set Up Your Wallet</h1>
            <p className="text-gray-500">Create a new wallet or import an existing one</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setMode("create");
                handleCreateWallet();
              }}
              className="w-full bg-[#12141a] border border-gray-800 hover:border-[#49eacb]/50 rounded-2xl p-6 text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#49eacb]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#49eacb]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#49eacb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Create New Wallet</h3>
                  <p className="text-gray-500 text-sm">Generate a fresh wallet with a new recovery phrase</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("import")}
              className="w-full bg-[#12141a] border border-gray-800 hover:border-[#70c4ff]/50 rounded-2xl p-6 text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#70c4ff]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#70c4ff]/20 transition-colors">
                  <svg className="w-6 h-6 text-[#70c4ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Import Existing Wallet</h3>
                  <p className="text-gray-500 text-sm">Restore using your 12 or 24 word recovery phrase</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create" && createdWallet) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-4">
              <svg className="w-8 h-8 text-[#0a0b0d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Backup Your Recovery Phrase</h1>
            <p className="text-gray-500">Write down these 12 words in order and keep them safe</p>
          </div>

          <div className="bg-[#12141a] rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Recovery Phrase</span>
              <button
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="text-[#49eacb] text-sm font-medium hover:text-[#70c4ff] transition-colors"
              >
                {showMnemonic ? "Hide" : "Reveal"}
              </button>
            </div>

            <div className={`grid grid-cols-3 gap-2 ${!showMnemonic ? "blur-md select-none" : ""}`}>
              {mnemonic.split(" ").map((word, index) => (
                <div
                  key={index}
                  className="bg-[#0a0b0d] rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-gray-600 text-xs font-mono">{index + 1}.</span>
                  <span className="text-white font-medium">{word}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigator.clipboard.writeText(mnemonic)}
              className="mt-4 w-full py-2 text-[#49eacb] text-sm font-medium hover:bg-[#49eacb]/10 rounded-lg transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-amber-400 text-sm font-medium mb-1">Important Security Notice</p>
                <p className="text-amber-400/70 text-xs">
                  Never share your recovery phrase with anyone. Anyone with these words can access your funds. Store it securely offline.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmBackup}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all"
          >
            I've Saved My Recovery Phrase
          </button>
        </div>
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <button
            onClick={() => setMode("choose")}
            className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#70c4ff] to-[#49eacb] mb-4">
              <svg className="w-8 h-8 text-[#0a0b0d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Import Wallet</h1>
            <p className="text-gray-500">Enter your 12 or 24 word recovery phrase</p>
          </div>

          <div className="bg-[#12141a] rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="mb-4">
              <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Wallet Name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#70c4ff]/50 focus:ring-2 focus:ring-[#70c4ff]/20 transition-all"
                placeholder="My Kaspa Wallet"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                Recovery Phrase
              </label>
              <textarea
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#70c4ff]/50 focus:ring-2 focus:ring-[#70c4ff]/20 transition-all resize-none font-mono text-sm"
                placeholder="Enter your 12 or 24 word recovery phrase..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleImportWallet}
            disabled={loading || !importMnemonic.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#70c4ff] to-[#49eacb] text-[#0a0b0d] font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[#70c4ff]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Importing...
              </span>
            ) : (
              "Import Wallet"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Loading state while creating wallet
  return (
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] mb-4 animate-pulse">
          <svg className="w-8 h-8 text-[#0a0b0d] animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-white font-medium">Creating your wallet...</p>
        <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
      </div>
    </div>
  );
}
