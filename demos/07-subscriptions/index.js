/**
 * Demo 07: Subscriptions
 * ----------------------
 * Real-time data with GraphQL subscriptions over WebSocket.
 *
 * Concepts:
 *   - type Subscription
 *   - PubSub pattern
 *   - WebSocket transport (graphql-ws)
 *   - Publishing events from mutations
 *
 * Run:  npm run demo:07
 * Then open http://localhost:4007
 *
 * Note: Apollo Sandbox supports subscriptions. Start a subscription first,
 * then run a mutation in a new tab to see real-time updates.
 */

import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import express from "express";

// NOTE: This demo requires `express` and `@graphql-tools/schema` as additional deps.
// Run: npm install express @graphql-tools/schema

const app = express();
const httpServer = createServer(app);
const pubsub = new PubSub();

const MESSAGE_ADDED = "MESSAGE_ADDED";

const typeDefs = `#graphql
  type Message {
    id: ID!
    content: String!
    author: String!
    createdAt: String!
  }

  type Query {
    messages: [Message!]!
  }

  type Mutation {
    sendMessage(content: String!, author: String!): Message!
  }

  type Subscription {
    # This field will push a new Message every time one is created
    messageSent: Message!
  }
`;

let messages = [];
let nextId = 1;

const resolvers = {
  Query: {
    messages: () => messages,
  },

  Mutation: {
    sendMessage: (_, { content, author }) => {
      const message = {
        id: String(nextId++),
        content,
        author,
        createdAt: new Date().toISOString(),
      };
      messages.push(message);

      // Publish event to all subscribers
      pubsub.publish(MESSAGE_ADDED, { messageSent: message });

      return message;
    },
  },

  Subscription: {
    messageSent: {
      // subscribe returns an AsyncIterator
      subscribe: () => pubsub.asyncIterator([MESSAGE_ADDED]),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use("/graphql", express.json(), expressMiddleware(server));

httpServer.listen(4007, () => {
  console.log(`🚀 Demo 07 – Subscriptions server ready at http://localhost:4007/graphql`);
  console.log(`\nHow to test:\n`);
  console.log(`  1. Open Apollo Sandbox at http://localhost:4007/graphql`);
  console.log(`  2. Start a subscription:`);
  console.log(`     subscription { messageSent { id content author createdAt } }`);
  console.log(``);
  console.log(`  3. In a new tab, send a mutation:`);
  console.log(`     mutation { sendMessage(content: "Hello!", author: "Alice") { id content } }`);
  console.log(``);
  console.log(`  4. Watch the subscription tab update in real-time!`);
});
