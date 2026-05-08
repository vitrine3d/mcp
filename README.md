# Vitrine MCP Server

MCP server for [Vitrine](https://vitrine3d.com) — the 3D product viewer platform. Upload GLB models, configure scenes, publish embeds, and manage Looks from any AI agent.

## Setup

Add to your MCP client config (Claude Code, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "vitrine": {
      "command": "npx",
      "args": ["@vitrine3d/mcp"]
    }
  }
}
```

Works immediately with no API key — anonymous uploads expire after 48 hours.

### Keep your models

Say **"log me in"** to your AI agent. A browser window opens, you sign in (or sign up for free), and your models become permanent. No manual key copying needed.

Or set an API key manually:

```json
{
  "mcpServers": {
    "vitrine": {
      "command": "npx",
      "args": ["@vitrine3d/mcp"],
      "env": {
        "VITRINE_API_KEY": "vt_..."
      }
    }
  }
}
```

Generate keys at [app.vitrine3d.com](https://app.vitrine3d.com) → Account → API Keys.

## What you can do

Ask your AI agent things like:

- "Upload this shoe model and give me an embed code"
- "Make the lighting warmer and add bloom"
- "List my models and publish the chair"
- "Create a Look called 'Noir' with dark background and dramatic lighting"

## Tools

### Models
| Tool | Description |
|------|-------------|
| `vitrine_list_models` | List all models with IDs, names, and publish status |
| `vitrine_upload_model` | Upload a GLB file from disk |
| `vitrine_model_info` | Get model details, thumbnail, and merged config |
| `vitrine_delete_model` | Delete a model and its storage |

### Configuration
| Tool | Description |
|------|-------------|
| `vitrine_get_config` | Get the full scene config for a model |
| `vitrine_set_config` | Apply a config patch (lighting, camera, background, effects) |
| `vitrine_list_hdris` | List available HDRI environment presets |
| `vitrine_config_schema` | Get the full config JSON schema |

### Publishing
| Tool | Description |
|------|-------------|
| `vitrine_publish` | Publish or unpublish a model |
| `vitrine_get_embed` | Get ready-to-paste embed HTML |

### Looks
| Tool | Description |
|------|-------------|
| `vitrine_list_looks` | List your saved Looks |
| `vitrine_apply_look` | Apply a Look to a model |
| `vitrine_create_look` | Save a config as a named Look |

### Account
| Tool | Description |
|------|-------------|
| `vitrine_account_info` | Current plan, usage, and limits |
| `vitrine_login` | Connect your account via browser |
| `vitrine_logout` | Remove saved credentials |
| `vitrine_feedback` | Submit a bug report or feature request |

## Resources

| Resource | Description |
|----------|-------------|
| `vitrine://config-schema` | Full SceneConfig JSON schema |
| `vitrine://hdri-presets` | Available HDRI presets |
| `vitrine://embed-template` | Embed code template |

## How it works

```
You -> AI Agent (Claude, Cursor, etc.)
        | MCP protocol
      Vitrine MCP Server (runs locally)
        | HTTPS
      api.vitrine3d.com
        |
      Supabase (database, storage, auth)
```

## Documentation

- [API docs](https://docs.vitrine3d.com/docs/api)
- [MCP docs](https://docs.vitrine3d.com/docs/mcp)
- [Getting started](https://docs.vitrine3d.com/docs/getting-started)

## License

MIT
