/**
 * Demo 02: Types & Schemas
 * ------------------------
 * Explore GraphQL's type system: scalars, enums, object types, nullable vs non-null.
 *
 * Concepts:
 *   - Built-in scalars: String, Int, Float, Boolean, ID
 *   - Custom object types
 *   - Enums
 *   - Non-null (!) and list ([]) modifiers
 *
 * Run:  npm run demo:02
 * Then open http://localhost:4002
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  # Enum – a fixed set of allowed values
  enum Status {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  # Custom object type with various scalar fields
  type User {
    id: ID!                 # Non-null unique identifier
    name: String!           # Non-null string
    email: String!
    age: Int                # Nullable integer
    score: Float            # Nullable float
    isVerified: Boolean!    # Non-null boolean
    status: Status!         # Enum field
    tags: [String!]!        # Non-null list of non-null strings
  }

  type Query {
    # Returns a single user by ID
    user(id: ID!): User

    # Returns all users
    users: [User!]!

    # Demonstrates returning an enum value
    defaultStatus: Status!
  }
`;

// In-memory data store
const usersData = [
  {
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    age: 28,
    score: 92.5,
    isVerified: true,
    status: "ACTIVE",
    tags: ["admin", "premium"],
  },
  {
    id: "2",
    name: "Bob",
    email: "bob@example.com",
    age: null, // nullable field example
    score: 78.3,
    isVerified: false,
    status: "INACTIVE",
    tags: ["basic"],
  },
  {
    id: "3",
    name: "Charlie",
    email: "charlie@example.com",
    age: 35,
    score: null,
    isVerified: true,
    status: "SUSPENDED",
    tags: [],
  },
];

const resolvers = {
  Query: {
    user: (_, { id }) => usersData.find((u) => u.id === id) || null,
    users: () => usersData,
    defaultStatus: () => "ACTIVE",
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4002 } });

console.log(`🚀 Demo 02 – Types & Schemas server ready at ${url}`);
console.log(`\nTry these queries:\n`);
console.log(`  query { users { id name email age score isVerified status tags } }`);
console.log(`  query { user(id: "1") { name status tags } }`);
console.log(`  query { defaultStatus }`);
