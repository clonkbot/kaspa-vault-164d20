import * as bip39 from "bip39";

// Kaspa address prefix
const KASPA_ADDRESS_PREFIX = "kaspa:";

// Simple hash function for demo purposes
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(40, '0');
}

// Convert bytes to hex
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex to bytes
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Generate a Kaspa address from seed bytes
function seedToAddress(seed: Uint8Array): string {
  const hash = simpleHash(bytesToHex(seed.slice(0, 32)));
  return `${KASPA_ADDRESS_PREFIX}q${hash.slice(0, 40)}`;
}

// Generate a new Kaspa wallet
export async function generateWallet(): Promise<{
  mnemonic: string;
  address: string;
  privateKey: string;
  publicKey: string;
}> {
  // Generate 12-word mnemonic
  const mnemonic = bip39.generateMnemonic(128);

  // Derive seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Use first 32 bytes of seed as private key
  const privateKeyBytes = new Uint8Array(seed.slice(0, 32));
  const privateKey = bytesToHex(privateKeyBytes);

  // Simple public key derivation (demo only - not cryptographically secure)
  const publicKeyBytes = new Uint8Array(33);
  publicKeyBytes[0] = 0x02;
  for (let i = 0; i < 32; i++) {
    publicKeyBytes[i + 1] = (privateKeyBytes[i] + 1) % 256;
  }
  const publicKey = bytesToHex(publicKeyBytes);

  // Generate Kaspa address
  const address = seedToAddress(privateKeyBytes);

  return {
    mnemonic,
    address,
    privateKey,
    publicKey,
  };
}

// Import wallet from mnemonic
export async function importFromMnemonic(mnemonic: string): Promise<{
  address: string;
  privateKey: string;
  publicKey: string;
} | null> {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    return null;
  }

  // Derive seed from mnemonic
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Use first 32 bytes of seed as private key
  const privateKeyBytes = new Uint8Array(seed.slice(0, 32));
  const privateKey = bytesToHex(privateKeyBytes);

  // Simple public key derivation
  const publicKeyBytes = new Uint8Array(33);
  publicKeyBytes[0] = 0x02;
  for (let i = 0; i < 32; i++) {
    publicKeyBytes[i + 1] = (privateKeyBytes[i] + 1) % 256;
  }
  const publicKey = bytesToHex(publicKeyBytes);

  // Generate Kaspa address
  const address = seedToAddress(privateKeyBytes);

  return {
    address,
    privateKey,
    publicKey,
  };
}

// Import wallet from private key
export function importFromPrivateKey(privateKey: string): {
  address: string;
  publicKey: string;
} | null {
  try {
    const privateKeyBytes = hexToBytes(privateKey);

    // Simple public key derivation
    const publicKeyBytes = new Uint8Array(33);
    publicKeyBytes[0] = 0x02;
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i + 1] = (privateKeyBytes[i] + 1) % 256;
    }
    const publicKey = bytesToHex(publicKeyBytes);
    const address = seedToAddress(privateKeyBytes);

    return {
      address,
      publicKey,
    };
  } catch {
    return null;
  }
}

// Validate Kaspa address
export function isValidKaspaAddress(address: string): boolean {
  if (!address.startsWith(KASPA_ADDRESS_PREFIX)) {
    return false;
  }

  const addressPart = address.slice(KASPA_ADDRESS_PREFIX.length);

  // Basic validation - should start with q, p, or s
  if (!["q", "p", "s"].includes(addressPart[0])) {
    return false;
  }

  // Check length (roughly 40+ characters for the address part)
  if (addressPart.length < 40 || addressPart.length > 65) {
    return false;
  }

  return true;
}

// Format sompi to KAS
export function sompiToKas(sompi: number): string {
  const kas = sompi / 100000000;
  return kas.toFixed(8).replace(/\.?0+$/, "") || "0";
}

// Parse KAS to sompi
export function kasToSompi(kas: string | number): number {
  const kasNum = typeof kas === "string" ? parseFloat(kas) : kas;
  return Math.floor(kasNum * 100000000);
}

