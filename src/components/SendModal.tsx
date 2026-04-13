import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  isValidKaspaAddress,
  sompiToKas,
  kasToSompi,
  decryptData,
  createTransaction,
  submitTransaction,
} from "../lib/kaspa";
import { QRScanner } from "./QRScanner";

interface SendModalProps {
  wallet: {
    _id: Id<"wallets">;
    address: string;
    balance: number;
    encryptedPrivateKey: string;
  };
  encryptionKey: string;
  onClose: () => void;
}

export function SendModal({ wallet, encryptionKey, onClose }: SendModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "sending" | "success" | "error">("form");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const recordTransaction = useMutation(api.transactions.record);
  const updateBalance = useMutation(api.wallets.updateBalance);

  const fee = 1000; // 0.00001 KAS
  const amountSompi = kasToSompi(amount || "0");
  const totalSompi = amountSompi + fee;

  const handleScan = (address: string) => {
    setRecipient(address);
    setShowScanner(false);
  };

  const validateForm = (): boolean => {
    if (!recipient.trim()) {
      setError("Please enter a recipient address");
      return false;
    }

    if (!isValidKaspaAddress(recipient.trim())) {
      setError("Invalid Kaspa address");
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (totalSompi > wallet.balance) {
      setError("Insufficient balance");
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    setError("");
    if (validateForm()) {
      setStep("confirm");
    }
  };

  const handleSend = async () => {
    setStep("sending");
    setError("");

    try {
      // Decrypt private key
      const privateKey = decryptData(wallet.encryptedPrivateKey, encryptionKey);

      // Create and sign transaction
      const tx = await createTransaction(
        wallet.address,
        recipient.trim(),
        amountSompi,
        privateKey
      );

      if (!tx) {
        throw new Error("Failed to create transaction");
      }

      // Submit transaction to network
      const submittedTxId = await submitTransaction(tx.txHex);

      // Use the submitted txId or fallback to local txId
      const finalTxHash = submittedTxId || tx.txId;
      setTxHash(finalTxHash);

      // Record transaction in database
      await recordTransaction({
        walletId: wallet._id,
        txHash: finalTxHash,
        type: "send",
        amount: amountSompi,
        toAddress: recipient.trim(),
        fromAddress: wallet.address,
        fee,
      });

      // Update local balance (optimistic)
      await updateBalance({
        walletId: wallet._id,
        balance: wallet.balance - totalSompi,
      });

      setStep("success");
    } catch (err) {
      console.error("Transaction failed:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  };

  const handleSetMax = () => {
    const maxAmount = Math.max(0, wallet.balance - fee);
    setAmount(sompiToKas(maxAmount));
  };

  if (showScanner) {
    return <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#12141a] sm:rounded-3xl rounded-t-3xl border-t sm:border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#12141a] p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Send KAS</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === "form" && (
            <>
              {/* Balance */}
              <div className="bg-[#0a0b0d] rounded-xl p-4 mb-6">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Available Balance</div>
                <div className="text-white text-2xl font-bold">{sompiToKas(wallet.balance)} KAS</div>
              </div>

              {/* Recipient */}
              <div className="mb-4">
                <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
                  Recipient Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-4 pr-14 text-white placeholder-gray-600 focus:outline-none focus:border-[#49eacb]/50 focus:ring-2 focus:ring-[#49eacb]/20 transition-all font-mono text-sm"
                    placeholder="kaspa:q..."
                  />
                  <button
                    onClick={() => setShowScanner(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#49eacb]/10 flex items-center justify-center hover:bg-[#49eacb]/20 transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#49eacb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                    Amount
                  </label>
                  <button
                    onClick={handleSetMax}
                    className="text-[#49eacb] text-xs font-medium hover:text-[#70c4ff] transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.00000001"
                    min="0"
                    className="w-full bg-[#0a0b0d] border border-gray-800 rounded-xl px-4 py-4 pr-16 text-white text-xl font-bold placeholder-gray-600 focus:outline-none focus:border-[#49eacb]/50 focus:ring-2 focus:ring-[#49eacb]/20 transition-all"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    KAS
                  </span>
                </div>
              </div>

              {/* Fee info */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <span>Network Fee</span>
                <span>{sompiToKas(fee)} KAS</span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
                  {error}
                </div>
              )}

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all"
              >
                Continue
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#49eacb]/10 mb-4">
                  <svg className="w-8 h-8 text-[#49eacb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Confirm Transaction</h3>
                <p className="text-gray-500">Review the details below</p>
              </div>

              <div className="bg-[#0a0b0d] rounded-xl p-4 space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-white font-bold">{amount} KAS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Network Fee</span>
                  <span className="text-white">{sompiToKas(fee)} KAS</span>
                </div>
                <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="text-[#49eacb] font-bold text-lg">{sompiToKas(totalSompi)} KAS</span>
                </div>
              </div>

              <div className="bg-[#0a0b0d] rounded-xl p-4 mb-6">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Sending To</div>
                <div className="text-white font-mono text-sm break-all">{recipient}</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-4 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-bold hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all"
                >
                  Confirm Send
                </button>
              </div>
            </>
          )}

          {step === "sending" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#49eacb]/10 mb-6">
                <svg className="w-10 h-10 text-[#49eacb] animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sending Transaction</h3>
              <p className="text-gray-500">Please wait while we broadcast your transaction...</p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#49eacb]/10 mb-6">
                <svg className="w-10 h-10 text-[#49eacb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Sent!</h3>
              <p className="text-gray-500 mb-6">Your KAS is on its way</p>

              <div className="bg-[#0a0b0d] rounded-xl p-4 mb-6">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Transaction ID</div>
                <div className="text-[#49eacb] font-mono text-xs break-all">{txHash}</div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-bold hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction Failed</h3>
              <p className="text-gray-500 mb-4">{error || "Something went wrong"}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-4 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-xl bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
