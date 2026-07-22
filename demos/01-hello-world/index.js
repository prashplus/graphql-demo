/**
 * Demo 01: Hello World
 * --------------------
 * The simplest possible GraphQL server.
 * Concepts: schema definition, type Query, resolvers, starting ApolloServer.
 *
 * Run:  npm run demo:01
 * Then open http://localhost:4001 in your browser to use Apollo Sandbox.
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// 1. Define a schema using the GraphQL Schema Definition Language (SDL)
const typeDefs = `#graphql
  # The "Query" type is the entry point for all read operations.
  type Query {
    # A simple field that returns a greeting string.
    hello: String!

    # Returns the current server time as a string.
    serverTime: String!
  }
`;

// 2. Define resolvers – functions that return data for each field.
const resolvers = {
  Query: {
    hello: () => "Hello, GraphQL! 🚀",
    serverTime: () => new Date().toISOString(),
  },
};

// 3. Create and start the server.
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, { listen: { port: 4001 } });
console.log(`🚀 Demo 01 – Hello World server ready at ${url}`);
console.log(`\nTry these queries in Apollo Sandbox:\n`);
console.log(`  query { hello }`);
console.log(`  query { serverTime }`);
console.log(`  query { hello serverTime }`);
