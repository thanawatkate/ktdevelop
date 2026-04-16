#!/usr/bin/env node
const { exec } = require("child_process");

const port = Number.parseInt(process.argv[2] || process.env.PORT || "3007", 10);

if (!Number.isFinite(port) || port <= 0) {
  console.error("Invalid port. Usage: node ./scripts/free-port.js <port>");
  process.exit(1);
}

function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve((stdout || "").toString());
    });
  });
}

async function freePortWindows(targetPort) {
  let output = "";
  try {
    output = await execAsync(`netstat -ano | findstr :${targetPort}`);
  } catch {
    return false;
  }
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;

    const cols = row.split(/\s+/);
    const localAddress = cols[1] || "";
    const state = cols[3] || "";
    const pid = cols[4] || "";

    if (!localAddress.endsWith(`:${targetPort}`)) continue;
    if (!pid || !/^\d+$/.test(pid)) continue;

    if (state === "LISTENING" || state === "ESTABLISHED") {
      pids.add(pid);
    }
  }

  if (pids.size === 0) {
    return false;
  }

  for (const pid of pids) {
    await execAsync(`taskkill /PID ${pid} /F`);
  }

  return true;
}

(async () => {
  try {
    if (process.platform === "win32") {
      const killed = await freePortWindows(port);
      console.log(killed ? `Freed port ${port}` : `Port ${port} is already free`);
      process.exit(0);
    }

    await execAsync(`fuser -k ${port}/tcp || true`);
    console.log(`Freed port ${port} if it was in use`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to free port ${port}:`, err.message || err);
    process.exit(1);
  }
})();
