const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
module.exports = async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).send("Invalid");
  let count = 0;
  try { const s = await redis.get("likes:" + userId); count = s?.count ?? 0; } catch {}
  const w = 44 + String(count).length * 8, h = 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" rx="12" fill="#5865f2" opacity=".2"/>
  <rect width="${w}" height="${h}" rx="12" fill="none" stroke="#5865f2" stroke-width="1.2" opacity=".6"/>
  <path d="M8 16.5v-5.8l2.5-4.7h.8c.4 0 .7.4.6.8l-.7 3.2h3.6c.5 0 .9.5.7 1l-1.8 5a.8.8 0 0 1-.7.5H8zm-1 0H6a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h1v6z" fill="#7289da"/>
  <text x="22" y="16.5" font-size="12" font-weight="700" font-family="Arial,sans-serif" fill="#c9cdfb">${count}</text>
</svg>`;
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).send(svg);
};
