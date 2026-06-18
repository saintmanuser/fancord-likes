const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
module.exports = async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("Invalid");
  let count = 0;
  try { const s = await redis.get("likes:" + userId); count = s?.count ?? 0; } catch {}
  const label = "Likes";
  const lw = 36, cw = 8 + String(count).length * 8, w = lw + cw, h = 20;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="' + lw + '" height="' + h + '" fill="#5865f2"/><rect x="' + lw + '" width="' + cw + '" height="' + h + '" fill="#23272a"/><text x="4" y="14" font-size="11" font-family="Arial,sans-serif" fill="#fff" font-weight="bold">' + label + '</text><text x="' + (lw + 4) + '" y="14" font-size="11" font-family="Arial,sans-serif" fill="#fff">' + count + '</text></svg>';
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).send(svg);
};
