const http = require("http");
require("dotenv").config();
const router = require("./router");

// routes
require("./routes/authRoutes");
require("./routes/userRoutes");
require("./routes/artistRoutes");
require("./routes/musicRoutes");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Common headers (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  router.handle(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
