const http = require("http");
const fs = require("fs");
const path = require("path");

try {
  const env = fs.readFileSync(path.join(__dirname, ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function patchRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
    return res;
  };
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

const server = http.createServer(async (req, res) => {
  patchRes(res);

  const url = req.url.split("?")[0];

  if (url.startsWith("/api/")) {
    const apiFile = path.join(__dirname, url + ".js");
    if (!fs.existsSync(apiFile)) {
      return res.status(404).json({ error: "API route not found" });
    }
    req.body = await readBody(req);
    try {
      delete require.cache[require.resolve(apiFile)];
      const handler = require(apiFile);
      const fn = typeof handler === "function" ? handler : handler.default;
      return fn(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  const rel = url === "/" ? "/index.html" : url;
  const filePath = path.join(__dirname, rel);
  if (!filePath.startsWith(__dirname)) {
    return res.status(403).end("Forbidden");
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
    return fs.createReadStream(filePath).pipe(res);
  }
  res.status(404).end("Not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  ▶  http://localhost:${PORT}\n`);
});
