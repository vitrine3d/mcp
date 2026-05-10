#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Request, Response } from "express";
import { VitrineClient } from "./client.js";
import { resolveCredentials } from "./auth.js";
import { registerModelTools } from "./tools/models.js";
import { registerConfigTools } from "./tools/config.js";
import { registerShowcaseTools } from "./tools/showcases.js";
import { registerLookTools } from "./tools/looks.js";
import { registerFeedbackTools } from "./tools/feedback.js";
import { registerAccountTools } from "./tools/account.js";
import { registerLoginTools } from "./tools/login.js";
import { registerResources } from "./resources.js";

function createServer(client: VitrineClient, authState: { isAnonymous: boolean; anonUserId?: string }) {
  const server = new McpServer(
    {
      name: "vitrine",
      version: "1.1.0",
    },
    {
      instructions:
        "vitrine 3D viewer management. Upload GLB models, configure scenes " +
        "(lighting, camera, background, effects), publish embeds, and manage Looks. " +
        "Use vitrine_config_schema to discover all available scene config fields. " +
        "If the user wants to keep their models permanently, use vitrine_login to connect their account.",
    },
  );

  registerModelTools(server, client, authState);
  registerConfigTools(server, client);
  registerShowcaseTools(server, client);
  registerLookTools(server, client);
  registerFeedbackTools(server, client);
  registerAccountTools(server, client);
  registerLoginTools(server, client, authState);
  registerResources(server, client);

  return server;
}

const mode = process.argv.includes("--http") ? "http" : "stdio";
const creds = await resolveCredentials();
const client = new VitrineClient(creds);
const authState = {
  isAnonymous: creds.isAnonymous,
  anonUserId: creds.anonUserId,
};

if (mode === "http") {
  const port = parseInt(process.env.PORT || "3000", 10);
  const app = createMcpExpressApp({ host: "0.0.0.0" });
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => { transports.set(id, transport); },
      });
      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };
      const server = createServer(client, authState);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: no valid session ID" },
      id: null,
    });
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    await transports.get(sessionId)!.handleRequest(req, res);
  });

  app.listen(port, () => {
    console.error(`vitrine MCP server listening on http://0.0.0.0:${port}/mcp`);
  });

  process.on("SIGINT", async () => {
    for (const [, transport] of transports) await transport.close();
    process.exit(0);
  });
} else {
  const server = createServer(client, authState);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
