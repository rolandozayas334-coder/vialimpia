import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Directory and path for server DB
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read DB
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading server DB:", err);
    return null;
  }
}

// Helper to write DB
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing server DB:", err);
    return false;
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET database
app.get("/api/db", (req, res) => {
  const dbData = readDb();
  if (dbData) {
    res.json({ success: true, data: dbData });
  } else {
    res.json({ success: true, data: null });
  }
});

// POST database
app.post("/api/db", (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, message: "No data provided" });
  }
  const saved = writeDb(data);
  if (saved) {
    res.json({ success: true, message: "Database saved on server" });
  } else {
    res.status(500).json({ success: false, message: "Failed to save database on server" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
