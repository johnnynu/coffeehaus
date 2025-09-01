import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { coffeeShops } from "@/routes/coffeeShops";
import { users } from "@/routes/users";

const app = new Hono();

// CORS middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({ message: "Coffeehaus API is running!" });
});

// Coffee shops routes
app.route("/api/coffee-shops", coffeeShops);

// Users routes
app.route("/api/users", users);

const port = parseInt(process.env.PORT || "3000");
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
