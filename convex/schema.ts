import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  contacts: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    source: v.string(), // "manual", "csv", "hubspot", "linkedin"
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_email", ["email"])
    .index("by_company", ["company"])
    .index("by_created_by", ["createdBy"])
    .searchIndex("search_contacts", {
      searchField: "firstName",
      filterFields: ["company", "source"],
    }),

  parties: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    location: v.optional(v.string()),
    createdBy: v.id("users"),
    status: v.string(), // "planning", "active", "completed", "cancelled"
  })
    .index("by_created_by", ["createdBy"])
    .index("by_status", ["status"]),

  invitations: defineTable({
    partyId: v.id("parties"),
    contactId: v.id("contacts"),
    invitedBy: v.id("users"),
    status: v.string(), // "pending", "sent", "accepted", "declined", "maybe", "attended"
    sentAt: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_party", ["partyId"])
    .index("by_contact", ["contactId"])
    .index("by_invited_by", ["invitedBy"])
    .index("by_party_and_contact", ["partyId", "contactId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
