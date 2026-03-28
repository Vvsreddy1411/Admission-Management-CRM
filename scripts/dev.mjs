import { spawn } from "node:child_process";
import process from "node:process";

const children = new Set();
let shuttingDown = false;

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    stdio: "pipe",
    shell: true,
    env: process.env,
  });

  children.add(child);

  child.stdout.on("data", (chunk) => {
    process.stdout.write(prefixLines(`[${name}] `, chunk.toString()));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(prefixLines(`[${name}] `, chunk.toString()));
  });

  child.on("exit", (code) => {
    children.delete(child);

    if (shuttingDown) {
      return;
    }

    if (code && code !== 0) {
      shutdown(code);
    }
  });

  return child;
}

function prefixLines(prefix, text) {
  return text
    .split(/\r?\n/)
    .map((line, index, lines) => {
      if (line.length === 0 && index === lines.length - 1) {
        return "";
      }

      return `${prefix}${line}`;
    })
    .join("\n");
}

async function waitForBackend(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);

      if (res.ok) {
        return;
      }
    } catch {
      // Backend is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Backend did not become ready within ${timeoutMs}ms`);
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill("SIGTERM");
  }

  setTimeout(() => {
    for (const child of children) {
      child.kill("SIGKILL");
    }

    process.exit(code);
  }, 1000).unref();

  if (children.size === 0) {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  process.stdout.write("[dev] Starting backend...\n");
  startProcess("dev:backend", "node", ["backend/server.js"]);

  await waitForBackend("http://localhost:4000/api/health");
  process.stdout.write("[dev] Backend is ready. Starting frontend...\n");

  startProcess("dev:frontend", "npx", ["vite"]);
}

main().catch((error) => {
  process.stderr.write(`[dev] ${error.message}\n`);
  shutdown(1);
});
