import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Called storeUser without authentication");

    const userName =
      identity.name || identity.email?.split("@")[0] || "Anonymous";

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user) {
      if (user.name !== userName) {
        await ctx.db.patch(user._id, { name: userName });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: userName,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? identity.claims?.email ?? null,
      imageUrl: identity.pictureUrl || null,
    });
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) throw new Error("User not found");
    return user;
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];

    const currentUser = await ctx.auth.getUserIdentity();
    if (!currentUser) return [];

    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();

    return users
      .filter((u) => u.tokenIdentifier !== currentUser.tokenIdentifier)
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        imageUrl: u.imageUrl,
      }));
  },
});
