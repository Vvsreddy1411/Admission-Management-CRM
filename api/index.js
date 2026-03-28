import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../backend/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helpful for local vercel dev; ignored in Vercel production where env vars are managed.
dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });

const app = await createApp();

export default app;
