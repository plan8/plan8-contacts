import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query, MutationCtx } from "./_generated/server";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous, Google],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // If there's an existing user ID, return it (account linking)
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // Check if a user with this email already exists
      if (args.profile.email) {
        // Query all users to find one with matching email
        const allUsers = await ctx.db.query("users").collect();
        const existingUser = allUsers.find(user => user.email === args.profile.email);
        
        if (existingUser) {
          // Link the new account to the existing user
          return existingUser._id;
        }
      }

      // Create a new user if no existing user found
      return await ctx.db.insert("users", {
        email: args.profile.email as string,
        name: args.profile.name as string,
        image: args.profile.image as string,
      });
    },
  },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});


