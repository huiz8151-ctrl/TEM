const DEFAULT_KIMI_MODEL = "kimi-k2.7-code";

export async function createPetChatReply({ message, song, mode, pet, userProfile, recentMessages }) {
  const text = String(message || "").trim().slice(0, 500);
  const safeSong = song || {};
  const safeMode = mode || {};
  const safePet = pet || {};
  const safeProfile = userProfile || {};
  const history = Array.isArray(recentMessages) ? recentMessages.slice(-8) : [];

  const modelReply = await callKimiChat({
    message: text,
    song: safeSong,
    mode: safeMode,
    pet: safePet,
    userProfile: safeProfile,
    recentMessages: history
  });
  if (modelReply) return modelReply;

  return {
    reply: avoidRepeat(buildLocalReply(text, safeSong, safeMode, safeProfile, history), history),
    provider: "local-chat"
  };
}

async function callKimiChat(payload) {
  const apiKey = process.env.LLM_API_KEY || process.env.KIMI_API_KEY;
  const baseUrl = normalizeBaseUrl(process.env.LLM_BASE_URL || process.env.KIMI_BASE_URL || "https://api.moonshot.cn");
  const model = process.env.LLM_TEXT_MODEL || process.env.KIMI_TEXT_MODEL || DEFAULT_KIMI_MODEL;
  if (!apiKey) return null;

  const messages = buildKimiMessages(payload);
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.86,
        max_completion_tokens: 140,
        messages
      })
    });

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      console.warn(`[pet-chat] Kimi chat failed: status=${response.status} model=${model} detail=${detail}`);
      return null;
    }

    const data = await response.json();
    const reply = clean(data?.choices?.[0]?.message?.content, 110);
    return reply ? { reply, provider: "kimi-chat", model } : null;
  } catch (error) {
    console.warn(`[pet-chat] Kimi chat request error: ${error.message}`);
    return null;
  }
}

function buildKimiMessages(payload) {
  const songTitle = payload.song?.title || "当前这首歌";
  const artist = payload.song?.artist || "未知歌手";
  const bpm = Math.round(payload.song?.bpm || payload.mode?.bpm || 88);
  const action = payload.mode?.action || "轻轻晃动";
  const mood = payload.mode?.mood || payload.mode?.emotion || "安静陪伴";
  const petName = payload.pet?.name || "小Q";
  const likedTags = Array.isArray(payload.userProfile?.likedTags)
    ? payload.userProfile.likedTags.slice(0, 4).join("、")
    : "";

  const system = [
    `你是音乐养成软件里的小宠物，名字叫${petName}。`,
    "你不是客服，也不是推荐算法说明。你要像正在陪用户听歌的小伙伴一样自然说话。",
    "每次只回一到两句，35到80个中文字符；不要列点，不要解释功能，不要说“结合你的状态”。",
    "回复必须接住用户刚刚说的话，可以轻轻带到当前歌曲、通勤/心情、宠物动作或节奏，但不要每次都提歌名。",
    "如果用户只是打招呼，先自然回应，再把话题交回给用户。",
    "避免重复最近说过的话；语气温柔、有一点宠物感，但不要装幼稚。"
  ].join("\n");

  const context = [
    `当前歌曲：${songTitle} - ${artist}`,
    `估计节奏：${bpm} BPM`,
    `小宠物动作：${action}`,
    `当前陪伴情绪：${mood}`,
    likedTags ? `用户近期偏好：${likedTags}` : "",
    "请直接输出小宠物要说的话。"
  ].filter(Boolean).join("\n");

  const historyMessages = payload.recentMessages
    .filter((item) => item?.text)
    .slice(-6)
    .map((item) => ({
      role: item.role === "pet" ? "assistant" : "user",
      content: String(item.text).slice(0, 200)
    }));

  return [
    { role: "system", content: system },
    { role: "system", content: context },
    ...historyMessages,
    { role: "user", content: payload.message || "陪我聊聊" }
  ];
}

