import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "../client.js";

export function registerConfigTools(server: McpServer, client: VitrineClient) {
  server.registerTool(
    "vitrine_get_config",
    {
      title: "Get Config",
      description: "Get the full merged scene config for a model (look + layout + overrides).",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID"),
      }),
    },
    async ({ model_id }) => {
      const res = await client.getConfig(model_id);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.registerTool(
    "vitrine_set_config",
    {
      title: "Set Config",
      description:
        "Apply a config patch to a model. Only include fields you want to change. " +
        "Common fields: bg_mode, bg_color, hdri_name, hdri_exposure, bloom_enabled, bloom_intensity, " +
        "auto_rotate, camera_fov, camera_pitch, camera_yaw, tonemapping_mode, shadow_catcher_enabled. " +
        "Use vitrine_config_schema to see all available fields.",
      inputSchema: z.object({
        model_id: z.string().describe("Model ID"),
        config: z.record(z.unknown()).describe("SceneConfigPatch — only include fields to change"),
      }),
    },
    async ({ model_id, config }) => {
      const res = await client.patchConfig(model_id, config);
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: `Config updated.\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.registerTool(
    "vitrine_list_hdris",
    {
      title: "List HDRIs",
      description: "List available HDRI environment presets with their slugs.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.listHdris();
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.registerTool(
    "vitrine_config_schema",
    {
      title: "Config Schema",
      description: "Get the full SceneConfig JSON schema — all fields, types, enums, and defaults.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.getConfigSchema();
      if (!res.ok) return { content: [{ type: "text", text: `Error: ${res.data?.message ?? res.status}` }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
    },
  );
}
