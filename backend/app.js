import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

const ALLOWED_KEYS = new Set([
  "adm_institutions",
  "adm_campuses",
  "adm_departments",
  "adm_programs",
  "adm_academic_years",
  "adm_quotas",
  "adm_applicants",
  "adm_institution_caps",
]);

let cachedDb = null;

async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || "campus_connect";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedDb = client.db(DB_NAME);
  return cachedDb;
}

function sanitize(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

export async function createApp() {
  const db = await getDb();
  const app = express();

  app.use(cors());
  app.use(express.json());

  function getCollection(key) {
    if (!ALLOWED_KEYS.has(key)) {
      const error = new Error("Invalid collection key");
      error.status = 400;
      throw error;
    }
    return db.collection(key);
  }

  app.get("/", (_req, res) => {
    res.json({ ok: true, message: "Backend is running", health: "/api/health" });
  });

  app.get("/api/health", (_, res) => {
    res.json({ ok: true });
  });

  app.get("/api/user-session", async (_req, res, next) => {
    try {
      const collection = db.collection("adm_user_session");
      const doc = await collection.findOne({ id: "session" });
      res.json(doc?.session || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/user-session", async (req, res, next) => {
    try {
      const collection = db.collection("adm_user_session");
      await collection.updateOne(
        { id: "session" },
        { $set: { id: "session", session: req.body } },
        { upsert: true },
      );
      res.json(req.body);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/user-session", async (_req, res, next) => {
    try {
      const collection = db.collection("adm_user_session");
      await collection.deleteOne({ id: "session" });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/:key", async (req, res, next) => {
    try {
      const collection = getCollection(req.params.key);
      const items = await collection.find({}).toArray();
      res.json(items.map(sanitize));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/:key", async (req, res, next) => {
    try {
      const collection = getCollection(req.params.key);
      const doc = { ...req.body, id: crypto.randomUUID() };
      await collection.insertOne(doc);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/:key/:id", async (req, res, next) => {
    try {
      const collection = getCollection(req.params.key);
      const { id } = req.params;
      await collection.updateOne({ id }, { $set: req.body });
      const updated = await collection.findOne({ id });
      res.json(sanitize(updated));
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/:key/:id", async (req, res, next) => {
    try {
      const collection = getCollection(req.params.key);
      const { id } = req.params;
      await collection.deleteOne({ id });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Server error" });
  });

  return app;
}
