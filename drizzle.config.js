const dotenv = require("dotenv");
const { defineConfig } = require("drizzle-kit");
dotenv.config();
module.exports = defineConfig({
  out: "./src/drizzle",
  schema: "./src/models",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: true, 
  },
});