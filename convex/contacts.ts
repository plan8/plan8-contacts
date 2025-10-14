import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.get(args.id);
  },
});

// Helper function to extract company from email domain
function guessCompanyFromEmail(email: string): string | undefined {
  if (!email || !email.includes('@')) return undefined;
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Skip common email providers
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com', 'protonmail.com'
  ];
  
  if (commonProviders.includes(domain)) return undefined;
  
  // Extract company name from domain
  const parts = domain.split('.');
  if (parts.length >= 2) {
    // Take the main part (before .com, .org, etc.)
    const companyPart = parts[parts.length - 2];
    // Capitalize first letter
    return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
  }
  
  return undefined;
}

export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    company: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.search) {
      // First try regular search
      const searchResults = await ctx.db
        .query("contacts")
        .withSearchIndex("search_contacts", (q) => {
          let searchQuery = q.search("firstName", args.search!);
          if (args.company) {
            searchQuery = searchQuery.eq("company", args.company);
          }
          return searchQuery;
        })
        .paginate(args.paginationOpts);

      // If we have results, return them
      if (searchResults.page.length > 0) {
        return searchResults;
      }

      // If no results, try fuzzy domain search
      const searchTerm = args.search.toLowerCase();
      if (searchTerm.length >= 2) {
        const allContacts = await ctx.db.query("contacts").collect();
        const fuzzyMatches = allContacts.filter(contact => {
          if (!contact.email) return false;
          const domain = contact.email.split('@')[1]?.toLowerCase() || '';
          const domainParts = domain.split('.');
          
          // Check if search term is contained in any part of the domain
          return domainParts.some(part => 
            part.includes(searchTerm) || searchTerm.includes(part)
          ) || domain.includes(searchTerm);
        });

        // Apply additional filters
        const filteredMatches = fuzzyMatches.filter(contact => {
          if (args.company && contact.company !== args.company) return false;
          return true;
        });

        // Simulate pagination for fuzzy results
        const startIndex = 0; // For simplicity, start from beginning
        const endIndex = Math.min(args.paginationOpts.numItems, filteredMatches.length);
        
        return {
          page: filteredMatches.slice(startIndex, endIndex),
          isDone: endIndex >= filteredMatches.length,
          continueCursor: endIndex < filteredMatches.length ? "more" : ""
        };
      }

      return searchResults;
    }

    if (args.company) {
      return await ctx.db
        .query("contacts")
        .withIndex("by_company", (q) => q.eq("company", args.company))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    if (args.createdBy) {
      return await ctx.db
        .query("contacts")
        .withIndex("by_created_by", (q) => q.eq("createdBy", args.createdBy!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("contacts")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // If no company provided but email exists, try to guess from email domain
    let company = args.company;
    if (!company && args.email) {
      const guessedCompany = guessCompanyFromEmail(args.email);
      if (guessedCompany) {
        company = guessedCompany;
      }
    }

    return await ctx.db.insert("contacts", {
      ...args,
      company,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const contact = await ctx.db.get(id);
    if (!contact) throw new Error("Contact not found");

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");

    await ctx.db.delete(args.id);
  },
});

export const batchDelete = mutation({
  args: { ids: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all contacts in a single operation
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    return args.ids.length;
  },
});

export const importFromCsv = mutation({
  args: {
    contacts: v.array(v.object({
      firstName: v.string(),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];
    for (const contact of args.contacts) {
      // Guess company from email if not provided
      let company = contact.company;
      if (!company && contact.email) {
        const guessedCompany = guessCompanyFromEmail(contact.email);
        if (guessedCompany) {
          company = guessedCompany;
        }
      }

      const id = await ctx.db.insert("contacts", {
        ...contact,
        company,
        createdBy: userId,
      });
      results.push(id);
    }
    return results;
  },
});

export const importFromLinkedIn = mutation({
  args: {
    contacts: v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      url: v.optional(v.string()),
      connectedOn: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const results = [];
    for (const contact of args.contacts) {
      let company = contact.company;
      if (!company && contact.email) {
        company = guessCompanyFromEmail(contact.email);
      }
      let notes = "";
      if (contact.url) notes += `LinkedIn: ${contact.url}`;
      if (contact.connectedOn) {
        notes += notes ? `\nConnected: ${contact.connectedOn}` : `Connected: ${contact.connectedOn}`;
      }
      const id = await ctx.db.insert("contacts", {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        company,
        notes: notes || undefined,
        createdBy: userId,
      });
      results.push(id);
    }
    return results;
  },
});

export const getCompanies = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contacts = await ctx.db.query("contacts").collect();
    const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))];
    return companies.sort();
  },
});


export const getCreatedByUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const contacts = await ctx.db.query("contacts").collect();
    const createdByIds = [...new Set(contacts.map(c => c.createdBy))];
    
    const users = await Promise.all(
      createdByIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user ? { id, name: user.name || user.email || `User ${id}` } : null;
      })
    );
    
    return users.filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name));
  },
});

// New function to suggest company based on email
export const suggestCompanyFromEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return guessCompanyFromEmail(args.email);
  },
});
