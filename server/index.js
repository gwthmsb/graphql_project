import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `
type Author {
  id: ID!
  name: String!
  books: [Book!]!
}

type Book {
  id: ID!
  title: String!
  author: Author!
}

type Query {
  authors: [Author!]!
  author(id: ID!): Author!
  books: [Book!]!
  book(id: ID!): Book!
  authorsCSV(fields: [String!]!): String! # Returns CSV data as a string
}
`;

//sample dataset. We will fetch data from these array of objects
const authors = [
  { id: "1", name: "Belegere Krishnashaastri" },
  { id: "2", name: "KP Thejasvi" },
  { id: "3", name: "S Karantha" },
];

const books = [
  { id: "1", title: "Mareyalaadithe", authorId: "1" },
  { id: "1", title: "Yegadalli ellaythe", authorId: "1" },
  { id: "2", title: "Chidambara rahasya", authorId: "2" },
  { id: "3", title: "Marali mannige", authorId: "3" },
  { id: "2", title: "Parisarada kathegalu", authorId: "2" },
  { id: "3", title: "Mukajjiya kanasugalu", authorId: "3" },
];

const resolvers = {
  Query: {
    books: () => books,
    book: (parent, args) => books.find((book) => book.id === args.id),
    authors: () => authors,
    author: (parent, args) => authors.find((author) => author.id === args.id),

    // Custom resolver for authorsCSV
    authorsCSV: (_, { fields }) => {
      if (!authors.length) return ""; // Handle empty dataset

      // Validate fields
      const validFields = ["id", "name", "books"]; // Define valid fields
      const selectedFields = fields.filter((field) => validFields.includes(field));

      if (selectedFields.length === 0) {
        throw new Error("Invalid fields selected. Available fields are: id, name, books");
      }

      // Build headers based on selected fields
      const headers = selectedFields.join(",");

      // Generate CSV rows
      const csvData = authors
        .map((author) => {
          return selectedFields
            .map((field) => {
              if (field === "books") {
                return books
                  .filter((book) => book.authorId === author.id)
                  .map((book) => book.title)
                  .join(";");
              }
              // Handle other fields
              return author[field] ?? "";
            })
            .join(",");
        })
        .join("\n");

      // Return headers + CSV data
      return `${headers}\n${csvData}`;
    },
  },
  Author: {
    books: (parent) => books.filter((book) => book.authorId === parent.id),
  },
  Book: {
    author: (parent) => authors.find((author) => author.id === parent.authorId),
  },
};


// The ApolloServer constructor takes two parameters: the schema and the resolvers you created
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function.
// start the server at port 5000 on localhost
const { url } = await startStandaloneServer(server, {
  listen: { port: 5000 },
});

console.log(`Access GraphQL endpoint at: ${url}`);
