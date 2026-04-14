const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DIR = __dirname;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return null;
  }
}

function handlePost(req, res, callback) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      callback(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

function handleGet(res, filePath) {
  const data = readJsonFile(filePath);
  res.writeHead(data ? 200 : 404, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data || { error: "not found" }));
}

const server = http.createServer((req, res) => {
  // Credit card vault — save
  if (req.method === "POST" && req.url === "/save-vault") {
    handlePost(req, res, ({ encrypted, decrypted }) => {
      fs.writeFileSync(path.join(DIR, "vault_encrypted.json"), JSON.stringify(encrypted, null, 2));
      fs.writeFileSync(path.join(DIR, "vault_decrypted.json"), JSON.stringify(decrypted, null, 2));
    });
    return;
  }

  // Credit card vault — load
  if (req.method === "GET" && req.url === "/load-vault") {
    handleGet(res, path.join(DIR, "vault_encrypted.json"));
    return;
  }

  // Password records — save
  if (req.method === "POST" && req.url === "/save-password-records") {
    handlePost(req, res, ({ encrypted, decrypted }) => {
      fs.writeFileSync(path.join(DIR, "password-records-encrypted.json"), JSON.stringify(encrypted, null, 2));
      fs.writeFileSync(path.join(DIR, "password-records-plaintext.json"), JSON.stringify(decrypted, null, 2));
    });
    return;
  }

  // Password records — load
  if (req.method === "GET" && req.url === "/load-password-records") {
    handleGet(res, path.join(DIR, "password-records-encrypted.json"));
    return;
  }

  // Serve static files
  let filePath = path.join(DIR, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
