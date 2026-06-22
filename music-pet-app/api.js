const wait = (value, delay = 120) =>
  new Promise((resolve) => globalThis.setTimeout(() => resolve(value), delay));

export const apiConfig = {
  baseUrl: "/api",
  endpoints: {
    home: "/music-pet/home",
    cameraAnalyze: "/music-pet/camera/analyze",
    scenes: "/music-pet/scenes",
    recommendations: "/music-pet/recommendations",
    forYou: "/music-pet/for-you",
    player: "/music-pet/player",
    diaries: "/music-pet/diaries",
    diaryDetail: "/music-pet/diaries/:id",
    profile: "/music-pet/profile",
    pet: "/music-pet/pet",
    tasks: "/music-pet/tasks"
  }
};

const songs = [
  {
    id: "sunny",
    title: "晴天",
    artist: "周杰伦",
    tag: "熟悉旋律",
    mood: "晴朗",
    cover: "green",
    detail: "Join the rhythm of the night with Echoes Sound. 这首歌保留一点明亮的回忆感，适合从安静情绪里慢慢抬头。"
  },
  {
    id: "slow-love",
    title: "慢慢喜欢你",
    artist: "莫文蔚",
    tag: "雨天治愈",
    mood: "温柔",
    cover: "blue",
    detail: "低速人声和柔软旋律会把画面里的雨声放轻，适合记录今天的心情。"
  },
  {
    id: "free",
    title: "想自由",
    artist: "林宥嘉",
    tag: "低能量",
    mood: "放空",
    cover: "lilac",
    detail: "适合在路上听，节奏不会催促你，但会给疲惫情绪留一个出口。"
  },
  {
    id: "everyday",
    title: "Everyday",
    artist: "Ariana Grande",
    tag: "轻快保留",
    mood: "提神",
    cover: "sun",
    detail: "明亮的律动让推荐不会太沉，适合从安静切到行动前的一段路。"
  }
];

const diaryItems = [
  {
    id: "rain-night",
    time: "今天 21:18",
    title: "低噪放松的一晚",
    song: "晴天 / 周杰伦",
    copy: "小Q推荐了 12 首歌，整体情绪从疲惫转向平静。",
    tags: ["平静", "晚间", "治愈"]
  },
  {
    id: "commute-green",
    time: "昨天 08:42",
    title: "通勤路上的绿色能量",
    song: "Everyday / Ariana Grande",
    copy: "照片识别为晴天街景，推荐节奏更明亮。",
    tags: ["轻快", "通勤"]
  }
];

let petState = {
  energy: 68,
  intimacy: 42,
  shards: 6,
  growth: 340
};

let taskItems = [
  { id: "listen", title: "听完 3 首推荐歌", copy: "让小Q获得音乐能量", reward: "能量 +20", done: true },
  { id: "chat", title: "和小Q聊天 1 次", copy: "提升亲密度", reward: "亲密 +12", done: true },
  { id: "diary", title: "写一篇音乐日记", copy: "沉淀今日心情", reward: "经验 +18", done: true },
  { id: "share", title: "分享音乐瞬间", copy: "获得装扮碎片", reward: "碎片 +1", done: false },
  { id: "dress", title: "切换一次陪伴装扮", copy: "让小Q记住你的偏好", reward: "亲密 +8", done: false }
];

export async function getHome() {
  return wait({
    greeting: "Hi~ 今天想听点什么\n好音乐?",
    petTitle: "音乐宠物",
    petSubtitle: "我的专属陪伴",
    mixes: [
      { title: "清晨 · 元气", count: "5 首", route: "recommendations" },
      { title: "放松 · 治愈", count: "5 首", route: "recommendations" },
      { title: "雨天 · 安静", count: "6 首", route: "recommendations" }
    ],
    scenes: [
      { title: "通勤路上", copy: "在路上慢慢切换状态" },
      { title: "城市漫游", copy: "把当下变成旅途的背景" }
    ],
    currentSong: songs[0]
  });
}

