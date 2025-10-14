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

export const getByParty = query({
  args: { 
    partyId: v.id("parties"),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let invitations = await ctx.db
      .query("invitations")
      .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      invitations = invitations.filter(invitation => invitation.status === args.status);
    }

    // Get contact details for each invitation
    const invitationsWithContacts = await Promise.all(
      invitations.map(async (invitation) => {
        const contact = await ctx.db.get(invitation.contactId);
        return {
          ...invitation,
          contact,
        };
      })
    );

    // Filter by search term if provided
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      return invitationsWithContacts.filter(invitation => {
        if (!invitation.contact) return false;
        
        const fullName = `${invitation.contact.firstName} ${invitation.contact.lastName}`.toLowerCase();
        const email = invitation.contact.email?.toLowerCase() || '';
        const company = invitation.contact.company?.toLowerCase() || '';
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               company.includes(searchTerm);
      });
    }

    return invitationsWithContacts;
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

// Public mutation for attendance registration (no auth required)
export const publicAttend = mutation({
  args: {
    partyId: v.id("parties"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, check if the party exists
    const party = await ctx.db.get(args.partyId);
    if (!party) {
      throw new Error("Party not found");
    }

    // Check if contact already exists with this email
    let contactId;
    if (args.email) {
      const existingContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      
      if (existingContact) {
        contactId = existingContact._id;
      }
    }

    // If no existing contact, create a new one
    if (!contactId) {
      contactId = await ctx.db.insert("contacts", {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        createdBy: party.createdBy, // Use the party creator as the contact creator
      });
    }

    // Check if invitation already exists
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_party_and_contact", (q) => 
        q.eq("partyId", args.partyId).eq("contactId", contactId)
      )
      .first();

    if (existingInvitation) {
      // Update existing invitation to "attended" status
      await ctx.db.patch(existingInvitation._id, {
        status: "attended",
        respondedAt: Date.now(),
      });
      return { success: true, message: "Attendance updated successfully" };
    } else {
      // Create new invitation with "attended" status
      await ctx.db.insert("invitations", {
        partyId: args.partyId,
        contactId: contactId,
        invitedBy: party.createdBy,
        status: "attended",
        respondedAt: Date.now(),
      });
      return { success: true, message: "Attendance registered successfully" };
    }
  },
});
