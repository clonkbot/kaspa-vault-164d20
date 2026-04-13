import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get transactions for a wallet
export const listByWallet = query({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId))
      .order("desc")
      .take(50);
  },
});

// Get all transactions for user
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

// Record a new transaction
export const record = mutation({
  args: {
    walletId: v.id("wallets"),
    txHash: v.string(),
    type: v.union(v.literal("send"), v.literal("receive")),
    amount: v.number(),
    toAddress: v.string(),
    fromAddress: v.string(),
    fee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    return await ctx.db.insert("transactions", {
      userId,
      walletId: args.walletId,
      txHash: args.txHash,
      type: args.type,
      amount: args.amount,
      toAddress: args.toAddress,
      fromAddress: args.fromAddress,
      status: "pending",
      timestamp: Date.now(),
      fee: args.fee,
    });
  },
});

// Update transaction status
export const updateStatus = mutation({
  args: {
    txHash: v.string(),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_hash", (q) => q.eq("txHash", args.txHash))
      .first();

    if (!tx || tx.userId !== userId) {
      throw new Error("Transaction not found");
    }

    await ctx.db.patch(tx._id, { status: args.status });
  },
});

// Queue a pending transaction for processing
export const queueSend = mutation({
  args: {
    walletId: v.id("wallets"),
    toAddress: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    return await ctx.db.insert("pendingTxQueue", {
      userId,
      walletId: args.walletId,
      toAddress: args.toAddress,
      amount: args.amount,
      status: "queued",
      createdAt: Date.now(),
    });
  },
});

// Get pending transactions
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("pendingTxQueue")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

// Update pending transaction
export const updatePending = mutation({
  args: {
    pendingId: v.id("pendingTxQueue"),
    status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    txHash: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pending = await ctx.db.get(args.pendingId);
    if (!pending || pending.userId !== userId) {
      throw new Error("Pending transaction not found");
    }

    await ctx.db.patch(args.pendingId, {
      status: args.status,
      txHash: args.txHash,
      errorMessage: args.errorMessage,
    });
  },
});
