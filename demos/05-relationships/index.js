/**
 * Demo 05: Relationships
 * ----------------------
 * Model relationships between types (one-to-many, many-to-many).
 *
 * Concepts:
 *   - Nested resolvers (field-level resolvers)
 *   - One-to-many: Author → Books
 *   - Many-to-one: Book → Author
 *   - Many-to-many: Students ↔ Courses
 *   - Resolver chains
 *
 * Run:  npm run demo:05
 * Then open http://localhost:4005
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book!]!         # One-to-many: an author has many books
  }

  type Book {
    id: ID!
    title: String!
    year: Int!
    author: Author!         # Many-to-one: a book belongs to one author
  }

  type Student {
    id: ID!
    name: String!
    courses: [Course!]!     # Many-to-many
  }

  type Course {
    id: ID!
    title: String!
    students: [Student!]!   # Many-to-many
  }

  type Query {
    authors: [Author!]!
    author(id: ID!): Author
    books: [Book!]!
    book(id: ID!): Book
    students: [Student!]!
    courses: [Course!]!
  }
`;

// --- Data ---
const authorsData = [
  { id: "a1", name: "J.K. Rowling" },
  { id: "a2", name: "George Orwell" },
  { id: "a3", name: "J.R.R. Tolkien" },
];

const booksData = [
  { id: "b1", title: "Harry Potter", year: 1997, authorId: "a1" },
  { id: "b2", title: "Fantastic Beasts", year: 2001, authorId: "a1" },
  { id: "b3", title: "1984", year: 1949, authorId: "a2" },
  { id: "b4", title: "Animal Farm", year: 1945, authorId: "a2" },
  { id: "b5", title: "The Hobbit", year: 1937, authorId: "a3" },
  { id: "b6", title: "The Lord of the Rings", year: 1954, authorId: "a3" },
];

const studentsData = [
  { id: "s1", name: "Alice", courseIds: ["c1", "c2"] },
  { id: "s2", name: "Bob", courseIds: ["c2", "c3"] },
  { id: "s3", name: "Charlie", courseIds: ["c1", "c3"] },
];

const coursesData = [
  { id: "c1", title: "GraphQL Fundamentals", studentIds: ["s1", "s3"] },
  { id: "c2", title: "Advanced Resolvers", studentIds: ["s1", "s2"] },
  { id: "c3", title: "Schema Design", studentIds: ["s2", "s3"] },
];

const resolvers = {
  Query: {
    authors: () => authorsData,
    author: (_, { id }) => authorsData.find((a) => a.id === id) || null,
    books: () => booksData,
    book: (_, { id }) => booksData.find((b) => b.id === id) || null,
    students: () => studentsData,
    courses: () => coursesData,
  },

  // Field-level resolvers – this is how relationships work!
  Author: {
    books: (parent) => booksData.filter((b) => b.authorId === parent.id),
  },

  Book: {
    author: (parent) => authorsData.find((a) => a.id === parent.authorId),
  },

  Student: {
    courses: (parent) => coursesData.filter((c) => parent.courseIds.includes(c.id)),
  },

  Course: {
    students: (parent) => studentsData.filter((s) => parent.studentIds.includes(s.id)),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4005 } });

console.log(`🚀 Demo 05 – Relationships server ready at ${url}`);
console.log(`\nTry these queries:\n`);
console.log(`  # One-to-many: Author → Books`);
console.log(`  query { authors { name books { title year } } }`);
console.log(``);
console.log(`  # Many-to-one: Book → Author`);
console.log(`  query { books { title author { name } } }`);
console.log(``);
console.log(`  # Deep nesting: Book → Author → All their Books`);
console.log(`  query { book(id: "b1") { title author { name books { title year } } } }`);
console.log(``);
console.log(`  # Many-to-many: Student ↔ Course`);
console.log(`  query { students { name courses { title } } }`);
console.log(`  query { courses { title students { name } } }`);
