import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";
import { saveAuth, getDashboardUrl } from "../auth.js";
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { platform } from "node:os";

export function registerLoginTools(
  server: McpServer,
  client: VitrineClient,
  authState: { isAnonymous: boolean; anonUserId?: string },
) {
  server.registerTool(
    "vitrine_login",
    {
      title: "Log In",
      description:
        "Connect your Vitrine account. Opens a browser to sign in or sign up. " +
        "If you have anonymous models, they will be transferred to your account automatically.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const result = await runLoginFlow(authState);
        // Update client auth header
        client.setAuth(result.apiKey);
        return {
          content: [{
            type: "text",
            text: `Logged in successfully! API key saved to ~/.config/vitrine/mcp-auth.json. Your models are now permanent.`,
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Login failed: ${err.message}` }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "vitrine_logout",
    {
      title: "Log Out",
      description: "Remove saved credentials. You'll start fresh as anonymous on next use.",
      inputSchema: z.object({}),
    },
    async () => {
      await saveAuth({});
      return {
        content: [{ type: "text", text: "Logged out. Saved credentials removed." }],
      };
    },
  );
}

function openBrowser(url: string): void {
  const cmd =
    platform() === "darwin" ? "open" :
    platform() === "win32" ? "start" :
    "xdg-open";
  exec(`${cmd} "${url}"`);
}

function runLoginFlow(authState: { isAnonymous: boolean; anonUserId?: string }): Promise<{ apiKey: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      svr.close();
      reject(new Error("Login timed out after 5 minutes. Try again."));
    }, 5 * 60 * 1000);

    const svr = createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost`);

      if (url.pathname === "/callback") {
        const apiKey = url.searchParams.get("key");
        const error = url.searchParams.get("error");

        // Return a nice HTML page
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html><html><head><title>Vitrine</title>
          <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa}
          .card{text-align:center;padding:2rem;border-radius:12px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
          h2{margin:0 0 0.5rem}p{color:#666;margin:0}</style></head>
          <body><div class="card">${apiKey
            ? "<h2>Connected!</h2><p>You can close this tab and return to your AI agent.</p>"
            : `<h2>Error</h2><p>${error || "Something went wrong"}</p>`
          }</div></body></html>`);

        clearTimeout(timeout);
        svr.close();

        if (apiKey) {
          saveAuth({ apiKey }).then(() => resolve({ apiKey }));
        } else {
          reject(new Error(error || "No API key received"));
        }
        return;
      }

      res.writeHead(404);
      res.end();
    });

    svr.listen(0, "127.0.0.1", () => {
      const addr = svr.address();
      if (!addr || typeof addr === "string") {
        clearTimeout(timeout);
        reject(new Error("Could not start callback server"));
        return;
      }

      const port = addr.port;
      const callbackUrl = `http://127.0.0.1:${port}/callback`;
      const dashboardUrl = getDashboardUrl();

      const params = new URLSearchParams({ callback: callbackUrl });
      if (authState.isAnonymous && authState.anonUserId) {
        params.set("anon_id", authState.anonUserId);
      }

      const loginUrl = `${dashboardUrl}/#/auth?${params.toString()}`;
      openBrowser(loginUrl);
    });
  });
}
