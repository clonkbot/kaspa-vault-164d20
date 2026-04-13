import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Kaspa wallets - each user can have multiple wallets
  wallets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    encryptedPrivateKey: v.string(), // Encrypted with user's password
    encryptedMnemonic: v.optional(v.string()), // For imported/created wallets
    balance: v.number(), // In sompi (smallest Kaspa unit)
    createdAt: v.number(),
    isDefault: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_address", ["address"]),

  // Transaction history
  transactions: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    txHash: v.string(),
    type: v.union(v.literal("send"), v.literal("receive")),
    amount: v.number(), // In sompi
    toAddress: v.string(),
    fromAddress: v.string(),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("failed")),
    timestamp: v.number(),
    fee: v.optional(v.number()),
  })
    .index("by_wallet", ["walletId"])
    .index("by_user", ["userId"])
    .index("by_hash", ["txHash"]),

  // Pending transactions queue
  pendingTxQueue: defineTable({
    userId: v.id("users"),
    walletId: v.id("wallets"),
    toAddress: v.string(),
    amount: v.number(),
    status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    txHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
