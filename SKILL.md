---
name: ChatGPT Image Generation
description: Generate or edit images in OpenCode using the user's ChatGPT subscription and the gpt_imagegen tool, without an OpenAI API key. Use when asked to generate an image, illustration, photo, hero asset, texture, sprite, mockup, transparent PNG, or edit reference images; especially for «сгенерируй картинку», «нарисуй», «через подписку ChatGPT», «без API». Also use as the image-generation backend for design skills when ChatGPT subscription generation is requested.
---

# ChatGPT subscription image generation

Use the installed `gpt_imagegen` tool. This is a global, locally adapted OpenCode V2 plugin, not the separately billed OpenAI Images API.

## Workflow

1. Check that generation or editing is within the user's request. Do not generate speculative assets or extra variants: each call consumes Codex subscription quota. Generation is not unlimited or free of quota cost.
2. Pick the output path and a supported aspect ratio. Use the user's destination, or a descriptive PNG path such as `output/imagegen/fox-cabin.png` relative to the current session directory. Do not put generated images in this skill directory. Ask only when a consequential ambiguity cannot be resolved from the requested use.
3. Write a concrete prompt covering subject, purpose, composition, style, lighting, colors, and constraints. State whether text/logos are permitted. For exact text, quote it and specify placement. Do not invent unrelated creative requirements.
4. For edits, inspect input images first. Pass local paths in `images`, identify each image's role in the prompt (Image 1, Image 2, etc.), and state what must stay unchanged. Do not assume references carry over between calls.
5. Invoke `gpt_imagegen` once per requested asset. If the tool is exposed through Code Mode, discover its current callable signature using tool search and invoke that exact path with `execute`; otherwise call the exposed tool directly. Do not guess MCP names or run a different generation service as a substitute.
6. Check the returned file with an image-reading tool. Verify composition, requested content, and actual dimensions. Report the actual saved path and dimensions, not merely the requested values. Do not claim successful generation on an error or missing file.

## Tool parameters

- `prompt`: nonempty image description or editing instructions.
- `out`: PNG output path, relative to the session directory or absolute.
- `size`: one of the exact values below.
- `images`: optional array of up to five local reference-image paths.
- `background`: optional `opaque` (default) or `transparent`. Use `transparent` for cutouts, stickers, or explicit background removal; for edits preserve existing transparency unless requested otherwise.

| Size | Aspect ratio | Typical use |
| --- | --- | --- |
| `1254x1254` | 1:1 | Square art or icon |
| `1536x1024` | 3:2 | Landscape illustration |
| `1024x1536` | 2:3 | Portrait or poster |
| `1448x1086` | 4:3 | Landscape presentation asset |
| `1086x1448` | 3:4 | Portrait artwork |
| `1672x941` | 16:9 | Hero or video thumbnail |
| `941x1672` | 9:16 | Vertical cover or phone wallpaper |

The backend can return dimensions differing by a pixel. Other exact dimensions require a separate resize/crop step; do not promise native 4K or arbitrary pixel sizes. Ask before cropping away important content. Transparent cutout edges may need cleanup.

Example tool arguments (not a shell command):

```json
{
  "prompt": "A small red fox beside a wooden cabin in a pine forest, warm morning light, square composition. No text or logos.",
  "out": "output/imagegen/fox-cabin.png",
  "size": "1254x1254",
  "background": "opaque"
}
```

## Safety and failure handling

- Uses the active OpenAI ChatGPT OAuth integration. Never ask for, print, copy, or manually read access/refresh tokens or credentials.
- Never dump `/api/config` or authentication files: resolved configuration can contain secrets.
- Never silently fall back to `OPENAI_API_KEY`, paid APIs, Higgsfield, or another provider. Explain the issue and ask before changing the billing path.
- If sign-in is missing, tell the user to run `/connect`, select OpenAI, and sign in with ChatGPT. API-key authentication is not a replacement for subscription OAuth.
- If quota is exhausted, report it. Do not bypass limits, switch accounts, or automatically buy credits.
- On a timeout or uncertain response, inspect the intended output path before retrying. Do not blindly repeat a request that might already have consumed quota.
- Existing output paths get a version suffix such as `-v2`; use the actual path returned. Upstream overwrite protection is best-effort, so avoid concurrent calls writing to the same output stem.
- Text-to-image was live-tested with OpenCode v2.0.29. Reference editing and transparency are implemented but have not yet been live-tested; verify their results rather than promising correctness.
- Follow other design skills for art direction when appropriate; use this skill for the subscription-backed generation step. Do not bypass any applicable policy or user approval requirement.

## Local installation and troubleshooting

Global loader: `~/.config/opencode/plugins/gpt-imagegen-v2.ts`.
Local implementation: `~/.config/opencode/gpt-imagegen-v2/v2.ts`.
Plugin ID: `local.gpt-imagegen.v2`.
Upstream: https://github.com/yuji-hatakeyama/opencode-gpt-imagegen (local port of 0.1.14).

If the tool is missing, check `opencode plugin list` or filter `/api/plugin` for the plugin ID and its state. The local loader is discovered globally; a project may still disable tools/plugins or restrict permissions. Do not edit user configuration or reinstall the V1 package automatically. Report the loading error; a user-controlled restart may be needed. The unmodified upstream V1 entrypoint does not load in V2.

For implementation details and mock tests, read `~/.config/opencode/gpt-imagegen-v2/LOCAL-V2.md`. This local port is not automatically updated from upstream.
