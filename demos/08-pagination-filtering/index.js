/**
 * Demo 08: Pagination & Filtering
 * --------------------------------
 * Implement offset-based and cursor-based pagination, plus flexible filtering.
 *
 * Concepts:
 *   - Offset pagination (limit + offset)
 *   - Cursor-based pagination (Relay-style connections)
 *   - Sorting (orderBy)
 *   - Combined filtering + pagination
 *
 * Run:  npm run demo:08
 * Then open http://localhost:4008
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Post {
    id: ID!
    title: String!
    body: String!
    category: String!
    likes: Int!
    createdAt: String!
  }

  # --- Offset Pagination ---
  type PostList {
    items: [Post!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  # --- Cursor-based Pagination (Relay-style) ---
  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum PostSortField {
    TITLE
    LIKES
    CREATED_AT
  }

  input PostSortInput {
    field: PostSortField!
    order: SortOrder = ASC
  }

  input PostFilterInput {
    category: String
    minLikes: Int
    search: String          # Search in title
  }

  type Query {
    # Offset-based pagination
    posts(limit: Int = 5, offset: Int = 0, filter: PostFilterInput, sort: PostSortInput): PostList!

    # Cursor-based pagination
    postsConnection(first: Int = 5, after: String, filter: PostFilterInput, sort: PostSortInput): PostConnection!
  }
`;

// Generate sample data
const postsData = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  title: `Post ${i + 1}: ${["GraphQL Basics", "Advanced Queries", "Schema Design", "Mutations Deep Dive", "Real-time Subscriptions"][i % 5]}`,
  body: `This is the body of post ${i + 1}. It covers interesting topics about GraphQL.`,
  category: ["tutorial", "guide", "reference", "opinion"][i % 4],
  likes: Math.floor(Math.random() * 100),
  createdAt: new Date(2024, 0, i + 1).toISOString(),
}));

function applyFilterAndSort(data, filter, sort) {
  let result = [...data];

  if (filter) {
    if (filter.category) result = result.filter((p) => p.category === filter.category);
    if (filter.minLikes !== undefined) result = result.filter((p) => p.likes >= filter.minLikes);
    if (filter.search) {
      const term = filter.search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(term));
    }
  }

  if (sort) {
    const fieldMap = { TITLE: "title", LIKES: "likes", CREATED_AT: "createdAt" };
    const field = fieldMap[sort.field];
    const multiplier = sort.order === "DESC" ? -1 : 1;
    result.sort((a, b) => {
      if (a[field] < b[field]) return -1 * multiplier;
      if (a[field] > b[field]) return 1 * multiplier;
      return 0;
    });
  }

  return result;
}

const resolvers = {
  Query: {
    // Offset pagination
    posts: (_, { limit, offset, filter, sort }) => {
      const filtered = applyFilterAndSort(postsData, filter, sort);
      const items = filtered.slice(offset, offset + limit);
      return {
        items,
        totalCount: filtered.length,
        hasMore: offset + limit < filtered.length,
      };
    },

    // Cursor-based pagination
    postsConnection: (_, { first, after, filter, sort }) => {
      const filtered = applyFilterAndSort(postsData, filter, sort);

      let startIndex = 0;
      if (after) {
        const decodedCursor = Buffer.from(after, "base64").toString("utf-8");
        const afterIndex = filtered.findIndex((p) => p.id === decodedCursor);
        startIndex = afterIndex + 1;
      }

      const slice = filtered.slice(startIndex, startIndex + first);

      const edges = slice.map((node) => ({
        node,
        cursor: Buffer.from(node.id).toString("base64"),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: startIndex + first < filtered.length,
          hasPreviousPage: startIndex > 0,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount: filtered.length,
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4008 } });

console.log(`🚀 Demo 08 – Pagination & Filtering server ready at ${url}`);
console.log(`\nTry these queries:\n`);
console.log(`  # Offset pagination`);
console.log(`  query { posts(limit: 3, offset: 0) { items { id title likes } totalCount hasMore } }`);
console.log(`  query { posts(limit: 3, offset: 3) { items { id title likes } totalCount hasMore } }`);
console.log(``);
console.log(`  # Cursor pagination`);
console.log(`  query { postsConnection(first: 3) {`);
console.log(`    edges { node { id title } cursor }`);
console.log(`    pageInfo { hasNextPage endCursor }`);
console.log(`    totalCount`);
console.log(`  }}`);
console.log(``);
console.log(`  # Then use endCursor for next page:`);
console.log(`  query { postsConnection(first: 3, after: "<endCursor>") { ... } }`);
console.log(``);
console.log(`  # Filtering + sorting`);
console.log(`  query {`);
console.log(`    posts(filter: { category: "tutorial", minLikes: 20 }, sort: { field: LIKES, order: DESC }) {`);
console.log(`      items { title category likes } totalCount`);
console.log(`    }`);
console.log(`  }`);