// Simple XOR encryption for demo purposes
// In production, use proper encryption with Web Crypto API
export function encryptData(data: string, password: string): string {
  const dataBytes = new TextEncoder().encode(data);
  const keyBytes = new TextEncoder().encode(password);
  const encrypted = new Uint8Array(dataBytes.length);

  for (let i = 0; i < dataBytes.length; i++) {
    encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return bytesToHex(encrypted);
}

// Simple decryption
export function decryptData(encrypted: string, password: string): string {
  const encryptedBytes = hexToBytes(encrypted);
  const keyBytes = new TextEncoder().encode(password);
  const decrypted = new Uint8Array(encryptedBytes.length);

  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return new TextDecoder().decode(decrypted);
}

// Kaspa API endpoints (mainnet)
const KASPA_API_BASE = "https://api.kaspa.org";

// Fetch wallet balance from Kaspa network
export async function fetchBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${KASPA_API_BASE}/addresses/${address}/balance`);
    if (!response.ok) throw new Error("Failed to fetch balance");
    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return 0;
  }
}

// Fetch UTXOs for an address
export async function fetchUtxos(address: string): Promise<Array<{
  transactionId: string;
  index: number;
  amount: number;
  scriptPublicKey: string;
}>> {
  try {
    const response = await fetch(`${KASPA_API_BASE}/addresses/${address}/utxos`);
    if (!response.ok) throw new Error("Failed to fetch UTXOs");
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch UTXOs:", error);
    return [];
  }
}

// Create and sign a transaction
export async function createTransaction(
  fromAddress: string,
  toAddress: string,
  amountSompi: number,
  privateKey: string
): Promise<{ txHex: string; txId: string } | null> {
  try {
    // Fetch UTXOs
    const utxos = await fetchUtxos(fromAddress);

    if (utxos.length === 0) {
      throw new Error("No UTXOs available");
    }

    // Calculate total available
    const totalAvailable = utxos.reduce((sum, utxo) => sum + utxo.amount, 0);

    // Standard fee (1000 sompi ~ 0.00001 KAS)
    const fee = 1000;

    if (totalAvailable < amountSompi + fee) {
      throw new Error("Insufficient funds");
    }

    // Create transaction structure
    const tx = {
      inputs: utxos.slice(0, 10).map((utxo) => ({
        previousOutpoint: {
          transactionId: utxo.transactionId,
          index: utxo.index,
        },
        signatureScript: "",
        sequence: 0,
      })),
      outputs: [
        {
          amount: amountSompi,
          scriptPublicKey: toAddress,
        },
      ],
      lockTime: 0,
      subnetworkId: "0000000000000000000000000000000000000000",
    };

    // Calculate change
    const inputTotal = utxos.slice(0, 10).reduce((sum, utxo) => sum + utxo.amount, 0);
    const change = inputTotal - amountSompi - fee;

    if (change > 0) {
      tx.outputs.push({
        amount: change,
        scriptPublicKey: fromAddress,
      });
    }

    // Sign the transaction (simplified - demo only)
    const txJson = JSON.stringify(tx);
    const signatureHex = simpleHash(txJson + privateKey);

    tx.inputs.forEach((input) => {
      input.signatureScript = signatureHex;
    });

    const txHex = JSON.stringify(tx);
    const txId = simpleHash(txHex);

    return { txHex, txId };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return null;
  }
}

// Submit transaction to the network
export async function submitTransaction(txHex: string): Promise<string | null> {
  try {
    const response = await fetch(`${KASPA_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: txHex }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return data.transactionId || null;
  } catch (error) {
    console.error("Failed to submit transaction:", error);
    return null;
  }
}

// Get transaction details
export async function getTransaction(txId: string): Promise<{
  txId: string;
  confirmations: number;
  status: "pending" | "confirmed" | "failed";
} | null> {
  try {
    const response = await fetch(`${KASPA_API_BASE}/transactions/${txId}`);
    if (!response.ok) throw new Error("Failed to fetch transaction");
    const data = await response.json();

    return {
      txId: data.transactionId,
      confirmations: data.confirmations || 0,
      status: data.confirmations > 0 ? "confirmed" : "pending",
    };
  } catch (error) {
    console.error("Failed to fetch transaction:", error);
    return null;
  }
}
