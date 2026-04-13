import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ReceiveModalProps {
  address: string;
  onClose: () => void;
}

export function ReceiveModal({ address, onClose }: ReceiveModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate QR code for the address
    QRCode.toDataURL(address, {
      width: 280,
      margin: 2,
      color: {
        dark: "#ffffff",
        light: "#12141a",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR generation failed:", err));
  }, [address]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Kaspa Address",
          text: address,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#12141a] sm:rounded-3xl rounded-t-3xl border-t sm:border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Receive KAS</h2>
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
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-[#0a0b0d] rounded-2xl p-4 border border-gray-800">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Wallet QR Code" className="w-64 h-64 sm:w-72 sm:h-72" />
                ) : (
                  <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Kaspa logo overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#12141a] rounded-xl flex items-center justify-center border border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#49eacb] to-[#70c4ff] flex items-center justify-center">
                  <span className="text-[#0a0b0d] font-bold text-lg">K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-[#0a0b0d] rounded-xl p-4 mb-6">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Your Kaspa Address</div>
            <div className="text-white font-mono text-sm break-all leading-relaxed">{address}</div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className={`py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                copied
                  ? "bg-[#49eacb] text-[#0a0b0d]"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="py-4 rounded-xl bg-gradient-to-r from-[#49eacb] to-[#70c4ff] text-[#0a0b0d] font-semibold hover:shadow-lg hover:shadow-[#49eacb]/25 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 flex items-start gap-3 text-gray-500 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Only send Kaspa (KAS) to this address. Sending other assets may result in permanent loss.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
