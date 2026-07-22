/**
 * Demo 09: Error Handling & Custom Errors
 * ----------------------------------------
 * Learn how GraphQL handles errors and how to create custom error types.
 *
 * Concepts:
 *   - GraphQL's built-in error format
 *   - GraphQLError with custom extensions
 *   - Error codes and classifications
 *   - Union types for typed error handling
 *   - formatError for error masking in production
 *
 * Run:  npm run demo:09
 * Then open http://localhost:4009
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  # --- Union-based error handling (recommended pattern) ---
  type NotFoundError {
    message: String!
    resourceId: ID!
  }

  type UnauthorizedError {
    message: String!
    requiredRole: String!
  }

  # Union type: the result is either a User or an error
  union UserResult = User | NotFoundError | UnauthorizedError

  type Query {
    # Throws a GraphQLError (standard approach)
    userOrThrow(id: ID!): User!

    # Returns a union type (typed error approach)
    userSafe(id: ID!, requesterRole: String!): UserResult!

    # Demonstrates different error codes
    riskyOperation(shouldFail: Boolean!): String!
  }

  type Mutation {
    # Validates input and may throw
    register(email: String!, password: String!): User!
  }
`;

const usersData = [
  { id: "1", name: "Alice", email: "alice@example.com", role: "ADMIN" },
  { id: "2", name: "Bob", email: "bob@example.com", role: "USER" },
];

const resolvers = {
  // Tell GraphQL how to determine which type a union resolves to
  UserResult: {
    __resolveType(obj) {
      if (obj.resourceId) return "NotFoundError";
      if (obj.requiredRole) return "UnauthorizedError";
      return "User";
    },
  },

  Query: {
    // Approach 1: Throw GraphQLError
    userOrThrow: (_, { id }) => {
      const user = usersData.find((u) => u.id === id);
      if (!user) {
        throw new GraphQLError(`User with id "${id}" not found`, {
          extensions: {
            code: "USER_NOT_FOUND",
            argumentName: "id",
            http: { status: 404 },
          },
        });
      }
      return user;
    },

    // Approach 2: Union-based typed errors (no throwing)
    userSafe: (_, { id, requesterRole }) => {
      if (requesterRole !== "ADMIN") {
        return {
          message: "Only admins can look up users",
          requiredRole: "ADMIN",
        };
      }

      const user = usersData.find((u) => u.id === id);
      if (!user) {
        return {
          message: `User "${id}" not found`,
          resourceId: id,
        };
      }

      return user;
    },

    // Demonstrates various error codes
    riskyOperation: (_, { shouldFail }) => {
      if (shouldFail) {
        throw new GraphQLError("Something went wrong!", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            timestamp: new Date().toISOString(),
          },
        });
      }
      return "Operation succeeded!";
    },
  },

  Mutation: {
    register: (_, { email, password }) => {
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new GraphQLError("Invalid email format", {
          extensions: { code: "BAD_USER_INPUT", field: "email" },
        });
      }

      // Validate password
      if (password.length < 8) {
        throw new GraphQLError("Password must be at least 8 characters", {
          extensions: { code: "BAD_USER_INPUT", field: "password" },
        });
      }

      // Check duplicate
      if (usersData.find((u) => u.email === email)) {
        throw new GraphQLError("Email already registered", {
          extensions: { code: "CONFLICT", field: "email" },
        });
      }

      const user = {
        id: String(usersData.length + 1),
        name: email.split("@")[0],
        email,
        role: "USER",
      };
      usersData.push(user);
      return user;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // formatError lets you mask internal errors in production
  formatError: (formattedError, error) => {
    // In production, you might want to hide internal details:
    // if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
    //   return { message: 'Something went wrong', extensions: { code: 'INTERNAL_SERVER_ERROR' } };
    // }
    return formattedError;
  },
});

const { url } = await startStandaloneServer(server, { listen: { port: 4009 } });

console.log(`🚀 Demo 09 – Error Handling server ready at ${url}`);
console.log(`\nTry these queries:\n`);
console.log(`  # Standard error (throws GraphQLError)`);
console.log(`  query { userOrThrow(id: "999") { name } }`);
console.log(``);
console.log(`  # Union-based error handling`);
console.log(`  query { userSafe(id: "1", requesterRole: "ADMIN") { ... on User { name } ... on UnauthorizedError { message } } }`);
console.log(`  query { userSafe(id: "1", requesterRole: "USER") { ... on User { name } ... on UnauthorizedError { message requiredRole } } }`);
console.log(`  query { userSafe(id: "999", requesterRole: "ADMIN") { ... on User { name } ... on NotFoundError { message resourceId } } }`);
console.log(``);
console.log(`  # Validation errors in mutations`);
console.log(`  mutation { register(email: "bad", password: "short") { id } }`);
console.log(`  mutation { register(email: "new@test.com", password: "longpassword") { id name email } }`);
