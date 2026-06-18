const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
module.exports = async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("Invalid");
  let count = 0;
  try { const s = await redis.get("likes:" + userId); count = s?.count ?? 0; } catch {}
  const w = 36 + String(count).length * 8, h = 22;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="' + w + '" height="' + h + '" rx="11" fill="#5865f2" opacity=".18"/><text x="7" y="15" font-size="13" font-family="sans-serif" fill="#fff">??</text><text x="26" y="15" font-size="12" font-weight="700" font-family="sans-serif" fill="#c9cdfb">' + count + '</text></svg>';
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).send(svg);
};
