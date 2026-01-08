

const fs = require("fs")
const path = require("path")

const LOG_FILE = path.join(process.cwd(), "requests.log")

module.exports = function logger(req, res, next) {
  const time = new Date().toISOString()
  const ipCF = req.headers["cf-connecting-ip"] || "UNKNOWN"

const clientIp =
  req.headers["cf-connecting-ip"]

  const logText = `
==================== REQUEST ====================
Time   : ${time}
IP-CLOUDFLARE : ${ipCF}
IP-CLIENT     : ${clientIp}
Method : ${req.method}
URL    : ${req.originalUrl}

--- Headers ---
${JSON.stringify(req.headers, null, 2)}

--- Body ---
${JSON.stringify(req.body, null, 2)}

================================================
`;

  fs.appendFile(LOG_FILE, logText, (err) => {
    if (err) console.error("💥 Log ghi k đc:", err);
  });

  next();
}
