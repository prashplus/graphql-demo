/**
 * Demo 10: Full Mini Project – Bookstore API
 * -------------------------------------------
 * A complete GraphQL API combining everything learned in demos 01–09.
 *
 * Features:
 *   - Multiple related types (Book, Author, Review, Category)
 *   - Full CRUD mutations with input types
 *   - Validation and error handling
 *   - Pagination (cursor-based)
 *   - Filtering and sorting
 *   - Nested relationships
 *   - Computed fields (averageRating)
 *
 * Run:  npm run demo:10
 * Then open http://localhost:4010
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLError } from "graphql";

const typeDefs = `#graphql
  # --- Enums ---
  enum Genre {
    FICTION
    NON_FICTION
    SCIENCE
    FANTASY
    MYSTERY
    BIOGRAPHY
  }

  enum SortOrder {
    ASC
    DESC
  }

  # --- Types ---
  type Author {
    id: ID!
    name: String!
    bio: String
    books: [Book!]!
    bookCount: Int!
  }

  type Book {
    id: ID!
    title: String!
    description: String
    isbn: String!
    genre: Genre!
    price: Float!
    publishedYear: Int!
    author: Author!
    reviews: [Review!]!
    averageRating: Float
    reviewCount: Int!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String
    reviewer: String!
    book: Book!
    createdAt: String!
  }

  # --- Pagination ---
  type BookEdge {
    node: Book!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type BookConnection {
    edges: [BookEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # --- Input Types ---
  input CreateBookInput {
    title: String!
    description: String
    isbn: String!
    genre: Genre!
    price: Float!
    publishedYear: Int!
    authorId: ID!
  }

  input UpdateBookInput {
    title: String
    description: String
    price: Float
    genre: Genre
  }

  input AddReviewInput {
    bookId: ID!
    rating: Int!
    comment: String
    reviewer: String!
  }

  input BookFilterInput {
    genre: Genre
    minPrice: Float
    maxPrice: Float
    authorId: ID
    search: String
    minRating: Float
  }

  input BookSortInput {
    field: BookSortField!
    order: SortOrder = ASC
  }

  enum BookSortField {
    TITLE
    PRICE
    PUBLISHED_YEAR
    AVERAGE_RATING
  }

  # --- Mutation Responses ---
  type BookMutationResponse {
    success: Boolean!
    message: String!
    book: Book
  }

  type ReviewMutationResponse {
    success: Boolean!
    message: String!
    review: Review
  }

  # --- Queries & Mutations ---
  type Query {
    book(id: ID!): Book
    books(
      first: Int = 10
      after: String
      filter: BookFilterInput
      sort: BookSortInput
    ): BookConnection!

    author(id: ID!): Author
    authors: [Author!]!

    # Stats
    bookCount: Int!
    genres: [Genre!]!
  }

  type Mutation {
    createBook(input: CreateBookInput!): BookMutationResponse!
    updateBook(id: ID!, input: UpdateBookInput!): BookMutationResponse!
    deleteBook(id: ID!): BookMutationResponse!
    addReview(input: AddReviewInput!): ReviewMutationResponse!
    createAuthor(name: String!, bio: String): Author!
  }
`;

// ============ Data ============
let authors = [
  { id: "a1", name: "Frank Herbert", bio: "American science fiction author" },
  { id: "a2", name: "Agatha Christie", bio: "Queen of Mystery" },
  { id: "a3", name: "Isaac Asimov", bio: "Professor of biochemistry and prolific writer" },
  { id: "a4", name: "Ursula K. Le Guin", bio: "American author of novels and short stories" },
];

let books = [
  { id: "bk1", title: "Dune", description: "A science fiction masterpiece", isbn: "978-0441172719", genre: "SCIENCE", price: 14.99, publishedYear: 1965, authorId: "a1" },
  { id: "bk2", title: "Dune Messiah", description: "Sequel to Dune", isbn: "978-0593098233", genre: "SCIENCE", price: 12.99, publishedYear: 1969, authorId: "a1" },
  { id: "bk3", title: "Murder on the Orient Express", description: "A classic mystery", isbn: "978-0062693662", genre: "MYSTERY", price: 10.99, publishedYear: 1934, authorId: "a2" },
  { id: "bk4", title: "And Then There Were None", description: "Ten strangers are lured to an island", isbn: "978-0062073488", genre: "MYSTERY", price: 11.99, publishedYear: 1939, authorId: "a2" },
  { id: "bk5", title: "Foundation", description: "The epic saga of the Foundation", isbn: "978-0553293357", genre: "SCIENCE", price: 13.99, publishedYear: 1951, authorId: "a3" },
  { id: "bk6", title: "I, Robot", description: "Nine short stories about robots", isbn: "978-0553382563", genre: "SCIENCE", price: 9.99, publishedYear: 1950, authorId: "a3" },
  { id: "bk7", title: "A Wizard of Earthsea", description: "A young boy grows to be the most powerful wizard", isbn: "978-0547722023", genre: "FANTASY", price: 11.99, publishedYear: 1968, authorId: "a4" },
  { id: "bk8", title: "The Left Hand of Darkness", description: "An envoy's mission to a distant planet", isbn: "978-0441478125", genre: "SCIENCE", price: 12.99, publishedYear: 1969, authorId: "a4" },
];

let reviews = [
  { id: "r1", rating: 5, comment: "A masterpiece of science fiction", reviewer: "Alice", bookId: "bk1", createdAt: "2024-01-10T00:00:00Z" },
  { id: "r2", rating: 4, comment: "Dense but rewarding", reviewer: "Bob", bookId: "bk1", createdAt: "2024-02-15T00:00:00Z" },
  { id: "r3", rating: 5, comment: "Timeless classic!", reviewer: "Charlie", bookId: "bk3", createdAt: "2024-03-01T00:00:00Z" },
  { id: "r4", rating: 3, comment: "Good but slow", reviewer: "Dave", bookId: "bk5", createdAt: "2024-03-20T00:00:00Z" },
  { id: "r5", rating: 5, comment: "Changed my perspective", reviewer: "Eve", bookId: "bk7", createdAt: "2024-04-05T00:00:00Z" },
  { id: "r6", rating: 4, comment: "Excellent world-building", reviewer: "Frank", bookId: "bk8", createdAt: "2024-04-20T00:00:00Z" },
];

let nextBookId = 9;
let nextReviewId = 7;
let nextAuthorId = 5;

// ============ Helpers ============
function getAverageRating(bookId) {
  const bookReviews = reviews.filter((r) => r.bookId === bookId);
  if (bookReviews.length === 0) return null;
  return bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
}

function applyBookFilters(data, filter) {
  let result = [...data];
  if (!filter) return result;

  if (filter.genre) result = result.filter((b) => b.genre === filter.genre);
  if (filter.authorId) result = result.filter((b) => b.authorId === filter.authorId);
  if (filter.minPrice !== undefined) result = result.filter((b) => b.price >= filter.minPrice);
  if (filter.maxPrice !== undefined) result = result.filter((b) => b.price <= filter.maxPrice);
  if (filter.search) {
    const term = filter.search.toLowerCase();
    result = result.filter((b) => b.title.toLowerCase().includes(term) || (b.description && b.description.toLowerCase().includes(term)));
  }
  if (filter.minRating !== undefined) {
    result = result.filter((b) => {
      const avg = getAverageRating(b.id);
      return avg !== null && avg >= filter.minRating;
    });
  }
  return result;
}

function applyBookSort(data, sort) {
  if (!sort) return data;
  const fieldMap = { TITLE: "title", PRICE: "price", PUBLISHED_YEAR: "publishedYear", AVERAGE_RATING: null };
  const multiplier = sort.order === "DESC" ? -1 : 1;

  return data.sort((a, b) => {
    let valA, valB;
    if (sort.field === "AVERAGE_RATING") {
      valA = getAverageRating(a.id) ?? 0;
      valB = getAverageRating(b.id) ?? 0;
    } else {
      const field = fieldMap[sort.field];
      valA = a[field];
      valB = b[field];
    }
    if (valA < valB) return -1 * multiplier;
    if (valA > valB) return 1 * multiplier;
    return 0;
  });
}

// ============ Resolvers ============
const resolvers = {
  Query: {
    book: (_, { id }) => books.find((b) => b.id === id) || null,

    books: (_, { first, after, filter, sort }) => {
      let filtered = applyBookFilters(books, filter);
      filtered = applyBookSort(filtered, sort);

      let startIndex = 0;
      if (after) {
        const decodedId = Buffer.from(after, "base64").toString("utf-8");
        const idx = filtered.findIndex((b) => b.id === decodedId);
        startIndex = idx + 1;
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
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount: filtered.length,
      };
    },

    author: (_, { id }) => authors.find((a) => a.id === id) || null,
    authors: () => authors,
    bookCount: () => books.length,
    genres: () => ["FICTION", "NON_FICTION", "SCIENCE", "FANTASY", "MYSTERY", "BIOGRAPHY"],
  },

  Mutation: {
    createBook: (_, { input }) => {
      const author = authors.find((a) => a.id === input.authorId);
      if (!author) {
        return { success: false, message: `Author "${input.authorId}" not found`, book: null };
      }
      if (books.find((b) => b.isbn === input.isbn)) {
        return { success: false, message: `Book with ISBN "${input.isbn}" already exists`, book: null };
      }

      const book = { id: `bk${nextBookId++}`, ...input };
      books.push(book);
      return { success: true, message: "Book created", book };
    },

    updateBook: (_, { id, input }) => {
      const book = books.find((b) => b.id === id);
      if (!book) return { success: false, message: `Book "${id}" not found`, book: null };
      Object.assign(book, input);
      return { success: true, message: "Book updated", book };
    },

    deleteBook: (_, { id }) => {
      const idx = books.findIndex((b) => b.id === id);
      if (idx === -1) return { success: false, message: `Book "${id}" not found`, book: null };
      const [removed] = books.splice(idx, 1);
      reviews = reviews.filter((r) => r.bookId !== id);
      return { success: true, message: "Book deleted", book: removed };
    },

    addReview: (_, { input }) => {
      const book = books.find((b) => b.id === input.bookId);
      if (!book) return { success: false, message: `Book "${input.bookId}" not found`, review: null };

      if (input.rating < 1 || input.rating > 5) {
        throw new GraphQLError("Rating must be between 1 and 5", {
          extensions: { code: "BAD_USER_INPUT", field: "rating" },
        });
      }

      const review = {
        id: `r${nextReviewId++}`,
        ...input,
        createdAt: new Date().toISOString(),
      };
      reviews.push(review);
      return { success: true, message: "Review added", review };
    },

    createAuthor: (_, { name, bio }) => {
      const author = { id: `a${nextAuthorId++}`, name, bio: bio || null };
      authors.push(author);
      return author;
    },
  },

  // --- Field-level resolvers for relationships ---
  Author: {
    books: (parent) => books.filter((b) => b.authorId === parent.id),
    bookCount: (parent) => books.filter((b) => b.authorId === parent.id).length,
  },

  Book: {
    author: (parent) => authors.find((a) => a.id === parent.authorId),
    reviews: (parent) => reviews.filter((r) => r.bookId === parent.id),
    averageRating: (parent) => getAverageRating(parent.id),
    reviewCount: (parent) => reviews.filter((r) => r.bookId === parent.id).length,
  },

  Review: {
    book: (parent) => books.find((b) => b.id === parent.bookId),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4010 } });

console.log(`🚀 Demo 10 – Bookstore API ready at ${url}`);
console.log(`\n📚 This is the full mini-project combining all concepts.\n`);
console.log(`Try these queries:\n`);
console.log(`  # Browse all books with pagination`);
console.log(`  query {`);
console.log(`    books(first: 3) {`);
console.log(`      edges { node { title price author { name } averageRating } cursor }`);
console.log(`      pageInfo { hasNextPage endCursor }`);
console.log(`      totalCount`);
console.log(`    }`);
console.log(`  }`);
console.log(``);
console.log(`  # Filter science books sorted by rating`);
console.log(`  query {`);
console.log(`    books(filter: { genre: SCIENCE }, sort: { field: AVERAGE_RATING, order: DESC }) {`);
console.log(`      edges { node { title genre averageRating author { name } } }`);
console.log(`    }`);
console.log(`  }`);
console.log(``);
console.log(`  # Deep relationship query`);
console.log(`  query {`);
console.log(`    author(id: "a1") {`);
console.log(`      name bio bookCount`);
console.log(`      books { title reviews { rating comment reviewer } averageRating }`);
console.log(`    }`);
console.log(`  }`);
console.log(``);
console.log(`  # Add a book`);
console.log(`  mutation {`);
console.log(`    createBook(input: {`);
console.log(`      title: "Children of Dune", isbn: "978-0593098244",`);
console.log(`      genre: SCIENCE, price: 13.99, publishedYear: 1976, authorId: "a1"`);
console.log(`    }) { success message book { id title author { name } } }`);
console.log(`  }`);
console.log(``);
console.log(`  # Add a review`);
console.log(`  mutation {`);
console.log(`    addReview(input: { bookId: "bk1", rating: 5, comment: "All-time favorite!", reviewer: "Grace" }) {`);
console.log(`      success review { id rating comment book { title averageRating } }`);
console.log(`    }`);
console.log(`  }`);
