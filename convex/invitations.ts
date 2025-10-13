import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    // Get party details for each invitation
    const invitationsWithParties = await Promise.all(
      invitations.map(async (invitation) => {
        const party = await ctx.db.get(invitation.partyId);
        return {
          ...invitation,
          party,
        };
      })
    );

    return invitationsWithParties;
  },
});

export const create = mutation({
  args: {
    partyId: v.id("parties"),
    contactId: v.id("contacts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if invitation already exists
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_party_and_contact", (q) => 
        q.eq("partyId", args.partyId).eq("contactId", args.contactId)
      )
      .unique();

    if (existing) {
      throw new Error("Contact already invited to this party");
    }

    return await ctx.db.insert("invitations", {
      ...args,
      invitedBy: userId,
      status: "pending",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invitations"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitation = await ctx.db.get(args.id);
    if (!invitation) throw new Error("Invitation not found");

    const updates: any = {
      status: args.status,
    };

    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }

    if (args.status === "sent" && !invitation.sentAt) {
      updates.sentAt = Date.now();
    }

    if (["accepted", "declined", "maybe"].includes(args.status) && !invitation.respondedAt) {
      updates.respondedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("invitations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitation = await ctx.db.get(args.id);
    if (!invitation) throw new Error("Invitation not found");

    await ctx.db.delete(args.id);
  },
});

export const batchUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("invitations")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update all invitations in a single operation
    const updates: any = { status: args.status };
    
    if (args.status === "sent") {
      updates.sentAt = Date.now();
    }
    
    if (["accepted", "declined", "maybe", "attended"].includes(args.status)) {
      updates.respondedAt = Date.now();
    }

    await Promise.all(args.ids.map(id => ctx.db.patch(id, updates)));
    return args.ids.length;
  },
});

export const batchDelete = mutation({
  args: { ids: v.array(v.id("invitations")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all invitations in a single operation
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    return args.ids.length;
  },
});

export const bulkInvite = mutation({
  args: {
    partyId: v.id("parties"),
    contactIds: v.array(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];
    for (const contactId of args.contactIds) {
      // Check if invitation already exists
      const existing = await ctx.db
        .query("invitations")
        .withIndex("by_party_and_contact", (q) => 
          q.eq("partyId", args.partyId).eq("contactId", contactId)
        )
        .unique();

      if (!existing) {
        const id = await ctx.db.insert("invitations", {
          partyId: args.partyId,
          contactId,
          invitedBy: userId,
          status: "pending",
        });
        results.push(id);
      }
    }
    return results;
  },
});
