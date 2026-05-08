import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";

export function registerLookTools(server: McpServer, client: VitrineClient) {
  server.registerTool(
    "vitrine_list_looks",
    {
      title: "List Looks",
      description: "List your saved Looks (reusable scene presets).",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.listLooks();
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.registerTool(
    "vitrine_apply_look",
    {
      title: "Apply Look",
      description: "Apply a Look preset to a model by setting its look_id.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID"),
        look_id: z.string().describe("Look ID to apply"),
      }),
    },
    async ({ model_id, look_id }) => {
      const res = await client.updateShowcase(model_id, { look_id });
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: `Look applied.\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.registerTool(
    "vitrine_create_look",
    {
      title: "Create Look",
      description: "Save a scene config as a named Look preset.",
      inputSchema: z.object({
        name: z.string().describe("Look name"),
        config: z.record(z.unknown()).describe("Scene config for this look"),
      }),
    },
    async ({ name, config }) => {
      const res = await client.createLook(name, config);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: `Look created.\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );
}
