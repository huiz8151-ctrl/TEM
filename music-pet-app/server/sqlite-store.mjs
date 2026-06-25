import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = dirname(fileURLToPath(import.meta.url));
const bridgePath = resolve(root, "sqlite_bridge.py");
const defaultDbPath = resolve(homedir(), "Documents", "腾讯AI", "music-pet.sqlite");
const dbPath = process.env.MUSIC_PET_DB_PATH || defaultDbPath;
const pythonPath = process.env.PYTHON_PATH
  || "C:\\Users\\LeeYb\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";

export async function runSqliteCommand(action, payload, defaultState, userId = "demo") {
  const input = {
    action,
    payload,
    userId,
    dbPath,
    defaultState
  };

  const output = await runPython(input);
  if (!output.ok) {
    throw new Error(output.error || "SQLite command failed");
  }
  return output.result;
}

function runPython(input) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(pythonPath, [bridgePath], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8"
      }
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `SQLite bridge exited with ${code}`));
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout));
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.end(JSON.stringify(input));
  });
}
