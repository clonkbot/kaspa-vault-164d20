import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (address: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState("");
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (mounted) {
              // Extract Kaspa address from QR code
              let address = decodedText;

              // Handle kaspa: URI scheme
              if (decodedText.startsWith("kaspa:")) {
                address = decodedText;
              }

              onScan(address);
              scanner.stop();
            }
          },
          () => {
            // QR code scan error - ignore, keep scanning
          }
        );

        if (mounted) {
          setCameraPermission("granted");
        }
      } catch (err) {
        if (mounted) {
          setCameraPermission("denied");
          setError("Camera access denied. Please enable camera permissions.");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative bg-[#12141a] rounded-2xl overflow-hidden aspect-square"
        >
          <div id="qr-reader" className="w-full h-full" />

          {cameraPermission === "pending" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-[#49eacb] mx-auto mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-400">Requesting camera access...</p>
              </div>
            </div>
          )}

          {cameraPermission === "denied" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#12141a]">
              <div className="text-center px-6">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-red-400 font-medium mb-2">Camera Access Denied</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Scanning overlay */}
          {cameraPermission === "granted" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#49eacb] rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#49eacb] rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#49eacb] rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#49eacb] rounded-br-lg" />
                  {/* Scanning line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#49eacb] to-transparent animate-scan" />
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          Position the QR code within the frame to scan
        </p>

        <button
          onClick={onClose}
          className="w-full mt-6 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        #qr-reader video {
          border-radius: 16px;
          object-fit: cover;
        }
        #qr-reader__scan_region {
          display: none !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
