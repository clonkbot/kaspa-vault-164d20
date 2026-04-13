import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { sompiToKas, fetchBalance } from "../lib/kaspa";
import { SendModal } from "./SendModal";
import { ReceiveModal } from "./ReceiveModal";
import { TransactionList } from "./TransactionList";

interface WalletDashboardProps {
  encryptionKey: string;
}

export function WalletDashboard({ encryptionKey }: WalletDashboardProps) {
  const { signOut } = useAuthActions();
  const wallet = useQuery(api.wallets.getDefault);
  const updateBalance = useMutation(api.wallets.updateBalance);

  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch balance from network periodically
  useEffect(() => {
    if (!wallet) return;

    const refreshBalance = async () => {
      try {
        const balance = await fetchBalance(wallet.address);
        if (balance !== wallet.balance) {
          await updateBalance({ walletId: wallet._id, balance });
        }
      } catch (err) {
        console.error("Failed to refresh balance:", err);
      }
    };

    refreshBalance();
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [wallet, updateBalance]);

  const handleRefresh = async () => {
    if (!wallet || isRefreshing) return;
    setIsRefreshing(true);

    try {
      const balance = await fetchBalance(wallet.address);
      await updateBalance({ walletId: wallet._id, balance });
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (wallet === undefined) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#0a0b0d] animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 14)}...${address.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0b0d]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] flex items-center justify-center">
              <span className="text-[#0a0b0d] font-bold">K</span>
            </div>
            <div>
              <h1 className="text-white font-bold">KaspaVault</h1>
              <p className="text-gray-500 text-xs">{wallet.name}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-48 bg-[#12141a] rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleRefresh();
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className={`w-4 h-4 text-gray-500 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      signOut();
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5 transition-colors flex items-center gap-3 border-t border-gray-800"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1d24] to-[#12141a] rounded-3xl border border-gray-800/50 p-6 mb-6">
          {/* Background decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#49eacb]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#70c4ff]/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm font-medium">Total Balance</span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-500 hover:text-[#49eacb] transition-colors"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-bold text-white">
                {sompiToKas(wallet.balance)}
              </span>
              <span className="text-xl text-gray-500 ml-2">KAS</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0a0b0d]/50 rounded-xl px-3 py-2 font-mono text-xs text-gray-400 truncate">
                {truncateAddress(wallet.address)}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(wallet.address)}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => setShowSend(true)}
            className="group bg-[#12141a] hover:bg-[#1a1d24] border border-gray-800 hover:border-[#49eacb]/30 rounded-2xl p-5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#49eacb] to-[#70c4ff] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[#0a0b0d] rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-white font-semibold">Send</span>
          </button>

          <button
            onClick={() => setShowReceive(true)}
            className="group bg-[#12141a] hover:bg-[#1a1d24] border border-gray-800 hover:border-[#70c4ff]/30 rounded-2xl p-5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#70c4ff] to-[#49eacb] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-[#0a0b0d] -rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-white font-semibold">Receive</span>
          </button>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          </div>
          <TransactionList walletId={wallet._id} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-gray-800/50">
        <p className="text-center text-gray-600 text-xs">
          Requested by <span className="text-gray-500">@web-user</span> · Built by <span className="text-gray-500">@clonkbot</span>
        </p>
      </footer>

      {/* Modals */}
      {showSend && (
        <SendModal
          wallet={wallet}
          encryptionKey={encryptionKey}
          onClose={() => setShowSend(false)}
        />
      )}

      {showReceive && (
        <ReceiveModal
          address={wallet.address}
          onClose={() => setShowReceive(false)}
        />
      )}
    </div>
  );
}
