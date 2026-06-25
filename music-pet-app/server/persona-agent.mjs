const DEFAULT_KIMI_MODEL = "kimi-k2.7-code";

export async function enrichWithPersona({ moment, intent, songs, pet }) {
  const modelResult = await maybeCallTextModel({ moment, intent, songs, pet });
  if (modelResult) return modelResult;

  const topSong = songs[0];
  return {
    petReply: `${moment.sceneLabel}很适合听《${topSong?.title || "这首歌"}》。我会用“${pet.action}”陪你，把${intent.musicTags.slice(0, 2).join("、")}的状态留住。`,
    recommendationReason: `根据${moment.sceneLabel}和${moment.emotion}，优先选择 ${intent.musicTags.slice(0, 3).join(" / ")} 的音乐。`,
    personalityTone: pet.mode === "energy" ? "元气鼓励" : pet.mode === "heal" ? "温柔陪伴" : "轻声陪同",
    growthExplanation: `这次听歌让小Q的${pet.mode === "energy" ? "能量" : "亲密度"}更明显地提升。`,
    provider: "local-persona"
  };
}

async function maybeCallTextModel(payload) {
  const apiKey = process.env.LLM_API_KEY || process.env.KIMI_API_KEY;
  const baseUrl = normalizeBaseUrl(process.env.LLM_BASE_URL || process.env.KIMI_BASE_URL || "https://api.moonshot.cn");
  const model = process.env.LLM_TEXT_MODEL || process.env.KIMI_TEXT_MODEL || DEFAULT_KIMI_MODEL;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.72,
        response_format: { type: "json_object" },
        max_completion_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "你是音乐养成软件里的小宠物人格与推荐解释助手。",
              "只输出 JSON，不要 Markdown。",
              "语言要短、自然、像陪伴，不要像营销文案或产品说明。"
            ].join("\n")
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "生成宠物回复、推荐理由、人格语气、成长解释",
              schema: {
                petReply: "string",
                recommendationReason: "string",
                personalityTone: "string",
                growthExplanation: "string"
              },
              ...payload
            })
          }
        ]
      })
    });
    if (!response.ok) {
      const detail = await readErrorDetail(response);
      console.warn(`[persona] Kimi persona failed: status=${response.status} model=${model} detail=${detail}`);
      return null;
    }
    const data = await response.json();
    const parsed = parseJson(data?.choices?.[0]?.message?.content || "");
    return {
      petReply: clean(parsed.petReply, 120),
      recommendationReason: clean(parsed.recommendationReason, 140),
      personalityTone: clean(parsed.personalityTone, 40),
      growthExplanation: clean(parsed.growthExplanation, 100),
      provider: "kimi-persona",
      model
    };
  } catch (error) {
    console.warn(`[persona] Kimi persona request error: ${error.message}`);
    return null;
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "").replace(/\/v1$/, "");
}

async function readErrorDetail(response) {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, " ").slice(0, 260);
  } catch {
    return "";
  }
}

function parseJson(content) {
  const trimmed = content.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse(match ? match[1] : trimmed);
}

function clean(value, maxLength) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : "";
}