export async function getScenes() {
  return wait([
    { title: "通勤路上", copy: "在路上慢慢切换状态", mood: "提神" },
    { title: "城市漫游", copy: "把当下变成旅途的背景", mood: "陪伴" },
    { title: "跑步释放", copy: "把今天的情绪全部跑掉", mood: "释放" },
    { title: "安静放空", copy: "不急着回应世界", mood: "放空" }
  ]);
}

export async function analyzeScene() {
  return wait({
    title: "正在理解画面、光线和你的宠物状态",
    steps: ["识别画面氛围", "匹配心情标签", "生成音乐宠物反馈", "整理推荐歌单"],
    tags: ["雨天", "安静", "治愈", "怀念", "放空"]
  });
}

export async function analyzeCameraPhoto() {
  return wait({
    imageMood: "雨天",
    petFeedback: "雨天最适合慢慢听歌了，要不要我再帮你找找别的?",
    tags: ["雨天", "安静", "治愈", "怀念", "放空"],
    songs
  });
}

export async function getRecommendations() {
  return wait({
    title: "为你推荐",
    analysis: "画面里有雨后城市的低饱和色彩，适合人声靠前、节奏不急的歌曲。小Q保留了一点明亮旋律，避免情绪太沉。",
    songs
  });
}

export async function getForYou() {
  return wait({
    title: "Aesthetic Vibes",
    lead: "Aura of Peace",
    moods: ["平静", "柔和", "早起晨曦"],
    songs: [
      songs[0],
      { ...songs[1], title: "Aesthetic Soothwe", artist: "Soul Soother" },
      { ...songs[2], title: "Melanch YW dhshd", artist: "Morning Tape" }
    ]
  });
}

export async function getPlayer(songId = "sunny") {
  const song = songs.find((item) => item.id === songId) || songs[0];
  return wait({
    ...song,
    elapsed: "0:37",
    remaining: "-3:14",
    likes: 999
  });
}

export async function getDiaries() {
  return wait(diaryItems);
}

export async function getDiaryDetail(id = "rain-night") {
  return wait(diaryItems.find((item) => item.id === id) || diaryItems[0]);
}

export async function saveDiary(entry) {
  const item = {
    id: `diary-${Date.now()}`,
    time: "刚刚",
    title: entry?.title || "刚保存的音乐日记",
    song: entry?.song || "慢慢喜欢你 / 莫文蔚",
    copy: entry?.copy || "记录此刻的心情。",
    tags: ["公开", "治愈"]
  };
  diaryItems.unshift(item);
  return wait(item);
}

export async function getProfile() {
  return wait({
    name: "小Q陪听第 28 天",
    copy: "你最常在夜晚听治愈、轻快和低噪人声。",
    stats: [
      ["42", "陪听歌曲"],
      ["18", "日记"],
      ["6", "分享"]
    ],
    tags: ["低噪", "治愈", "通勤", "晚间"],
    reminder: "温柔提醒 · 每晚 21:30"
  });
}

export async function getPet() {
  return wait({
    ...petState,
    unlocked: "25/25",
    skins: ["夜冕", "梦羽", "虹翼", "樱庭", "花信", "果境", "云汐", "星屿", "月庭", "心跳", "甜烘", "星夜", "日冕"],
    actions: ["初识", "打招呼", "跟拍摇摆", "送你心心", "元气满满", "点头晃晃", "开心转圈", "安静听歌", "结束动作", "我来了", "抱抱", "偷偷看你", "摆烂躺平"]
  });
}

export async function getTasks() {
  return wait({
    progress: taskItems.filter((item) => item.done).length,
    total: taskItems.length,
    reward: "绿音铃铛碎片 ×2",
    tasks: taskItems,
    pet: petState
  });
}

export async function completeTask(taskId) {
  taskItems = taskItems.map((task) =>
    task.id === taskId ? { ...task, done: true } : task
  );
  petState = {
    energy: Math.min(100, petState.energy + 8),
    intimacy: Math.min(100, petState.intimacy + 6),
    shards: petState.shards + 1,
    growth: petState.growth + 18
  };
  return getTasks();
}
