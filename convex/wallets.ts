import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all wallets for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get the default wallet
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return wallets.find((w) => w.isDefault) || wallets[0] || null;
  },
});

// Create a new wallet
export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    encryptedPrivateKey: v.string(),
    encryptedMnemonic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if this is the first wallet
    const existingWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const isDefault = existingWallets.length === 0;

    return await ctx.db.insert("wallets", {
      userId,
      name: args.name,
      address: args.address,
      encryptedPrivateKey: args.encryptedPrivateKey,
      encryptedMnemonic: args.encryptedMnemonic,
      balance: 0,
      createdAt: Date.now(),
      isDefault,
    });
  },
});

// Update wallet balance
export const updateBalance = mutation({
  args: {
    walletId: v.id("wallets"),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    await ctx.db.patch(args.walletId, { balance: args.balance });
  },
});

// Set default wallet
export const setDefault = mutation({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    // Remove default from all other wallets
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const w of wallets) {
      if (w._id !== args.walletId && w.isDefault) {
        await ctx.db.patch(w._id, { isDefault: false });
      }
    }

    await ctx.db.patch(args.walletId, { isDefault: true });
  },
});

// Delete wallet
export const remove = mutation({
  args: { walletId: v.id("wallets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wallet = await ctx.db.get(args.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new Error("Wallet not found");
    }

    await ctx.db.delete(args.walletId);
  },
});
