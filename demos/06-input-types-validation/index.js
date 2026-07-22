/**
 * Demo 06: Input Types & Validation
 * ----------------------------------
 * Use input types to structure mutation arguments and add server-side validation.
 *
 * Concepts:
 *   - input keyword (vs type)
 *   - Grouping related arguments
 *   - Server-side validation in resolvers
 *   - Union return types for success/error
 *
 * Run:  npm run demo:06
 * Then open http://localhost:4006
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int!
    role: Role!
  }

  enum Role {
    ADMIN
    USER
    MODERATOR
  }

  # Input type – used specifically for mutation arguments
  # Unlike 'type', input types cannot have resolvers or circular references
  input CreateUserInput {
    name: String!
    email: String!
    age: Int!
    role: Role = USER    # Default value
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
    role: Role
  }

  # Validation error type
  type ValidationError {
    field: String!
    message: String!
  }

  type CreateUserResult {
    user: User
    errors: [ValidationError!]!
  }

  type Query {
    users: [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): CreateUserResult!
    updateUser(id: ID!, input: UpdateUserInput!): CreateUserResult!
  }
`;

let users = [
  { id: "1", name: "Admin", email: "admin@example.com", age: 30, role: "ADMIN" },
];
let nextId = 2;

// Validation helper
function validateUser(input, existingEmails = []) {
  const errors = [];

  if (input.name !== undefined && input.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (input.email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
    if (existingEmails.includes(input.email)) {
      errors.push({ field: "email", message: "Email already in use" });
    }
  }

  if (input.age !== undefined && (input.age < 0 || input.age > 150)) {
    errors.push({ field: "age", message: "Age must be between 0 and 150" });
  }

  return errors;
}

const resolvers = {
  Query: {
    users: () => users,
  },

  Mutation: {
    createUser: (_, { input }) => {
      const existingEmails = users.map((u) => u.email);
      const errors = validateUser(input, existingEmails);

      if (errors.length > 0) {
        return { user: null, errors };
      }

      const user = { id: String(nextId++), ...input };
      users.push(user);
      return { user, errors: [] };
    },

    updateUser: (_, { id, input }) => {
      const user = users.find((u) => u.id === id);
      if (!user) {
        return {
          user: null,
          errors: [{ field: "id", message: `User with id "${id}" not found` }],
        };
      }

      const otherEmails = users.filter((u) => u.id !== id).map((u) => u.email);
      const errors = validateUser(input, otherEmails);

      if (errors.length > 0) {
        return { user: null, errors };
      }

      Object.assign(user, input);
      return { user, errors: [] };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4006 } });

console.log(`🚀 Demo 06 – Input Types & Validation server ready at ${url}`);
console.log(`\nTry these mutations:\n`);
console.log(`  # Valid creation`);
console.log(`  mutation {`);
console.log(`    createUser(input: { name: "Alice", email: "alice@test.com", age: 25 }) {`);
console.log(`      user { id name email role }`);
console.log(`      errors { field message }`);
console.log(`    }`);
console.log(`  }`);
console.log(``);
console.log(`  # Invalid – triggers validation errors`);
console.log(`  mutation {`);
console.log(`    createUser(input: { name: "A", email: "bad-email", age: 200 }) {`);
console.log(`      user { id }`);
console.log(`      errors { field message }`);
console.log(`    }`);
console.log(`  }`);
