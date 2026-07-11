const http = require("http");
const fs = require("fs");
const path = require("path");
const registerHandler = require("../api/register");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 8_000_000) {
        req.destroy();
        reject(new Error("Request body too large."));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.normalize(path.join(root, normalized));

  if (!filePath.startsWith(root)) {
    return "";
  }

  return filePath;
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/register")) {
    req.body = await collectBody(req);
    return registerHandler(req, res);
  }

  const filePath = safePath(req.url);

  if (!filePath) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      return res.end("Not found");
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`EFF Master AI Tools Academy preview: http://${host}:${port}`);
});
