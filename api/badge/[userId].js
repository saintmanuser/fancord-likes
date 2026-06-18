const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
module.exports = async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("Invalid");
  let count = 0;
  try { const s = await redis.get("likes:" + userId); count = s?.count ?? 0; } catch {}
  const w = 52 + String(count).length * 8, h = 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="12" fill="#5865f2" opacity=".2"/><rect width="${w}" height="${h}" rx="12" fill="none" stroke="#5865f2" stroke-width="1.2" opacity=".6"/><text x="8" y="17" font-size="13" font-family="Arial,sans-serif" fill="#7289da">+1</text><text x="30" y="17" font-size="12" font-weight="700" font-family="Arial,sans-serif" fill="#c9cdfb">${count}</text></svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).send(svg);
};
