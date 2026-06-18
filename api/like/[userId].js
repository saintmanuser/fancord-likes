const { Redis } = require("@upstash/redis");
const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Invalid userId" });
  const key = "likes:" + userId;
  if (req.method === "GET") {
    const fromId = req.query.from ?? "";
    const stored = (await redis.get(key)) ?? { count: 0, likedBy: [] };
    return res.status(200).json({ count: stored.count ?? 0, likedByMe: fromId ? (stored.likedBy?.includes(fromId) ?? false) : false });
  }
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const fromId = body?.from ?? "";
    if (!fromId || fromId === userId) return res.status(400).json({ error: "Invalid" });
    const rlKey = "rl:" + fromId + ":" + userId;
    if (await redis.get(rlKey)) {
      const s = (await redis.get(key)) ?? { count: 0, likedBy: [] };
      return res.status(429).json({ count: s.count, likedByMe: s.likedBy?.includes(fromId) ?? false });
    }
    const stored = (await redis.get(key)) ?? { count: 0, likedBy: [] };
    const likedBy = stored.likedBy ?? [];
    const already = likedBy.includes(fromId);
    const newLikedBy = already ? likedBy.filter(id => id !== fromId) : [...likedBy, fromId];
    const newCount = already ? Math.max(0, (stored.count ?? 0) - 1) : (stored.count ?? 0) + 1;
    await redis.set(key, { count: newCount, likedBy: newLikedBy });
    await redis.set(rlKey, 1, { ex: 10 });
    return res.status(200).json({ count: newCount, likedByMe: !already });
  }
  return res.status(405).end();
};
