import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("parties")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("parties", {
      ...args,
      createdBy: userId,
      status: args.status || "planning",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("parties"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const party = await ctx.db.get(id);
    if (!party) throw new Error("Party not found");
    if (party.createdBy !== userId) throw new Error("Not authorized");

    await ctx.db.patch(id, updates);
  },
});

export const batchUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("parties")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update all parties in a single operation
    await Promise.all(args.ids.map(id => ctx.db.patch(id, { status: args.status })));
    return args.ids.length;
  },
});

export const getWithInvitations = query({
  args: { partyId: v.id("parties") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const party = await ctx.db.get(args.partyId);
    if (!party) throw new Error("Party not found");

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
      .collect();

    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const contact = await ctx.db.get(invitation.contactId);
        const invitedBy = await ctx.db.get(invitation.invitedBy);
        return {
          ...invitation,
          contact,
          invitedBy,
        };
      })
    );

    return {
      party,
      invitations: invitationsWithDetails,
    };
  },
});

// Public query to get party information (no auth required)
export const getPublic = query({
  args: { partyId: v.id("parties") },
  handler: async (ctx, args) => {
    const party = await ctx.db.get(args.partyId);
    if (!party) throw new Error("Party not found");
    
    return {
      _id: party._id,
      name: party.name,
      description: party.description,
      date: party.date,
      location: party.location,
      status: party.status,
    };
  },
});
