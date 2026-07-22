# graphql-demo

Learn GraphQL from basics to intermediate concepts with **10 hands-on demos**, each building on the previous one. Every demo is a standalone Apollo Server you can run and explore via Apollo Sandbox.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Getting Started

```bash
# Install dependencies
npm install

# Run any demo (01 through 10)
npm run demo:01
```

Each demo starts a server on its own port. Open the URL printed in the console to launch **Apollo Sandbox** and try the example queries.

---

## What is Apollo Server?

[Apollo Server](https://www.apollographql.com/docs/apollo-server/) is an open-source GraphQL server for Node.js. It handles incoming GraphQL requests, validates them against your schema, executes the matching resolvers, and returns a JSON response. In this repo, every demo creates an Apollo Server instance with two things:

- **`typeDefs`** — your schema written in GraphQL's Schema Definition Language (SDL)
- **`resolvers`** — JavaScript functions that return the actual data for each field

When you start a demo (e.g. `npm run demo:01`), Apollo Server boots up on a local port and automatically connects to **Apollo Sandbox**.

## What is Apollo Sandbox?

[Apollo Sandbox](https://www.apollographql.com/docs/graphos/explorer/sandbox/) is a free, browser-based GraphQL IDE that Apollo Server redirects you to when you open the server URL. It gives you:

- **Query Editor** (left panel) — write your GraphQL queries, mutations, or subscriptions here
- **Variables Panel** (bottom-left) — pass JSON variables to parameterized queries
- **Response Viewer** (right panel) — see the JSON response from the server
- **Schema Explorer** (left sidebar) — browse all available types, fields, and documentation from your schema
- **History** — revisit previously executed operations

No installation needed — just open the server URL in your browser and start querying.

## How a GraphQL Query Works

Understanding the request/response flow is key to learning GraphQL:

```
┌──────────────┐         HTTP POST         ┌──────────────────┐
│              │  ───────────────────────▶  │                  │
│    Client    │   { "query": "..." }       │   Apollo Server  │
│  (Sandbox)   │                            │                  │
│              │  ◀───────────────────────  │                  │
└──────────────┘   { "data": { ... } }      └────────┬─────────┘
                                                     │
                                            ┌────────▼─────────┐
                                            │  Execution Flow  │
                                            └──────────────────┘
```

**Step by step:**

1. **Client sends a query** — The client (Apollo Sandbox, a frontend app, or even `curl`) sends an HTTP POST request with a JSON body containing the GraphQL query string.

2. **Schema validation** — Apollo Server parses the query and validates it against your schema (`typeDefs`). If the query asks for a field that doesn't exist or passes the wrong argument type, it returns an error _before_ executing anything.

3. **Resolver execution** — For each field in the query, the server calls the matching resolver function. Resolvers run top-down: the root `Query` resolver fires first, then any nested field resolvers (e.g. `Author.books`) are called with the parent's return value.

4. **Response assembly** — The server collects all resolver results into a JSON object that mirrors the exact shape of the query. The client gets back _only_ the fields it asked for — nothing more, nothing less.

**Example flow for `query { book(id: "bk1") { title author { name } } }`:**

```
Query.book(id: "bk1")           →  finds book { id: "bk1", title: "Dune", authorId: "a1" }
  ├── title                      →  "Dune" (resolved directly from parent object)
  └── Book.author(parent.authorId) →  finds author { id: "a1", name: "Frank Herbert" }
        └── name                 →  "Frank Herbert" (resolved directly from parent object)
```

**Response:**

```json
{
  "data": {
    "book": {
      "title": "Dune",
      "author": {
        "name": "Frank Herbert"
      }
    }
  }
}
```

> **Key insight:** The client controls the shape of the response. Unlike REST, where the server decides what fields to return, in GraphQL the client specifies exactly what it needs in the query.

---

## Demos

| #   | Topic                                                       | Port | Key Concepts                                                                         |
| --- | ----------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------ |
| 01  | [Hello World](demos/01-hello-world)                         | 4001 | Schema (SDL), `type Query`, resolvers, ApolloServer                                  |
| 02  | [Types & Schemas](demos/02-types-and-schemas)               | 4002 | Scalars (`String`, `Int`, `Float`, `Boolean`, `ID`), enums, non-null `!`, lists `[]` |
| 03  | [Queries & Arguments](demos/03-queries-and-arguments)       | 4003 | Arguments, defaults, aliases, fragments, variables, nested objects                   |
| 04  | [Mutations](demos/04-mutations)                             | 4004 | `type Mutation`, create/update/delete, mutation responses                            |
| 05  | [Relationships](demos/05-relationships)                     | 4005 | Field-level resolvers, one-to-many, many-to-one, many-to-many                        |
| 06  | [Input Types & Validation](demos/06-input-types-validation) | 4006 | `input` keyword, grouped arguments, server-side validation                           |
| 07  | [Subscriptions](demos/07-subscriptions)                     | 4007 | `type Subscription`, PubSub, WebSocket (graphql-ws), real-time events                |
| 08  | [Pagination & Filtering](demos/08-pagination-filtering)     | 4008 | Offset pagination, cursor-based (Relay-style), sorting, combined filters             |
| 09  | [Error Handling](demos/09-error-handling)                   | 4009 | `GraphQLError`, custom error codes, union-based typed errors, `formatError`          |
| 10  | [Bookstore API](demos/10-bookstore-api)                     | 4010 | Full mini-project combining all concepts above                                       |

---

## Demo Details

### 01 – Hello World

The simplest GraphQL server. Define a schema, write a resolver, start the server.

```graphql
query {
  hello
}
query {
  serverTime
}
```

### 02 – Types & Schemas

Explore GraphQL's rich type system — scalars, enums, nullable vs non-null fields, and lists.

```graphql
query {
  users {
    id
    name
    email
    age
    score
    isVerified
    status
    tags
  }
}
query {
  user(id: "1") {
    name
    status
  }
}
```

### 03 – Queries & Arguments

Pass arguments, use defaults, learn aliases, fragments, and query variables.

```graphql
query {
  cheap: cheapProducts(maxPrice: 20) {
    name
    price
  }
  expensive: cheapProducts(maxPrice: 1000) {
    name
    price
  }
}

fragment ProductInfo on Product {
  name
  price
  category
}
query {
  products(category: "home") {
    ...ProductInfo
  }
}
```

### 04 – Mutations

Create, update, and delete data. Learn the mutation response pattern.

```graphql
mutation {
  createTodo(title: "Learn mutations") {
    id
    title
    completed
  }
}
mutation {
  updateTodo(id: "1", completed: true) {
    success
    message
    todo {
      title
    }
  }
}
```

### 05 – Relationships

Model real-world relationships with field-level resolvers.

```graphql
query {
  authors {
    name
    books {
      title
      year
    }
  }
}
query {
  books {
    title
    author {
      name
    }
  }
}
query {
  students {
    name
    courses {
      title
    }
  }
}
```

### 06 – Input Types & Validation

Use `input` types for clean mutation arguments and validate data server-side.

```graphql
mutation {
  createUser(input: { name: "Alice", email: "alice@test.com", age: 25 }) {
    user {
      id
      name
      role
    }
    errors {
      field
      message
    }
  }
}
```

### 07 – Subscriptions

Real-time data over WebSocket. Start a subscription, then trigger it with a mutation.

```graphql
# Tab 1: Subscribe
subscription {
  messageSent {
    id
    content
    author
    createdAt
  }
}

# Tab 2: Trigger
mutation {
  sendMessage(content: "Hello!", author: "Alice") {
    id
  }
}
```

### 08 – Pagination & Filtering

Offset and cursor-based pagination, plus flexible filtering and sorting.

```graphql
query {
  postsConnection(first: 3) {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### 09 – Error Handling

Standard `GraphQLError`, custom error codes, and union-based typed error patterns.

```graphql
query {
  userOrThrow(id: "999") {
    name
  }
}

query {
  userSafe(id: "1", requesterRole: "USER") {
    ... on User {
      name
    }
    ... on UnauthorizedError {
      message
      requiredRole
    }
  }
}
```

### 10 – Bookstore API (Mini Project)

A complete API combining all concepts: types, relationships, CRUD, pagination, filtering, sorting, validation, and error handling.

```graphql
query {
  books(
    filter: { genre: SCIENCE }
    sort: { field: AVERAGE_RATING, order: DESC }
  ) {
    edges {
      node {
        title
        averageRating
        author {
          name
        }
      }
    }
    totalCount
  }
}
```

---

## Tech Stack

- **[Apollo Server v4](https://www.apollographql.com/docs/apollo-server/)** – GraphQL server
- **[graphql-js](https://github.com/graphql/graphql-js)** – Reference implementation
- **[graphql-ws](https://github.com/enisdenjo/graphql-ws)** – WebSocket subscriptions
- **Node.js** (ES Modules)

## Project Structure

```
graphql-demo/
├── demos/
│   ├── 01-hello-world/           # Schema, Query, Resolvers
│   ├── 02-types-and-schemas/     # Scalars, Enums, Object Types
│   ├── 03-queries-and-arguments/ # Arguments, Aliases, Fragments
│   ├── 04-mutations/             # Create, Update, Delete
│   ├── 05-relationships/         # 1:N, N:M, Field Resolvers
│   ├── 06-input-types-validation/# Input Types, Validation
│   ├── 07-subscriptions/         # Real-time with WebSocket
│   ├── 08-pagination-filtering/  # Offset & Cursor Pagination
│   ├── 09-error-handling/        # GraphQLError, Union Errors
│   └── 10-bookstore-api/         # Full Mini Project
├── package.json
└── README.md
```

## License

MIT