function buildLocalReply(text, song, mode, profile, history) {
  const title = song.title || mode.song || "这首歌";
  const action = mode.action || "轻轻晃动";
  const bpm = Math.round(song.bpm || mode.bpm || 88);
  const tags = Array.isArray(profile.likedTags) && profile.likedTags.length
    ? profile.likedTags.slice(0, 2).join("、")
    : Array.isArray(mode.tags) ? mode.tags.slice(0, 2).join("、") : "治愈、低噪";
  const saidTired = history.some((item) => /累|疲惫|困|压力|烦/.test(item?.text || ""));

  if (/你好|在吗|哈喽|hello/i.test(text)) {
    return pick([
      "在呢，我刚把耳机戴好。你说，我听着。",
      "我在。今天想让我安静陪着，还是帮你找一点亮起来的歌？"
    ], history);
  }
  if (/好一点|好多了|没事了|舒服点/.test(text)) {
    return pick([
      "那就好。我先不吵你，陪你把这段听完。",
      "嗯，我听出来你松了一点。下一首我们可以慢慢变亮。"
    ], history);
  }
  if (/照片|拍照|图片|图像|相机/.test(text)) {
    return pick([
      "发来吧。我先看画面是冷还是暖，再给你挑一组像此刻的歌。",
      `照片给我后，我会把画面情绪和你常听的${tags}一起放进推荐里。`
    ], history);
  }
  if (/推荐|换歌|歌单|听什么/.test(text)) {
    return pick([
      `可以。我先拿《${title}》当参照，给你换一首不突兀的。`,
      "我来挑。不猛转弯，下一首会贴着你现在的心情走。"
    ], history);
  }
  if (/节奏|律动|动作|跳|摇|摆/.test(text)) {
    return pick([
      `这首大概 ${bpm} BPM。音乐真的响起来后，我再跟着鼓点动。`,
      `我不会提前乱跳。等声音进来，我再用“${action}”跟拍。`
    ], history);
  }
  if (/通勤|路上|地铁|公交|走路|车上/.test(text)) {
    return pick([
      saidTired ? "那我们继续慢一点。路上的噪声交给我挡一挡，你先喘口气。" : `路上我陪你听《${title}》。不用赶心情，慢慢到站就好。`,
      "我坐你旁边那种陪法。外面吵的话，我就帮你把歌选软一点。"
    ], history);
  }
  if (/难过|累|冷|烦|焦虑|压力|不开心|孤单/.test(text)) {
    return pick([
      "嗯，今天先别硬撑。你把心情放我这儿一点点就行。",
      `那我把动作放轻，陪你听完《${title}》。不用马上变好。`,
      "我懂。先听慢一点的，等你缓过来，我们再去亮一点的地方。"
    ], history);
  }
  if (/喜欢|收藏|好听/.test(text)) {
    return pick([
      "收到，我悄悄记一笔。你喜欢这种不太用力、但会贴近人的声音。",
      "我也觉得这首适合你。下次我会往这个方向多靠一点。"
    ], history);
  }
  return pick([
    `我在听。你这句话的颜色有点像《${title}》的前奏。`,
    "嗯，我先陪你接住这一小下。你可以继续说，不用整理得很完整。",
    "我会把这句记进今天的小心情里，等会儿推荐就不那么生硬了。"
  ], history);
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

function pick(candidates, history) {
  const previous = new Set(history.filter((item) => item?.role === "pet").map((item) => item.text));
  return candidates.find((item) => !previous.has(item)) || candidates[0];
}

function avoidRepeat(reply, history) {
  const lastPet = [...history].reverse().find((item) => item?.role === "pet")?.text || "";
  if (!lastPet || lastPet !== reply) return reply;
  return "换个说法：我还在这儿，先陪你把这一小段情绪听完。";
}

function clean(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/^["“”]+|["“”]+$/g, "")
    .replace(/^小Q[:：]\s*/, "")
    .slice(0, maxLength);
}
