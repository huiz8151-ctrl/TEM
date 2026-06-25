import { scenePresets } from "./music-catalog.mjs";

const defaultScene = "commute";

function normalizeSceneId(value) {
  if (scenePresets[value]) return value;
  return defaultScene;
}

export async function analyzeMoment(input = {}) {
  const sceneId = normalizeSceneId(input.sceneId || input.mode);
  const preset = scenePresets[input.photoHint] || scenePresets[sceneId];

  return {
    provider: input.imageData ? "mock-vision-adapter" : "scene-preset",
    sceneId,
    sceneLabel: preset.label,
    visualSignals: preset.visualSignals,
    emotion: preset.emotion,
    tags: preset.tags,
    avoidTags: preset.avoidTags,
    bpmRange: preset.bpmRange,
    confidence: input.imageData ? 0.82 : 0.68
  };
}

export async function analyzeWithKimi({ imageData, prompt, apiKey, model, baseUrl }) {
  if (!apiKey || !imageData) return null;

  const normalizedBaseUrl = String(baseUrl || "https://api.moonshot.cn").replace(/\/+$/, "").replace(/\/v1$/, "");
  const response = await fetch(`${normalizedBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "你是音乐 App 的多模态场景理解器。",
            "你需要从照片里判断画面氛围、情绪、适合的音乐标签和节奏范围。",
            "只返回 JSON，不要解释，不要 Markdown。"
          ].join("\n")
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(`Kimi vision request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return content ? normalizeKimiMoment(parseJsonContent(content)) : null;
}

function parseJsonContent(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) return JSON.parse(match[1]);
  }
  return JSON.parse(trimmed);
}

function normalizeKimiMoment(value = {}) {
  return {
    sceneLabel: safeString(value.sceneLabel) || "照片场景",
    emotion: safeString(value.emotion) || "需要音乐陪伴",
    visualSignals: safeStringList(value.visualSignals).slice(0, 5),
    tags: safeStringList(value.tags).slice(0, 6),
    avoidTags: safeStringList(value.avoidTags).slice(0, 4),
    bpmRange: normalizeBpmRange(value.bpmRange),
    confidence: 0.9
  };
}

async function readErrorDetail(response) {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, " ").slice(0, 220);
  } catch {
    return "";
  }
}

function safeString(value) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function safeStringList(value) {
  return Array.isArray(value)
    ? value.map(safeString).filter(Boolean)
    : [];
}

function normalizeBpmRange(value) {
  if (!Array.isArray(value) || value.length < 2) return [70, 100];
  const min = Number(value[0]);
  const max = Number(value[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [70, 100];
  return [Math.max(50, Math.min(min, max)), Math.min(160, Math.max(min, max))];
}
