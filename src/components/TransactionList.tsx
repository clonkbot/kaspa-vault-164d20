import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { sompiToKas } from "../lib/kaspa";

interface Transaction {
  _id: string;
  type: "send" | "receive";
  status: "pending" | "confirmed" | "failed";
  amount: number;
  toAddress: string;
  fromAddress: string;
  timestamp: number;
}

interface TransactionListProps {
  walletId: Id<"wallets">;
}

export function TransactionList({ walletId }: TransactionListProps) {
  const transactions = useQuery(api.transactions.listByWallet, { walletId });

  if (transactions === undefined) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#12141a] rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800/50 mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No transactions yet</p>
        <p className="text-gray-600 text-xs mt-1">Your transaction history will appear here</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-2">
      {(transactions as Transaction[]).map((tx) => (
        <div
          key={tx._id}
          className="bg-[#12141a] rounded-xl p-4 border border-gray-800/50 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === "send"
                    ? "bg-red-500/10"
                    : "bg-[#49eacb]/10"
                }`}
              >
                {tx.type === "send" ? (
                  <svg className="w-5 h-5 text-red-400 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#49eacb] -rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {tx.type === "send" ? "Sent" : "Received"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === "confirmed"
                        ? "bg-[#49eacb]/10 text-[#49eacb]"
                        : tx.status === "pending"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {tx.type === "send" ? "To: " : "From: "}
                  <span className="font-mono">
                    {truncateAddress(tx.type === "send" ? tx.toAddress : tx.fromAddress)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-bold ${
                  tx.type === "send" ? "text-red-400" : "text-[#49eacb]"
                }`}
              >
                {tx.type === "send" ? "-" : "+"}
                {sompiToKas(tx.amount)} KAS
              </div>
              <div className="text-gray-600 text-xs">{formatTime(tx.timestamp)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
