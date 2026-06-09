import type { VercelRequest, VercelResponse } from "@vercel/node";
async function getSummary(country: string, hours: number): Promise<{ summary: string }> {
  return { summary: "AI summary coming soon..." };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, country = "ru", hours = "24" } = req.query;

  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    switch (action) {

      case "summary": {
        const summary = await getSummary(String(country), Number(hours));
        return res.status(200).json({ ok: true, ...summary });
      }

      default:
        return res.status(400).json({ ok: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("v1 api error", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
