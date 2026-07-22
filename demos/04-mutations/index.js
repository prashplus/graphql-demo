/**
 * Demo 04: Mutations
 * ------------------
 * Learn how to modify data with GraphQL mutations.
 *
 * Concepts:
 *   - type Mutation
 *   - Create, Update, Delete operations
 *   - Returning the mutated object
 *   - Mutation responses / payloads
 *
 * Run:  npm run demo:04
 * Then open http://localhost:4004
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Todo {
    id: ID!
    title: String!
    completed: Boolean!
    createdAt: String!
  }

  # Mutation response pattern – return success status + data
  type MutationResponse {
    success: Boolean!
    message: String!
    todo: Todo
  }

  type Query {
    todos: [Todo!]!
    todo(id: ID!): Todo
  }

  type Mutation {
    # Create a new todo
    createTodo(title: String!): Todo!

    # Update a todo's title or completion status
    updateTodo(id: ID!, title: String, completed: Boolean): MutationResponse!

    # Delete a todo
    deleteTodo(id: ID!): MutationResponse!
  }
`;

// In-memory store
let todos = [
  { id: "1", title: "Learn GraphQL basics", completed: true, createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", title: "Build a GraphQL server", completed: false, createdAt: "2024-01-02T00:00:00Z" },
];
let nextId = 3;

const resolvers = {
  Query: {
    todos: () => todos,
    todo: (_, { id }) => todos.find((t) => t.id === id) || null,
  },

  Mutation: {
    createTodo: (_, { title }) => {
      const todo = {
        id: String(nextId++),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      todos.push(todo);
      return todo;
    },

    updateTodo: (_, { id, title, completed }) => {
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return { success: false, message: `Todo with id "${id}" not found`, todo: null };
      }
      if (title !== undefined) todo.title = title;
      if (completed !== undefined) todo.completed = completed;
      return { success: true, message: "Todo updated successfully", todo };
    },

    deleteTodo: (_, { id }) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return { success: false, message: `Todo with id "${id}" not found`, todo: null };
      }
      const [removed] = todos.splice(index, 1);
      return { success: true, message: "Todo deleted successfully", todo: removed };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4004 } });

console.log(`🚀 Demo 04 – Mutations server ready at ${url}`);
console.log(`\nTry these mutations:\n`);
console.log(`  # Create`);
console.log(`  mutation { createTodo(title: "Learn mutations") { id title completed } }`);
console.log(``);
console.log(`  # Update`);
console.log(`  mutation { updateTodo(id: "1", completed: false) { success message todo { title completed } } }`);
console.log(``);
console.log(`  # Delete`);
console.log(`  mutation { deleteTodo(id: "2") { success message todo { title } } }`);
console.log(``);
console.log(`  # Then verify with a query`);
console.log(`  query { todos { id title completed createdAt } }`);
