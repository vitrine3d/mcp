import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VitrineClient } from "./client.js";

export function registerResources(server: McpServer, client: VitrineClient) {
  server.registerResource(
    "config-schema",
    "vitrine://config-schema",
    { title: "SceneConfig JSON Schema", mimeType: "application/json" },
    async (uri) => {
      const res = await client.getConfigSchema();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(res.data, null, 2),
        }],
      };
    },
  );

  server.registerResource(
    "hdri-presets",
    "vitrine://hdri-presets",
    { title: "Available HDRI Presets", mimeType: "application/json" },
    async (uri) => {
      const res = await client.listHdris();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(res.data, null, 2),
        }],
      };
    },
  );

  server.registerResource(
    "embed-template",
    "vitrine://embed-template",
    { title: "Embed Code Template", mimeType: "text/html" },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: [
          '<!-- Replace MODEL_ID with your model\'s ID -->',
          '<vitrine-viewer model-id="MODEL_ID"></vitrine-viewer>',
          '<script src="https://cdn.vitrine3d.com/vitrine.js" defer></script>',
        ].join("\n"),
      }],
    }),
  );
}
