/**
 * Demo 03: Queries & Arguments
 * ----------------------------
 * Learn how to pass arguments to queries, use aliases, fragments, and variables.
 *
 * Concepts:
 *   - Query arguments with defaults
 *   - Nested object queries
 *   - Aliases (client-side renaming)
 *   - Fragments (reusable field selections)
 *   - Query variables
 *
 * Run:  npm run demo:03
 * Then open http://localhost:4003
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Address {
    street: String!
    city: String!
    country: String!
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    category: String!
    inStock: Boolean!
  }

  type Query {
    # Basic argument
    product(id: ID!): Product

    # Multiple arguments with a default value
    products(category: String, inStock: Boolean = true): [Product!]!

    # Argument with limit (for learning purposes)
    cheapProducts(maxPrice: Float!): [Product!]!

    # Nested object query
    storeAddress: Address!
  }
`;

const productsData = [
  { id: "1", name: "Laptop", price: 999.99, category: "electronics", inStock: true },
  { id: "2", name: "Headphones", price: 49.99, category: "electronics", inStock: true },
  { id: "3", name: "Desk Lamp", price: 29.99, category: "home", inStock: false },
  { id: "4", name: "Notebook", price: 5.99, category: "stationery", inStock: true },
  { id: "5", name: "Keyboard", price: 79.99, category: "electronics", inStock: false },
  { id: "6", name: "Coffee Mug", price: 12.99, category: "home", inStock: true },
];

const resolvers = {
  Query: {
    product: (_, { id }) => productsData.find((p) => p.id === id) || null,

    products: (_, { category, inStock }) => {
      let result = productsData;
      if (category) result = result.filter((p) => p.category === category);
      if (inStock !== undefined) result = result.filter((p) => p.inStock === inStock);
      return result;
    },

    cheapProducts: (_, { maxPrice }) => productsData.filter((p) => p.price <= maxPrice),

    storeAddress: () => ({
      street: "123 GraphQL Lane",
      city: "Query City",
      country: "Schemaland",
    }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4003 } });

console.log(`🚀 Demo 03 – Queries & Arguments server ready at ${url}`);
console.log(`\nTry these queries:\n`);
console.log(`  # Basic argument`);
console.log(`  query { product(id: "1") { name price } }`);
console.log(``);
console.log(`  # Filtering with multiple arguments`);
console.log(`  query { products(category: "electronics", inStock: true) { name price } }`);
console.log(``);
console.log(`  # Aliases – rename fields in the response`);
console.log(`  query {`);
console.log(`    cheap: cheapProducts(maxPrice: 20) { name price }`);
console.log(`    expensive: cheapProducts(maxPrice: 1000) { name price }`);
console.log(`  }`);
console.log(``);
console.log(`  # Fragments – reuse field selections`);
console.log(`  fragment ProductInfo on Product { name price category }`);
console.log(`  query {`);
console.log(`    product(id: "1") { ...ProductInfo }`);
console.log(`    products(category: "home") { ...ProductInfo inStock }`);
console.log(`  }`);
console.log(``);
console.log(`  # Variables (use the Variables panel in Sandbox)`);
console.log(`  query GetProduct($pid: ID!) { product(id: $pid) { name price } }`);
console.log(`  Variables: { "pid": "2" }`);
