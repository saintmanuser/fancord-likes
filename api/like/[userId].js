const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const j = await r.json();
  return j.result ? JSON.parse(j.result) : null;
}
async function kvSet(key, value, ex) {
  const url = ex ? `${KV_URL}/set/${key}?ex=${ex}` : `${KV_URL}/set/${key}`;
  await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(value) });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Invalid userId" });
  const key = `likes:${userId}`;
  if (req.method === "GET") {
    const fromId = req.query.from ?? "";
    const stored = (await kvGet(key)) ?? { count: 0, likedBy: [] };
    return res.status(200).json({ count: stored.count ?? 0, likedByMe: fromId ? (stored.likedBy?.includes(fromId) ?? false) : false });
  }
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const fromId = body?.from ?? "";
    if (!fromId || fromId === userId) return res.status(400).json({ error: "Invalid" });
    const rlKey = `rl:${fromId}:${userId}`;
    const rl = await kvGet(rlKey);
    const stored = (await kvGet(key)) ?? { count: 0, likedBy: [] };
    if (rl) return res.status(429).json({ count: stored.count, likedByMe: stored.likedBy?.includes(fromId) ?? false });
    const likedBy = stored.likedBy ?? [];
    const already = likedBy.includes(fromId);
    const newLikedBy = already ? likedBy.filter(id => id !== fromId) : [...likedBy, fromId];
    const newCount = already ? Math.max(0, (stored.count ?? 0) - 1) : (stored.count ?? 0) + 1;
    await kvSet(key, { count: newCount, likedBy: newLikedBy });
    await kvSet(rlKey, 1, 10);
    return res.status(200).json({ count: newCount, likedByMe: !already });
  }
  return res.status(405).end();
};