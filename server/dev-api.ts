import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const PORT = 8787;

type VercelRes = { status: (code: number) => VercelRes; json: (body: unknown) => VercelRes };

const routes: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => unknown }>> = {
  "/api/ask": () => import("../api/ask.ts"),
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const loadRoute = routes[url.pathname];
  if (!loadRoute) {
    res.writeHead(404).end("Not found");
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const rawBody = Buffer.concat(chunks).toString("utf-8");

  const vercelReq = req as unknown as VercelRequest;
  vercelReq.body = rawBody ? JSON.parse(rawBody) : {};

  const vercelRes = res as unknown as VercelRes;
  vercelRes.status = (code: number) => {
    res.statusCode = code;
    return vercelRes;
  };
  vercelRes.json = (body: unknown) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
    return vercelRes;
  };

  const { default: handler } = await loadRoute();
  await handler(vercelReq, vercelRes as unknown as VercelResponse);
});

server.listen(PORT, () => {
  console.log(`Local API dev server listening on http://localhost:${PORT}`);
});
