const screen = document.querySelector("#screen");
const shell = document.querySelector(".iphone-shell");
const root = document.documentElement;

const deviceSpecs = {
  iphone14: { name: "iPhone 14", width: 390, height: 844, radius: 47 },
  iphone15: { name: "iPhone 15", width: 393, height: 852, radius: 47 },
  iphone16: { name: "iPhone 16", width: 393, height: 852, radius: 47 },
  iphone16pro: { name: "iPhone 16 Pro", width: 402, height: 874, radius: 50 }
};

const state = {
  device: "iphone16",
  brightness: 100,
  zoom: 100,
  rotated: false,
  view: "home",
  history: [],
  petTab: "skin",
  sceneMood: 0,
  skinSel: null,
  diaryEmotion: 0,
  diaryStyle: 0,
  diaryAdvOpen: false,
  navDir: "forward",
  player: { playing: true, progress: 0.16, dur: 231 },
  taskDone: [true, true, true, false, false, false, false],
  taskTotal: 7,
  diaryPublic: true,
  musicMode: "commute",
  growthPlan: null,
  isAnalyzing: false,
  photoName: "",
  photoPreview: "",
  petStore: null,
  equipMessage: "",
  currentSong: null,
  isPlaying: false,
  audioProgress: 0,
  audioCurrentTime: 0,
  audioDuration: 30,
  isSeeking: false,
  liveEnergy: 0,
  liveBeat: 0,
  playError: "",
  chatMessages: [
    { role: "pet", text: "我在这里。你可以跟我说现在的心情，也可以让我按照片、通勤或正在听的歌帮你找音乐。" },
    { role: "user", text: "今天路上有点累。" },
    { role: "pet", text: "那我陪你慢一点听。先把节奏放轻，等你缓过来我们再切到明亮一点的歌。" }
  ],
  toast: ""
};

const PIC = "./picture";
const audioPlayer = new Audio();
audioPlayer.crossOrigin = "anonymous";
let audioContext;
let audioSourceNode;
let audioAnalyser;
let audioFrequencyData;
let audioRaf = 0;
let lastBeatAt = 0;

audioPlayer.addEventListener("timeupdate", updateAudioProgress);
audioPlayer.addEventListener("durationchange", updateAudioProgress);
audioPlayer.addEventListener("ended", () => {
  state.isPlaying = false;
  state.audioProgress = 0;
  state.audioCurrentTime = 0;
  stopLiveRhythm();
  renderView({ animate: false });
});
audioPlayer.addEventListener("error", () => {
  state.isPlaying = false;
  stopLiveRhythm();
  state.playError = "试听音频暂时无法播放";
  renderView({ animate: false });
});

const OUTFIT_IDS = {
  "星屿": "xingyu",
  "月庭": "yueting",
  "虹翼": "hongyi",
  "日冕": "rimian",
  "花信": "huaxin",
  "星夜": "xingye"
};

const ACTION_IDS = {
  "点头晃晃": "nod",
  "安静听歌": "listen",
  "偷偷看你": "peek",
  "开心转圈": "spin",
  "元气满满": "cheer"
};

const MUSIC_GROWTH_MODES = {
  commute: {
    title: "通勤路上",
    song: "晴天",
    artist: "周杰伦",
    mood: "轻快陪伴",
    outfit: "星屿耳机",
    outfitImg: "lan2 2.png",
    action: "点头晃晃",
    petImg: "act2.png",
    rhythm: "steady",
    bpm: 92,
    energy: 68,
    intimacy: 42,
    growth: 340,
    shards: 6,
    speech: "我跟着城市节奏轻轻点头，帮你把通勤切到好心情。",
    unlock: "再听 2 首通勤歌单，解锁「云汐」配色",
    tags: ["通勤", "轻快", "陪伴"]
  },
  heal: {
    title: "雨天放松",
    song: "慢慢喜欢你",
    artist: "莫文蔚",
    mood: "安静治愈",
    outfit: "月庭耳机",
    outfitImg: "绿色 2.png",
    action: "安静听歌",
    petImg: "act8.png",
    rhythm: "soft",
    bpm: 74,
    energy: 46,
    intimacy: 58,
    growth: 392,
    shards: 8,
    speech: "我会安静陪你，把照片里的雨声和最近的歌都放轻一点。",
    unlock: "治愈值满 60 后，解锁「花信」温柔装扮",
    tags: ["治愈", "雨天", "低噪"]
  },
  focus: {
    title: "学习专注",
    song: "Aesthetic Vibes",
    artist: "Morning Tape",
    mood: "稳定专注",
    outfit: "虹翼耳机",
    outfitImg: "4 2.png",
    action: "偷偷看你",
    petImg: "act9.png",
    rhythm: "focus",
    bpm: 82,
    energy: 54,
    intimacy: 49,
    growth: 368,
    shards: 7,
    speech: "我会降低动作幅度，只在节拍点提醒你保持状态。",
    unlock: "连续专注 20 分钟，获得「星夜」碎片 +1",
    tags: ["专注", "Lo-fi", "低干扰"]
  },
  energy: {
    title: "运动提神",
    song: "Everyday",
    artist: "Ariana Grande",
    mood: "元气释放",
    outfit: "日冕耳机",
    outfitImg: "黄色 2.png",
    action: "开心转圈",
    petImg: "act5.png",
    rhythm: "bounce",
    bpm: 126,
    energy: 88,
    intimacy: 45,
    growth: 426,
    shards: 9,
    speech: "这首节奏更亮，我会跟着鼓点摇摆，帮你把能量提起来。",
    unlock: "完成一次运动听歌，解锁「元气满满」动作预览",
    tags: ["运动", "高能", "律动"]
  }
};

function currentGrowthMode() {
  const base = MUSIC_GROWTH_MODES[state.musicMode] || MUSIC_GROWTH_MODES.commute;
  const plan = state.growthPlan;
  if (!plan || plan.frontendMode !== state.musicMode) return base;

  const topSong = plan.songs?.[0];
  return {
    ...base,
    title: plan.moment?.sceneLabel || base.title,
    song: topSong?.title || base.song,
    artist: topSong?.artist || base.artist,
    mood: plan.pet?.mood || base.mood,
    outfit: plan.pet?.outfit || base.outfit,
    outfitImg: plan.pet?.outfitImg || base.outfitImg,
    action: plan.pet?.action || base.action,
    petImg: plan.pet?.petImg || base.petImg,
    rhythm: plan.pet?.rhythm || base.rhythm,
    bpm: topSong?.bpm || base.bpm,
    beatSpeed: plan.pet?.rhythmProfile?.speed || base.beatSpeed || 1,
    beatLift: plan.pet?.rhythmProfile?.lift || base.beatLift || 6,
    beatStrength: plan.pet?.rhythmProfile?.strength || base.energy,
    energy: plan.pet?.energy ?? base.energy,
    intimacy: plan.pet?.intimacy ?? base.intimacy,
    growth: plan.pet?.growth ?? base.growth,
    shards: plan.pet?.shards ?? base.shards,
    speech: plan.pet?.reply || base.speech,
    unlock: plan.pet?.unlock || base.unlock,
    tags: plan.intent?.musicTags?.slice(0, 3) || base.tags,
    aiReason: plan.intent?.reason,
    pipeline: plan.pipeline
  };
}

async function requestGrowthRecommendation(mode, source = "manual", imageData = "") {
  state.isAnalyzing = true;
  renderView({ animate: false });

  try {
    const response = await fetch("/api/music-pet/recommendation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode,
        sceneId: mode,
        photoHint: source === "photo" ? "photo-rain" : undefined,
        imageData,
        imageName: state.photoName,
        petState: {
          energy: currentGrowthMode().energy,
          intimacy: currentGrowthMode().intimacy,
          growth: currentGrowthMode().growth,
          shards: currentGrowthMode().shards
        }
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const plan = await response.json();
    state.musicMode = plan.frontendMode || mode;
    state.growthPlan = plan;
    if (plan.songs?.[0]) {
      state.currentSong = {
        ...plan.songs[0],
        sceneId: plan.moment?.sceneId || state.musicMode
      };
      state.playError = "";
      state.toast = "";
    }
    fetchUserState();
    if (source === "photo") navigateTo("photoresult");
    if (source === "player") {
      state.view = "player";
    }
  } catch {
    state.growthPlan = null;
  } finally {
    state.isAnalyzing = false;
    renderView({ animate: false });
  }
}

async function fetchUserState() {
  try {
    const response = await fetch("/api/music-pet/state");
    if (!response.ok) return;
    state.petStore = await response.json();
    renderView({ animate: false });
  } catch {
    // Preview can still run without persisted state.
  }
}

/* ---------- Shared chrome ---------- */

function statusBar() {
  return `
    <header class="ai-status">
      <img src="${PIC}/Status Bar.svg" alt="">
    </header>`;
}

function bottomNav(active) {
  return `
    <nav class="ai-bottom-nav" aria-label="底部导航">
      <button type="button" data-nav="home" class="${active === "home" ? "active" : ""}">
        <img src="${PIC}/首页 1.svg" alt="">
        <span>首页</span>
      </button>
      <button type="button" data-nav="video" class="${active === "video" ? "active" : ""}">
        <img src="${PIC}/视频 1.svg" alt="">
        <span>视频</span>
      </button>
      <button type="button" class="center ${active === "chat" ? "active" : ""}" data-nav="chat" aria-label="对话">
        <img src="${PIC}/Ellipse 13219.svg" alt="">
        <img class="center-glyph" src="${PIC}/Icon.svg" alt="">
      </button>
      <button type="button" data-nav="community" class="${active === "community" ? "active" : ""}">
        <img src="${PIC}/交流 1.svg" alt="">
        <span>社区</span>
      </button>
      <button type="button" data-nav="profile" class="${active === "profile" ? "active" : ""}">
        <img src="${PIC}/我的 1.svg" alt="">
        <span>我的</span>
      </button>
      <i aria-hidden="true"></i>
    </nav>`;
}

function miniPlayer() {
  const mode = currentGrowthMode();
  const song = state.currentSong;
  return `
    <button class="ai-mini-player" type="button" data-nav="player">
      <img src="${song?.coverUrl || `${PIC}/Mini Player/Cover.png`}" alt="">
      <span><strong>${mode.song}</strong><em>${mode.artist} · ${mode.mood}</em></span>
      <i class="mini-play ${state.isPlaying ? "playing" : ""}" aria-hidden="true"></i>
      <i class="mini-menu" aria-hidden="true"></i>
    </button>`;
}

function encodeSong(song, sceneId) {
  return encodeURIComponent(JSON.stringify({
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album || "",
    bpm: song.bpm || 90,
    coverUrl: song.coverUrl || "",
    previewUrl: song.previewUrl || "",
    sourcePreviewUrl: song.sourcePreviewUrl || "",
    externalUrl: song.externalUrl || "",
    platform: song.platform || "",
    sceneId
  }));
}

function readSongFromButton(button) {
  if (button.dataset.songPayload) {
    try {
      return JSON.parse(decodeURIComponent(button.dataset.songPayload));
    } catch {
      // Fall through to legacy attributes.
    }
  }
  return {
    id: button.dataset.listenSong,
    title: button.dataset.songTitle,
    artist: button.dataset.songArtist,
    sceneId: button.dataset.songScene,
    previewUrl: button.dataset.songPreview || "",
    sourcePreviewUrl: button.dataset.songSourcePreview || "",
    coverUrl: button.dataset.songCover || ""
  };
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function updateAudioProgress() {
  const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
    ? audioPlayer.duration
    : 30;
  state.audioDuration = duration;
  state.audioCurrentTime = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0;
  state.audioProgress = Math.max(0, Math.min(1, state.audioCurrentTime / duration));
  if (state.view === "player" && !state.isSeeking) {
    syncPlayerDom();
  }
}

function primeAudioSource() {
  const src = state.currentSong?.previewUrl;
  if (!src) return;
  const absoluteSrc = new URL(src, window.location.href).href;
  if (audioPlayer.src !== absoluteSrc) {
    audioPlayer.src = absoluteSrc;
    audioPlayer.load();
  }
}

function setupAudioAnalysis() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextCtor();
  }
  if (!audioSourceNode) {
    audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 512;
    audioAnalyser.smoothingTimeConstant = 0.72;
    audioSourceNode.connect(audioAnalyser);
    audioAnalyser.connect(audioContext.destination);
    audioFrequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
  }
  return audioContext;
}

function startLiveRhythm() {
  const context = setupAudioAnalysis();
  if (!context || !audioAnalyser) return;
  context.resume?.();
  window.cancelAnimationFrame(audioRaf);

  const tick = () => {
    if (!state.isPlaying || !audioAnalyser) return;
    audioAnalyser.getByteFrequencyData(audioFrequencyData);
    const bassBins = audioFrequencyData.slice(0, 18);
    const midBins = audioFrequencyData.slice(18, 72);
    const bass = averageArray(bassBins) / 255;
    const mid = averageArray(midBins) / 255;
    const energy = Math.min(1, bass * 0.68 + mid * 0.32);
    const now = performance.now();
    const isBeat = energy > Math.max(0.34, state.liveEnergy + 0.1) && now - lastBeatAt > 180;
    if (isBeat) lastBeatAt = now;
    state.liveEnergy = state.liveEnergy * 0.72 + energy * 0.28;
    state.liveBeat = isBeat ? 1 : Math.max(0, state.liveBeat * 0.86);
    updateLivePetDom();
    audioRaf = window.requestAnimationFrame(tick);
  };

  audioRaf = window.requestAnimationFrame(tick);
}

function stopLiveRhythm() {
  window.cancelAnimationFrame(audioRaf);
  state.liveEnergy = 0;
  state.liveBeat = 0;
  updateLivePetDom();
}

function averageArray(values) {
  if (!values?.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function updateLivePetDom() {
  const pet = screen.querySelector(".player-pet-companion");
  const stage = screen.querySelector(".player-pet-stage");
  if (!pet && !stage) return;
  const lift = Math.round(4 + state.liveEnergy * 18 + state.liveBeat * 10);
  const scale = (1 + state.liveEnergy * 0.09 + state.liveBeat * 0.08).toFixed(3);
  const rotate = Math.round((state.liveBeat ? 1 : -1) * (2 + state.liveEnergy * 7));
  [pet, stage].filter(Boolean).forEach((el) => {
    el.style.setProperty("--live-lift", `${lift}px`);
    el.style.setProperty("--live-scale", scale);
    el.style.setProperty("--live-rotate", `${rotate}deg`);
    el.style.setProperty("--live-bar-scale", (0.72 + state.liveEnergy * 0.7 + state.liveBeat * 0.35).toFixed(3));
    el.classList.toggle("live-beat", state.liveBeat > 0.35);
  });
}

function seekAudioFromEvent(event) {
  const track = screen.querySelector("[data-seek-track]");
  const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0
    ? audioPlayer.duration
    : state.audioDuration;
  if (!track || !duration) return;
  const rect = track.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  primeAudioSource();
  audioPlayer.currentTime = ratio * duration;
  updateAudioProgress();
  syncPlayerDom();
}

function playbackErrorMessage(error) {
  const message = String(error?.message || "");
  if (/interact|gesture|allowed|play\(\) failed/i.test(message)) {
    return "浏览器需要你再点一次播放键";
  }
  if (/supported source|format|decode|MEDIA_ERR_SRC_NOT_SUPPORTED/i.test(message)) {
    return "试听源格式暂时不可用，已尝试备用源";
  }
  if (/network|fetch|load|404|403|cors/i.test(message)) {
    return "试听源连接不稳定，请换一首试试";
  }
  return "试听暂时没有开始，请再点一次播放键";
}

function isPlaybackGestureError(error) {
  return /interact|gesture|allowed|play\(\) failed/i.test(String(error?.message || ""));
}

async function playCurrentSong() {
  const song = state.currentSong;
  if (!song?.previewUrl) {
    state.isPlaying = false;
    state.playError = "这首歌没有可用试听片段";
    renderView({ animate: false });
    return;
  }
  state.playError = "";
  try {
    await playAudioSource(song.previewUrl);
    state.isPlaying = true;
  } catch (error) {
    if (!isPlaybackGestureError(error) && song.sourcePreviewUrl && audioPlayer.src !== song.sourcePreviewUrl) {
      try {
        await playAudioSource(song.sourcePreviewUrl);
        state.isPlaying = true;
      } catch (fallbackError) {
        state.isPlaying = false;
        state.playError = playbackErrorMessage(fallbackError || error);
      }
    } else {
      state.isPlaying = false;
      state.playError = playbackErrorMessage(error);
    }
  }
  renderView({ animate: false });
}

async function playAudioSource(src) {
  const absoluteSrc = new URL(src, window.location.href).href;
  if (audioPlayer.src !== absoluteSrc) {
    audioPlayer.src = absoluteSrc;
  }
  await audioPlayer.play();
  state.isPlaying = true;
  startLiveRhythm();
  updateAudioProgress();
}

function togglePlayback() {
  if (state.isPlaying) {
    audioPlayer.pause();
    state.isPlaying = false;
    stopLiveRhythm();
    renderView({ animate: false });
    return;
  }
  playCurrentSong();
}

function pickPlayableSong() {
  const songs = state.growthPlan?.songs || [];
  const song = songs.find((item) => item.previewUrl) || songs[0];
  if (!song) return null;
  return {
    ...song,
    sceneId: state.growthPlan?.moment?.sceneId || state.musicMode
  };
}

function navigateTo(next, options = {}) {
  if (!next || next === state.view) return;
  if (next === "back") {
    state.view = state.history.pop() || fallbackBackView(state.view);
    renderView();
    return;
  }
  if (options.push !== false) {
    state.history.push(state.view);
  }
  if (next === "player" && !state.currentSong?.previewUrl) {
    const playableSong = pickPlayableSong();
    if (playableSong?.previewUrl) {
      state.currentSong = playableSong;
      state.playError = "";
    } else {
      state.toast = "正在加载可试听歌曲";
      requestGrowthRecommendation(state.musicMode, "player");
      return;
    }
  }
  if (next === "player") {
    primeAudioSource();
  }
  if (next === "analyze") {
    state.view = "analyze";
    requestGrowthRecommendation(state.musicMode);
    return;
  }
  state.view = next;
  renderView();
}

function fallbackBackView(view) {
  return {
    player: "home",
    results: "scene",
    photoresult: "home",
    analyze: "scene",
    recwheel: "results",
    diary: "player",
    diarylog: "diary",
    profile: "home",
    petskin: "profile",
    tasks: "petskin",
    chat: "home",
    scene: "home"
  }[view] || "home";
}

function paintToast() {
  let el = screen.querySelector(".app-toast");
  if (!state.toast) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.className = "app-toast";
    screen.appendChild(el);
  }
  el.textContent = state.toast;
  requestAnimationFrame(() => el.classList.add("show"));
}

function showActionToast(message) {
  state.toast = message;
  state.equipMessage = message;
  paintToast();
  window.clearTimeout(showActionToast.timer);
  showActionToast.timer = window.setTimeout(() => {
    state.toast = "";
    paintToast();
  }, 1400);
}

function currentPlaylist() {
  return state.growthPlan?.songs?.length ? state.growthPlan.songs : [];
}

function playSongFromState(song) {
  if (!song) return;
  state.currentSong = {
    ...song,
    sceneId: state.growthPlan?.moment?.sceneId || state.musicMode
  };
  state.playError = "";
  renderView({ animate: false });
  playCurrentSong();
}

function handlePlayerAction(action) {
  const song = state.currentSong;
  if (action === "prev" || action === "next") {
    const songs = currentPlaylist();
    if (!songs.length) {
      showActionToast("暂无可切换歌曲");
      return;
    }
    const currentIndex = Math.max(0, songs.findIndex((item) => item.id === song?.id));
    const offset = action === "next" ? 1 : -1;
    const nextIndex = (currentIndex + offset + songs.length) % songs.length;
    playSongFromState(songs[nextIndex]);
    return;
  }

  const actionMap = {
    favorite: ["favorite", "已喜欢这首歌"],
    collect: ["favorite", "已加入收藏"],
    share: ["share", "已生成分享记录"],
    detail: ["listen", song?.externalUrl ? "已打开歌曲详情" : "暂无外部详情"],
    more: ["listen", "更多功能稍后开放"]
  };
  const [recordAction, message] = actionMap[action] || ["listen", "已记录"];

  if (song?.externalUrl && action === "detail") {
    window.open(song.externalUrl, "_blank", "noopener,noreferrer");
  }

  if (song?.id) {
    fetch("/api/music-pet/listening-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songId: song.id,
        title: song.title,
        artist: song.artist,
        sceneId: song.sceneId || state.musicMode,
        action: recordAction
      })
    }).catch(() => {});
  }
  showActionToast(message);
}

function renderGrowthMeter(label, value) {
  return `
    <div class="growth-meter">
      <span>${label}</span>
      <strong>${value}</strong>
      <i><b style="width:${Math.min(100, value)}%"></b></i>
    </div>`;
}

function renderMusicGrowthPanel() {
  const mode = currentGrowthMode();
  const moment = state.growthPlan?.moment;
  const providerText = state.growthPlan?.moment?.provider === "kimi-vision"
    ? "Kimi 多模态识别"
    : state.photoName
      ? "本地照片策略识别"
      : "听歌状态推断";
  const modelError = moment?.modelError ? " · 模型回退" : "";
  const profileText = state.growthPlan?.userProfile
    ? `融合 ${state.growthPlan.userProfile.historySize} 条历史 · ${state.growthPlan.userProfile.likedTags.slice(0, 2).join("/")}`
    : state.petStore?.userProfile
      ? `融合 ${state.petStore.userProfile.historySize} 条历史 · ${state.petStore.userProfile.likedTags.slice(0, 2).join("/")}`
      : "";
  return `
    <section class="music-growth-card" aria-label="音乐养成状态">
      <header class="growth-head">
        <span>今日养成</span>
        <strong>${state.isAnalyzing ? "AI 正在理解此刻" : mode.mood}</strong>
      </header>

      <div class="growth-pet-stage">
        <img class="growth-pet beat-${mode.rhythm}" style="--beat-speed:${mode.beatSpeed || 1}s;--beat-lift:${mode.beatLift || 6}px" src="${PIC}/${mode.petImg}" alt="音乐宠物动作">
        <img class="growth-outfit" src="${PIC}/${mode.outfitImg}" alt="${mode.outfit}">
        <span class="growth-bpm">${mode.bpm} BPM</span>
      </div>

      <div class="growth-copy">
        <h3>${mode.title}</h3>
        <p>${mode.speech}</p>
        <small class="growth-source">${providerText}${modelError}${state.photoName ? ` · ${state.photoName}` : ""}</small>
        ${profileText ? `<small class="growth-source profile">${profileText}</small>` : ""}
        <div class="growth-tags">
          ${mode.tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </div>

      <div class="growth-stats">
        ${renderGrowthMeter("能量", mode.energy)}
        ${renderGrowthMeter("亲密", mode.intimacy)}
        ${renderGrowthMeter("成长", Math.round(mode.growth / 5))}
      </div>

      <div class="growth-unlock">
        <span>当前装扮：${mode.outfit}</span>
        <strong>${mode.aiReason || mode.unlock}</strong>
      </div>

      <div class="growth-modes" role="list" aria-label="切换听歌状态">
        ${Object.entries(MUSIC_GROWTH_MODES).map(([id, item]) => `
          <button class="${id === state.musicMode ? "active" : ""}" type="button" data-music-mode="${id}" role="listitem">
            <span>${item.title}</span>
            <em>${item.action}</em>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

/* Two big scene cards — shared by home and the scene-selection page */
/* 5 种心情 × 专属场景卡（数据驱动；用现有图片 + 粉彩 emoji 徽标） */
const SCENE_DATA = [
  { key: "放空", sub: "让思绪慢慢漂走，听点轻盈的 ☁", cards: [
    { img: "Photo/City haze.png", title: "城市漫游", sub: "把当下变成旅途的背景", emoji: "🌧", bg: "var(--pastel-sky)" },
    { img: "mood-2.png", title: "云端发呆", sub: "什么都不想的此刻", emoji: "☁️", bg: "var(--pastel-lilac)" }
  ] },
  { key: "专注", sub: "屏蔽干扰，进入心流 🎯", cards: [
    { img: "Change Image Here.png", title: "通勤路上", sub: "在路上慢慢切换状态", emoji: "🎧", bg: "var(--pastel-mint)" },
    { img: "mood-3.png", title: "深夜书桌", sub: "一首歌的专注", emoji: "📖", bg: "var(--pastel-peach)" }
  ] },
  { key: "提神", sub: "来点明亮的节奏，唤醒状态 ⚡", cards: [
    { img: "mood-1.png", title: "清晨元气", sub: "用阳光开启一天", emoji: "🌅", bg: "var(--pastel-peach)" },
    { img: "mood-5.png", title: "街头律动", sub: "踩着节拍往前走", emoji: "🎵", bg: "var(--pastel-mint)" }
  ] },
  { key: "陪伴", sub: "小Q陪你，不孤单 🐾", cards: [
    { img: "mood-4.png", title: "治愈时刻", sub: "有人懂你的心情", emoji: "💚", bg: "var(--pastel-mint)" },
    { img: "Photo/City haze.png", title: "雨天独处", sub: "和小Q一起听雨", emoji: "☔", bg: "var(--pastel-sky)" }
  ] },
  { key: "释放", sub: "把情绪都交给音乐 🔥", cards: [
    { img: "mood-5.png", title: "尽情奔跑", sub: "把今天的情绪跑掉", emoji: "🏃", bg: "var(--pastel-peach)" },
    { img: "mood-1.png", title: "放声大笑", sub: "卸下所有重量", emoji: "✨", bg: "var(--pastel-lilac)" }
  ] }
];

function sceneCard(card, target) {
  return `
    <article class="scene-card" data-nav="${target}">
      <div class="sc-photo" style="background-image:url('${PIC}/${card.img}')"></div>
      <span class="sc-badge-emoji" style="background:${card.bg}">${card.emoji}</span>
      <div class="sc-text">
        <strong>${card.title}</strong>
        <em>${card.sub}</em>
      </div>
    </article>`;
}

/* 首页“场景推荐”：跨心情精选 3 张，点击进入场景选择页 */
function sceneCards() {
  const picks = [SCENE_DATA[1].cards[0], SCENE_DATA[0].cards[0], SCENE_DATA[2].cards[0]];
  return picks.map((c) => sceneCard(c, "scene")).join("");
}

/* ---------- Home (在听首页) ---------- */

function renderHome() {
  const mode = currentGrowthMode();
  return `
    <section class="ai-work-content" aria-label="AI参赛作品：在听首页">
      <div class="ai-work-frame" data-node-id="356:9307">
        <div class="ai-search-row">
          <label class="ai-search">
            <img src="${PIC}/搜索 1.svg" alt="">
            <input class="ai-search-input" type="text" placeholder="搜索歌曲 / 歌手 / 歌单">
          </label>
          <img class="ai-sound" src="${PIC}/disc.svg" alt="">
        </div>

        <section class="ai-hero">
          <img class="ai-pet beat-${mode.rhythm}" style="--beat-speed:${mode.beatSpeed || 1}s;--beat-lift:${mode.beatLift || 6}px" src="${PIC}/${mode.petImg}" alt="音乐宠物">
          <div class="ai-speech">
            <p>${mode.mood}<br>${mode.action}<br>${mode.bpm} BPM</p>
          </div>
          <button class="ai-pet-link" type="button" data-nav="profile">
            <strong>音乐宠物 〉</strong>
            <span>陪你发现此刻的好音乐</span>
            <span>听歌会改变心情、动作和装扮</span>
            <span>当前碎片 ${mode.shards} · 成长值 ${mode.growth}</span>
          </button>
        </section>

        <button class="ai-photo-cta" type="button" data-ai-analyze="photo">
          <span class="ai-camera-box">
            <img src="${PIC}/拍照 1.svg" alt="">
          </span>
          <strong>${state.photoName ? "重新识别照片" : "拍照推荐"}</strong>
          <em>${state.photoName || "上传或拍照，为此刻推荐"}</em>
          <b>〉</b>
        </button>
        <input class="photo-file-input" data-photo-input type="file" accept="image/png,image/jpeg,image/webp,image/gif">

        ${renderMusicGrowthPanel()}

        <section class="ai-scene-section">
          <header class="ai-section-title ai-scene-title">
            <h2>场景推荐</h2>
            <button type="button" data-nav="scene">更多 〉</button>
            <p class="ai-scene-sub">Find your scene</p>
          </header>

          <div class="ai-scene-track">
            ${sceneCards()}
          </div>
        </section>

        <section class="ai-recommend-section">
          <header class="ai-section-title ai-recommend-title">
            <h2>为此刻推荐</h2>
            <button type="button">更多 〉</button>
          </header>

          <div class="ai-playlists">
            <button class="playlist-card morning" type="button" data-music-mode="commute">
              <span></span><strong>清晨 · 元气</strong><em>32 首</em><b>▶</b>
            </button>
            <button class="playlist-card relax" type="button" data-music-mode="heal">
              <span></span><strong>放松 · 治愈</strong><em>28 首</em><b>▶</b>
            </button>
            <button class="playlist-card rain" type="button" data-music-mode="focus">
              <span></span><strong>雨天 · 安静</strong><em>30 首</em><b>▶</b>
            </button>
          </div>
          <button class="ai-more-note" type="button" data-toast="更多内容即将上线">更多 〉</button>
        </section>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("home")}
  `;
}

function renderPhotoResult() {
  const mode = currentGrowthMode();
  const plan = state.growthPlan;
  const moment = plan?.moment;
  const songs = plan?.songs || [];
  return `
    <section class="ai-work-content" aria-label="拍照推荐结果">
      <div class="photo-result-page">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">此刻音乐报告</h1>

        <section class="pr-hero">
          <div class="pr-photo">
            ${state.photoPreview ? `<img src="${state.photoPreview}" alt="上传照片">` : `<span>PHOTO</span>`}
          </div>
          <div class="pr-summary">
            <span>${moment?.provider === "kimi-vision" ? "Kimi 多模态" : "多模态回退"}</span>
            <h2>${moment?.sceneLabel || mode.title}</h2>
            <p>${moment?.emotion || mode.speech}</p>
          </div>
        </section>

        <section class="pr-card pr-tags">
          <strong>AI 识别到</strong>
          <div>${(moment?.visualSignals || mode.tags).map((tag) => `<span>${tag}</span>`).join("")}</div>
        </section>

        <section class="pr-card pr-tags">
          <strong>融合用户库</strong>
          <div>${(plan?.userProfile?.likedTags || []).slice(0, 6).map((tag) => `<span>${tag}</span>`).join("")}</div>
        </section>

        <section class="pr-card pr-pet">
          <img class="beat-${mode.rhythm}" style="--beat-speed:${mode.beatSpeed || 1}s;--beat-lift:${mode.beatLift || 6}px" src="${PIC}/${mode.petImg}" alt="">
          <div>
            <strong>${mode.mood} · ${mode.action}</strong>
            <p>${mode.speech}</p>
          </div>
        </section>

        <section class="pr-card pr-songs">
          <strong>推荐歌单</strong>
          ${songs.slice(0, 3).map((song, index) => `
            <button type="button" data-listen-song="${song.id}" data-song-title="${song.title}" data-song-artist="${song.artist}" data-song-scene="${moment?.sceneId || state.musicMode}" data-song-payload="${encodeSong(song, moment?.sceneId || state.musicMode)}">
              <b>${index + 1}</b>
              <span>${song.title}<em>${song.artist} · ${song.bpm} BPM · ${song.matchReason}</em></span>
            </button>
          `).join("")}
        </section>

        <section class="pr-card pr-growth">
          <strong>养成变化</strong>
          <p>${plan?.pet?.growthExplanation || mode.unlock}</p>
          <small>能量 ${mode.energy} · 亲密 ${mode.intimacy} · 成长 ${mode.growth}</small>
        </section>
      </div>
    </section>
    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("scene")}
  `;
}

/* ---------- Scene selection (场景选择) ---------- */

const SCENE_TABS = ["放空", "专注", "提神", "陪伴", "释放"];

function renderScene() {
  return `
    <section class="ai-work-content" aria-label="场景选择">
      <div class="scene-page" data-node-id="372:9819">
        <header class="scene-head">
          <button class="scene-back" type="button" data-nav="back" aria-label="返回">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="#0a0e0e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1>场景选择</h1>
          <button class="scene-more" type="button" aria-label="更多" data-toast="更多选项开发中">
            <i></i><i></i><i></i>
          </button>
        </header>

        <div class="scene-prompt">
          <img class="scene-prompt-spark" src="${PIC}/Group 145.svg" alt="">
          <input class="scene-prompt-input" type="text" value="我在跑步，想把今天的情绪全部跑掉" placeholder="说说此刻的状态…">

          <button class="scene-prompt-cam" type="button" aria-label="拍照">
            <svg viewBox="0 0 26 24" width="26" height="24" aria-hidden="true">
              <rect x="1.2" y="5" width="23.6" height="17" rx="4" fill="none" stroke="#0a0e0e" stroke-width="1.7"/>
              <path d="M8 5l1.6-2.6h6.8L18 5" fill="none" stroke="#0a0e0e" stroke-width="1.7" stroke-linejoin="round"/>
              <circle cx="13" cy="13.4" r="4.1" fill="none" stroke="#0a0e0e" stroke-width="1.7"/>
              <path d="M21 2.4v4M19 4.4h4" fill="none" stroke="#0a0e0e" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="scene-tabs">
          ${SCENE_DATA.map((m, i) => `<button type="button" class="scene-tab${i === state.sceneMood ? " active" : ""}" data-scenemood="${i}">${m.key}</button>`).join("")}
        </div>

        <h2 class="scene-section-title">选择你的此刻状态</h2>
        <p class="scene-section-sub">${SCENE_DATA[state.sceneMood].sub}</p>

        <div class="ai-scene-track scene-track-page">
          ${SCENE_DATA[state.sceneMood].cards.map((c) => sceneCard(c, "analyze")).join("")}
        </div>
      </div>
    </section>

    ${statusBar()}

    <button class="scene-cta" type="button" data-nav="analyze">查看推荐结果</button>

    ${bottomNav("scene")}
  `;
}

/* ---------- AI analyzing (AI分析中) ---------- */

const ANALYZE_STEPS = [
  { label: "识别画面氛围", done: true },
  { label: "匹配心情标签", done: true },
  { label: "生成音乐宠物反馈", done: true },
  { label: "整理推荐歌单", done: false }
];

function renderAnalyze() {
  return `
    <section class="ai-work-content" aria-label="AI分析中">
      <div class="analyze-page" data-node-id="395:9359">
        <header class="analyze-head">
          <button class="scene-back" type="button" data-nav="back" aria-label="返回">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="#0a0e0e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1>AI分析中</h1>
        </header>

        <img class="analyze-pet" src="${PIC}/33.png" alt="音乐宠物">

        <div class="analyze-progress"><i></i></div>

        <div class="analyze-banner">正在理解画面、光线和你的宠物状态</div>

        <div class="analyze-card">
          <h2>推荐生成进度</h2>
          <ul class="analyze-steps">
            ${ANALYZE_STEPS.map((s, i) => `
            <li class="${s.done ? "done" : "pending"}">
              <img src="${PIC}/step-dot${s.done ? i : 3}.svg" alt="">
              <span>${s.label}</span>
            </li>`).join("")}
          </ul>
        </div>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("scene")}
  `;
}

/* ---------- Song recommendations (歌曲推荐 / AI拍照推荐) ---------- */

const REC_MOODS = ["雨天", "安静", "治愈", "怀念", "放空"];

const REC_SONGS = [
  { id: "fallback-slow-love", title: "慢慢喜欢你", artist: "莫文蔚", cover: "#141f29", active: true },
  { id: "fallback-free", title: "想自由", artist: "林宥嘉", cover: "#bfcccc" },
  { id: "fallback-everyday", title: "Everyday", artist: "Ariana Grande", cover: "#bfcccc" }
];

function resultsSongs() {
  const songs = state.growthPlan?.songs?.length ? state.growthPlan.songs : REC_SONGS;
  return [...songs]
    .sort((a, b) => Number(Boolean(b.previewUrl)) - Number(Boolean(a.previewUrl)))
    .slice(0, 3);
}

function songRow(song, i) {
  const top = 451 + i * 58;
  const sceneId = state.growthPlan?.moment?.sceneId || state.musicMode;
  const playable = Boolean(song.previewUrl);
  const coverStyle = song.coverUrl
    ? `background-image:url('${song.coverUrl}');background-size:cover;background-position:center`
    : `background:${song.cover || "#bfcccc"}`;
  return `
    <button class="song-row" type="button" style="top:${top}px" data-listen-song="${song.id}" data-song-title="${song.title}" data-song-artist="${song.artist}" data-song-scene="${sceneId}" data-song-payload="${encodeSong(song, sceneId)}">
      <div class="song-cover" style="${coverStyle}"></div>
      <span class="song-title">${song.title}</span>
      <span class="song-artist">${song.artist}${playable ? "" : " · 暂无试听"}</span>
      ${song.active || playable ? `<span class="song-play-active" aria-hidden="true"></span>` : `<span class="song-play" aria-hidden="true"></span>`}
      <span class="song-dots">...</span>
    </button>`;
}

function renderResults() {
  const songs = resultsSongs();
  const listEnd = 451 + songs.length * 58;
  const mascotTop = listEnd + 8;
  const pageH = listEnd + 260;
  return `
    <section class="ai-work-content" aria-label="歌曲推荐">
      <div class="results-page" data-node-id="365:9389" style="min-height:${pageH}px">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">歌曲推荐</h1>
        <button class="results-more" type="button" aria-label="更多" data-toast="更多功能开发中">...</button>

        <div class="results-photo">
          <div class="results-photo-img" style="background-image:url('${PIC}/Photo/City haze.png')"></div>
          <div class="results-mood-input"><input class="results-mood-field" type="text" placeholder="写点此刻心情"></div>
          <button class="results-edit" type="button" aria-label="编辑">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5zM20.7 6.3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0L16 5l3.5 3.5 1.2-1.2z" fill="#2a2a2a"/></svg>
          </button>
        </div>

        <div class="results-ai-card"></div>
        <span class="results-ai-label">AI 分析</span>
        ${REC_MOODS.map((t, i) => `<span class="mood-chip mc${i}">${t}</span>`).join("")}

        <span class="results-rec-label">为你推荐</span>
        <button class="results-more-link" type="button" data-nav="recwheel">查看更多 〉</button>

        ${songs.map((s, i) => songRow(s, i)).join("")}

        <div class="results-mascot" style="top:${mascotTop}px"><img src="${PIC}/33.png" alt=""></div>
        <div class="results-bubble" style="top:${mascotTop - 8}px">
          <p>雨天最适合慢慢听歌了☁</p>
          <p>要不要我再帮你找找别的?</p>
        </div>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("scene")}
  `;
}

/* ---------- 为你推荐 · 情绪卡片转盘 (ai推荐歌曲生成) ---------- */

/* rotated-bbox wrapper: a = [left, top, width, height] AABB; inner is the rotated child */
function rw(a, inner) {
  return `<div class="rw" style="left:${a[0]}px;top:${a[1]}px;width:${a[2]}px;height:${a[3]}px">${inner}</div>`;
}

const MOOD_CARDS = [
  { rot: "r-30", card: [-44.69, -18.71, 288.711, 226.698], img: [107.29, -14.45, 133.467, 133.467], src: "mood-1.png", chip: [102, -22, 72.139, 61.35], chipBg: "#f7e853", chipColor: "#fff", chipText: "平静", label: [-12.94, 78.24, 111.87, 95.765], l1: "Aesthetic", l2: "Soothwe" },
  { rot: "r-15", card: [11.43, 163.19, 290.952, 171.151], img: [179.905, 167.01, 119.663, 119.663], src: "mood-2.png", chip: [189, 148, 70.263, 49.42], chipBg: "#212332", chipColor: "#fff", chipText: "平静", label: [39.71, 229.11, 96.08, 74.16], l1: "Soul", l2: "Soother" },
  { rot: "r15", card: [9.35, 480.21, 290.952, 171.151], img: [177.825, 527.88, 119.663, 119.663], src: "mood-4.png", chip: [222, 506, 70.263, 49.42], chipBg: "#f7e853", chipColor: "#000", chipText: "柔和", label: [38.18, 509.22, 85.455, 71.313], l1: "Aura of", l2: "Peace" },
  { rot: "r30", card: [-52, 599, 288.711, 226.698], img: [100.01, 688.71, 133.467, 133.467], src: "mood-5.png", chip: [151.005, 673, 72.139, 61.35], chipBg: "#c2fc4a", chipColor: "#000", chipText: "柔和", label: [-19.15, 631.88, 116.201, 98.265], l1: "Melanch", l2: "YW dhshd" }
];

function moodCard(c) {
  return (
    rw(c.card, `<div class="rcard ${c.rot}"></div>`) +
    rw(c.img, `<div class="rimg ${c.rot}" data-nav="player"><img src="${PIC}/${c.src}" alt=""><span class="card-play"></span></div>`) +
    rw(c.chip, `<div class="rchip ${c.rot}" style="background:${c.chipBg};color:${c.chipColor}">${c.chipText}</div>`) +
    rw(c.label, `<div class="rlabel ${c.rot}">${c.l1}<br>${c.l2}</div>`)
  );
}

const EQ_WIDTHS = [9.978, 9.978, 9.978, 9.978, 9.978, 12.473, 14.967, 21.204, 14.967, 12.473, 9.978, 9.978, 9.978, 9.978, 9.978];

function eqBars() {
  const top0 = 352.78;
  const step = 7.485;
  const right = 369.6;
  return EQ_WIDTHS.map((w, i) =>
    `<i class="eqbar${i === 7 ? " on" : ""}" style="top:${(top0 + i * step).toFixed(2)}px;left:${(right - w).toFixed(2)}px;width:${w}px;animation-delay:${(Math.abs(i - 7) * 0.07).toFixed(2)}s"></i>`
  ).join("");
}

function renderRecwheel() {
  return `
    <section class="ai-work-content" aria-label="为你推荐">
      <div class="recwheel-page" data-node-id="372:10236">
        ${MOOD_CARDS.map(moodCard).join("")}

        <div class="rc-center-card"></div>
        <div class="rc-center-img"><img src="${PIC}/mood-3.png" alt=""></div>
        <span class="rc-pause p1"></span>
        <span class="rc-pause p2"></span>
        <div class="eqwrap">${eqBars()}</div>
        <div class="rc-chip">早起晨曦</div>
        <div class="rc-label">Aesthetic<br>Vibes</div>

        <a class="rec-mini" data-nav="player" data-node-id="372:10295">
          <img class="rec-mini-cover" src="${PIC}/Mini Player/Cover.png" alt="">
          <span class="rec-mini-title">晴天</span>
          <span class="rec-mini-artist">周杰伦</span>
          <span class="rec-plus" aria-hidden="true"></span>
          <span class="rec-pause" aria-hidden="true"></span>
        </a>

        <div class="rec-topfade"></div>
        <img class="rec-status" src="${PIC}/Status Bar.svg" alt="">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">为你推荐</h1>
        <button class="results-more" type="button" aria-label="更多" data-toast="更多功能开发中">...</button>
        <div class="rec-home" aria-hidden="true"></div>
      </div>
    </section>
  `;
}

/* ---------- 在线听 · 播放页 (听歌) ---------- */

function renderPlayer() {
  const mode = currentGrowthMode();
  const song = state.currentSong || {
    title: mode.song,
    artist: mode.artist,
    album: mode.mood,
    coverUrl: `${PIC}/Change Image Here.png`,
    bpm: mode.bpm,
    previewUrl: ""
  };
  const statusText = state.playError || (song.previewUrl ? "30 秒试听片段" : "当前歌曲暂无试听链接");
  const bpm = Math.round(song.bpm || mode.bpm || 88);
  const energy = Math.max(0, Math.min(100, Math.round(song.energy ?? mode.energy ?? 60)));
  const valence = Math.max(0, Math.min(100, Math.round(song.valence ?? mode.beatStrength ?? 58)));
  const beatSpeed = Math.max(0.42, Math.min(2.2, 60 / Math.max(48, bpm))).toFixed(2);
  const beatLift = Math.round(5 + energy / 9);
  const beatBars = Array.from({ length: 18 }, (_, i) => {
    const wave = Math.sin((i + 1) * 0.82 + bpm / 18);
    const moodPush = (energy - 50) / 80 + (valence - 50) / 180;
    const height = Math.max(16, Math.min(88, 40 + wave * 20 + moodPush * 36 + (i % 4 === 0 ? 12 : 0)));
    return `<i style="height:${height.toFixed(0)}%;animation-delay:${(i * 0.045).toFixed(2)}s"></i>`;
  }).join("");
  return `
    <section class="ai-work-content" aria-label="在线听">
      <div class="player-page" data-node-id="365:9693">
        <div class="player-pet-stage beat-${mode.rhythm} ${state.isPlaying ? "is-playing" : ""}" style="--beat-speed:${beatSpeed}s;--beat-lift:${beatLift}px;--mood-energy:${energy};--mood-valence:${valence}">
          <div class="stage-orbit one"></div>
          <div class="stage-orbit two"></div>
          <div class="stage-rhythm" aria-hidden="true">${beatBars}</div>
          <div class="stage-pulse"></div>
          <div class="player-pet-companion">
            <img src="${PIC}/${mode.petImg}" alt="音乐小精灵">
            <span>${mode.action}</span>
          </div>
          <div class="stage-mood">
            <strong>${mode.mood}</strong>
            <em>${bpm} BPM · 能量 ${energy}</em>
          </div>
        </div>

        <button class="pa-btn pa-like" type="button" data-player-action="favorite" aria-label="喜欢">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 20.5S4.5 15.6 4.5 10.3A4.2 4.2 0 0 1 12 7.2 4.2 4.2 0 0 1 19.5 10.3C19.5 15.6 12 20.5 12 20.5z" fill="#0a0e0e"/></svg>
          <span class="cnt">999</span>
        </button>
        <button class="pa-btn pa-plus" type="button" data-player-action="collect" aria-label="收藏">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#0a0e0e" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        <button class="pa-btn pa-share" type="button" data-player-action="share" aria-label="分享">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 13h11M11 7l6 6-6 6" stroke="#0a0e0e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="pa-btn pa-more" type="button" data-player-action="more" aria-label="更多">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="#0a0e0e"/><circle cx="12" cy="12" r="2" fill="#0a0e0e"/><circle cx="19" cy="12" r="2" fill="#0a0e0e"/></svg>
        </button>

        <div class="player-info">
          <h2>晴天</h2>
          <div class="player-artist"><img src="${PIC}/avatar.png" alt=""><span>周杰伦</span></div>
          <div class="player-desc">
            <p>Join the rhythm of the night with "Echoes…</p>
            <button class="player-detail" type="button" data-player-action="detail">查看详情</button>
          </div>
        </div>

        <button class="player-diary" type="button" data-nav="diary">创建日记</button>

        <div class="player-media">
          <div class="player-progress">
            <div class="player-track" data-seek-track>
              <div class="player-track-fill" style="width:${Math.round(state.audioProgress * 100)}%"></div>
              <div class="player-knob" style="left:${Math.round(state.audioProgress * 100)}%"></div>
            </div>
            <div class="player-time"><span>${formatTime(state.audioCurrentTime)}</span><span>${state.playError || formatTime(state.audioDuration)}</span></div>
          </div>
          <div class="player-controls">
            <button class="player-skip" type="button" data-player-action="prev" aria-label="上一首">
              <svg viewBox="0 0 20 25" width="20" height="25" aria-hidden="true"><path d="M18 2 7 12.5 18 23Z" fill="#000"/><rect x="2" y="2" width="3.4" height="21" rx="1.5" fill="#000"/></svg>
            </button>
            <button class="player-play ${state.isPlaying ? "playing" : ""}" type="button" data-player-toggle aria-label="播放"></button>
            <button class="player-skip" type="button" data-player-action="next" aria-label="下一首">
              <svg viewBox="0 0 20 25" width="20" height="25" aria-hidden="true"><path d="M2 2 13 12.5 2 23Z" fill="#000"/><rect x="14.6" y="2" width="3.4" height="21" rx="1.5" fill="#000"/></svg>
            </button>
          </div>
        </div>

        ${statusBar()}
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">在线听</h1>
        <button class="results-more" type="button" aria-label="更多" data-toast="更多功能开发中">...</button>
      </div>
    </section>

    ${bottomNav("player")}
  `;
}

/* ---------- 音乐日记 (日记编辑 + 公开信息流) ---------- */

const FEED = [
  { name: "小鲸鱼", av: "#c4cdd0", time: "2分钟前", text: "雨后的城市，空气里都是温柔的味道 ☔", photo: "Photo/City haze.png", song: "想自由", artist: "林宥嘉", likes: 128, cmts: 32, shares: 12 },
  { name: "星星也听歌", av: "#aacbe6", time: "1小时前", text: "夜里循环这首，整个人都软下来了 🌙", photo: "Photo/City haze.png", song: "晴天", artist: "周杰伦", likes: 86, cmts: 14, shares: 5 },
  { name: "阿吉", av: "#f3c6a6", time: "3小时前", text: "通勤路上的阳光刚刚好 ☀", photo: "Change Image Here.png", song: "平凡之路", artist: "朴树", likes: 203, cmts: 41, shares: 18 },
  { name: "柚子茶", av: "#bfe3c8", time: "昨天", text: "失眠的夜，小Q陪我听到天亮 🍵", photo: "Photo/City haze.png", song: "体面", artist: "于文文", likes: 57, cmts: 9, shares: 3 },
  { name: "海风", av: "#d9cdf0", time: "昨天", text: "把心情写进歌单，存起来 🎐", photo: "Change Image Here.png", song: "起风了", artist: "买辣椒也用券", likes: 142, cmts: 26, shares: 9 }
];

const ICON_LIKE = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 20S4 15 4 9.5A3.8 3.8 0 0 1 12 7 3.8 3.8 0 0 1 20 9.5C20 15 12 20 12 20z" fill="none" stroke="#0a0e0e" stroke-width="1.8"/></svg>`;
const ICON_CMT = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M4 5h16v11H9l-4 3v-3H4z" fill="none" stroke="#0a0e0e" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const ICON_SHARE = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 12 20 5 15 21 12 13z" fill="none" stroke="#0a0e0e" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

function feedCard(item) {
  return `
    <article class="feed-item" data-nav="player">
      <div class="feed-head">
        <span class="feed-av" style="background:${item.av}"></span>
        <div class="feed-meta"><strong>${item.name}</strong><em>${item.time}</em></div>
        <span class="feed-dots" data-toast="更多操作">···</span>
      </div>
      <p class="feed-txt">${item.text}</p>
      <div class="feed-media">
        <div class="feed-pic" style="background-image:url('${PIC}/${item.photo}')"></div>
        <div class="feed-trk">
          <span class="feed-trk-cover"></span>
          <div class="feed-trk-info"><strong>${item.song}</strong><em>${item.artist}</em></div>
          <span class="feed-trk-play" aria-hidden="true"></span>
        </div>
      </div>
      <div class="feed-stats">
        <span>${ICON_LIKE}${item.likes}</span>
        <span>${ICON_CMT}${item.cmts}</span>
        <span>${ICON_SHARE}${item.shares}</span>
      </div>
    </article>`;
}

const EMOTIONS = ["治愈", "平静", "轻快", "怀念", "释放", "温柔", "元气", "深夜"];
const STYLES = [["流行", "🎵"], ["民谣", "🪕"], ["电子", "🎛️"], ["古典", "🎹"], ["摇滚", "🎸"], ["爵士", "🎷"], ["说唱", "🎤"]];

function renderDiary() {
  return `
    <section class="ai-work-content" aria-label="音乐日记">
      <div class="diary-page2">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">音乐日记</h1>
        <button class="diary-save" type="button" data-nav="diarylog">保存日记</button>

        <div class="dc-form">
          <div class="dc-mood-card">
            <div class="dc-mood-head">
              <span>写下此刻心情</span>
              <button class="dc-help" type="button" data-toast="写下你此刻的感受，小Q 会据此推荐音乐">?</button>
            </div>
            <textarea class="dc-mood-input" maxlength="2800" placeholder="我…"></textarea>
            <span class="dc-counter">0/2800</span>
          </div>

          <h3 class="dc-label">添加照片</h3>
          <div class="dc-photos">
            <div class="dc-photo"><img src="${PIC}/Photo/City haze.png" alt=""><span class="dc-photo-x" data-toast="已移除照片">×</span></div>
            <button class="dc-photo-add" type="button" data-toast="上传或拍照，敬请期待">+</button>
          </div>

          <h3 class="dc-label">选择情绪</h3>
          <div class="dc-row">
            ${EMOTIONS.map((e, i) => `<button type="button" class="dc-chip${i === state.diaryEmotion ? " on" : ""}" data-emotion="${i}">${e}</button>`).join("")}
          </div>

          <h3 class="dc-label">选择音乐风格</h3>
          <div class="dc-row">
            ${STYLES.map(([n, ic], i) => `<button type="button" class="dc-style${i === state.diaryStyle ? " on" : ""}" data-style="${i}"><b>${ic}</b><em>${n}</em></button>`).join("")}
          </div>

          <button class="dc-advanced${state.diaryAdvOpen ? " open" : ""}" type="button" data-advtoggle>
            <span>✦ 高级选项</span><i class="dc-chevron"></i>
          </button>
          <div class="dc-adv-panel${state.diaryAdvOpen ? " open" : ""}">
            <div class="dc-song">
              <span class="dc-song-cover"></span>
              <div class="dc-song-info"><strong>慢慢喜欢你</strong><em>莫文蔚</em></div>
              <span class="dc-song-play" aria-hidden="true"></span>
            </div>
            <div class="dc-privacy">
              <span class="dc-priv-label">公开设置</span>
              <span class="diary-toggle dc-tg${state.diaryPublic ? "" : " active"}" data-toggle="private">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/></svg>
                私人
              </span>
              <span class="diary-toggle dc-tg${state.diaryPublic ? " active" : ""}" data-toggle="public">●&nbsp;公开</span>
            </div>
          </div>

          <button class="dc-generate" type="button" data-nav="diarylog">
            <span class="dc-gen-ico" aria-hidden="true"></span>生成此刻小记
          </button>
        </div>

        <div class="dc-feed-head">
          <span class="diary-tab2 active">公开日记</span>
          <span class="diary-tab2">推荐</span>
          <span class="diary-tab2">关注</span>
        </div>
        <div class="feed-list">
          ${FEED.map(feedCard).join("")}
        </div>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("player")}
  `;
}

/* ---------- 音乐日记 · 日历/历史 ---------- */

const DIARY_DATES = [[12, 105], [13, 139], [14, 173], [15, 207], [16, 241], [17, 275], [18, 309]];
const DIARY_WEEKS = [["一", 117], ["二", 151], ["三", 185], ["四", 219], ["五", 253], ["六", 287], ["日", 321]];
const MOOD_LINES = [
  ["l1", 43, 625, 44, "#bfefcf"], ["l2", 91, 613, 52, "#84eaaa"], ["l3", 147, 601, 60, "#22d66b"],
  ["l4", 211, 617, 46, "#84eaaa"], ["l5", 261, 609, 58, "#22d66b"]
];

const DIARY_HAS = [3, 6, 9, 12, 14, 16, 18, 21, 25, 28];
const DIARY_RECORDS = [
  { time: "今天 21:18", title: "低噪放松的一晚", desc: "小Q推荐了 12 首歌，整体情绪从疲惫转向平静。", mood: "平静" },
  { time: "昨天 08:42", title: "通勤路上的绿色能量", desc: "照片识别为晴天街景，推荐节奏更明亮。", mood: "轻快" },
  { time: "6月16日 23:50", title: "雨夜的独白", desc: "和小Q聊了很久，存下 3 首单曲循环。", mood: "治愈" }
];

function recordCard(rec, i) {
  const t = 414 + i * 130;
  return `
    <div class="dl-card" style="top:${t}px" data-nav="player"></div>
    <span class="dl-time" style="top:${t + 22}px">${rec.time}</span>
    <span class="dl-title" style="top:${t + 48}px">${rec.title}</span>
    <span class="dl-desc" style="top:${t + 78}px">${rec.desc}</span>
    <span class="dl-pill" style="top:${t + 26}px">${rec.mood}</span>`;
}

function renderDiaryLog() {
  const curveTop = 414 + DIARY_RECORDS.length * 130;
  const pageH = curveTop + 88 + 130;
  return `
    <section class="ai-work-content" aria-label="音乐日记">
      <div class="diarylog-page" data-node-id="389:9329" style="min-height:${pageH}px">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">音乐日记</h1>

        <div class="dl-cal-card"></div>
        <span class="dl-month">6月</span>
        <div class="dl-cal-grid">
          ${["一", "二", "三", "四", "五", "六", "日"].map((w) => `<span class="dl-wk2">${w}</span>`).join("")}
          ${Array.from({ length: 30 }, (_, i) => {
            const d = i + 1;
            const cls = (d === 18 ? " today" : "") + (DIARY_HAS.includes(d) ? " has" : "");
            return `<span class="dl-day${cls}">${d}</span>`;
          }).join("")}
        </div>

        <span class="dl-recent">最近记录</span>
        ${DIARY_RECORDS.map(recordCard).join("")}

        <div class="dl-card dl-curve-card" style="top:${curveTop}px"></div>
        <span class="dl-curve-title" style="top:${curveTop + 20}px">本周情绪曲线</span>
        ${MOOD_LINES.map(([c, l, t, w, bg]) => `<i class="dl-line ${c}" style="left:${l}px;top:${curveTop + (t - 565)}px;width:${w}px;background:${bg}"></i>`).join("")}
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("player")}
  `;
}

/* ---------- 我的在听档案 (个人/统计) ---------- */

const PF_STATS = [[42, "陪听歌曲", 79], [18, "日记", 179], [6, "分享", 279]];
const PF_PREFS = [["低噪", 43], ["治愈", 111], ["通勤", 179], ["晚间", 247]];
const PF_ACH = [["🎵", "听歌达人", "var(--pastel-mint)"], ["🌙", "夜猫子", "var(--pastel-lilac)"], ["📖", "日记家", "var(--pastel-peach)"], ["🔥", "连续7天", "var(--pastel-sky)"]];
const PF_RECENT = REC_SONGS.slice(0, 3);

function profileStats() {
  const store = state.petStore;
  if (!store) return PF_STATS;
  return [
    [store.listeningHistory?.length || 0, "听歌记录", 79],
    [store.recommendationRecords?.length || 0, "推荐记录", 179],
    [Object.values(store.inventory?.outfits || {}).filter((item) => item.unlocked).length, "已解锁", 279]
  ];
}

function renderProfileTags(tags = []) {
  const safeTags = tags.length ? tags : PF_PREFS.map(([tag]) => tag);
  return safeTags.slice(0, 6).map((tag) => `<span>${tag}</span>`).join("");
}

function renderHistoryRows(items = []) {
  return items.slice(0, 4).map((item) => `
    <button type="button" data-listen-song="${item.songId}" data-song-title="${item.title}" data-song-artist="${item.artist}" data-song-scene="${item.sceneId}">
      <strong>${item.title}</strong>
      <span>${item.artist} · ${item.action} · ${item.sceneId}</span>
    </button>
  `).join("");
}

function renderRecommendationRows(items = []) {
  return items.slice(0, 3).map((item) => `
    <div>
      <strong>${item.frontendMode || "mode"} · ${item.petMood || "宠物状态"}</strong>
      <span>${item.sceneId || "scene"} · ${item.topSongId || "song"} · ${new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
    </div>
  `).join("");
}

function renderProfile() {
  const store = state.petStore;
  const userProfile = store?.userProfile;
  const stats = profileStats();
  const likedTags = userProfile?.likedTags || PF_PREFS.map(([tag]) => tag);
  const history = store?.listeningHistory || [];
  const records = store?.recommendationRecords || [];
  return `
    <section class="ai-work-content" aria-label="我的在听档案">
      <div class="profile-page" data-node-id="389:9702" style="min-height:1102px">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">我的在听档案</h1>

        <div class="pf-header-block"></div>
        <img class="pf-pet" src="${PIC}/zhu 1.png" alt="音乐宠物">
        <h2 class="pf-greeting">小Q陪听第 28 天</h2>
        <p class="pf-sub">你最常听 ${likedTags.slice(0, 3).join("、")}，小Q会把这些偏好融合进每次推荐。</p>

        <div class="pf-card pf-stats-card"></div>
        <span class="pf-card-title pf-t1">本月数据</span>
        ${stats.map(([n, l, c]) => `<span class="pf-stat-num" style="left:${c}px">${n}</span><span class="pf-stat-lbl" style="left:${c + 1}px">${l}</span>`).join("")}

        <div class="pf-card pf-pref-card"></div>
        <span class="pf-card-title pf-t2">偏好标签</span>
        <div class="pf-tag-cloud">${renderProfileTags(likedTags)}</div>

        <div class="pf-card pf-pet-card"></div>
        <span class="pf-card-title pf-t3">宠物声音和陪伴方式</span>
        <span class="pf-pet-sub">${userProfile ? `${userProfile.timeBucket} · ${userProfile.timeTags.join(" / ")}` : "温柔提醒 · 每晚 21:30"}</span>
        <button class="pf-setting" type="button" data-nav="petskin">去设置</button>

        <section class="pf-library-card pf-fusion">
          <header><strong>融合画像</strong><span>${userProfile?.historySize || 0} 条历史</span></header>
          <div class="pf-chip-row">${renderProfileTags(userProfile?.favoriteArtists || [])}</div>
          <p>推荐会综合常听歌手、喜欢标签、跳过记录、场景亲和度和当前时段。</p>
        </section>

        <section class="pf-library-card pf-history">
          <header><strong>最近听歌</strong><span>点击可记录播放</span></header>
          <div class="pf-history-list">${renderHistoryRows(history)}</div>
        </section>

        <section class="pf-library-card pf-records">
          <header><strong>推荐记录</strong><span>最近 3 次</span></header>
          <div class="pf-record-list">${renderRecommendationRows(records)}</div>
        </section>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("profile")}
  `;
}

/* ---------- 我的专属陪伴 (宠物皮肤/装扮) ---------- */

const SKINS = [
  ["lan2 2.png", 45, 436, "星屿", 69, 523],
  ["绿色 2.png", 161, 436, "月庭", 186, 522],
  ["粉丝 2.png", 277, 436, "心跳", 301, 522],
  ["肉色 2.png", 45, 557, "花信", 68, 644],
  ["褐色 2.png", 161, 557, "甜烘", 184, 644],
  ["紫色 2.png", 277, 557, "星夜", 299, 644],
  ["柠檬夏 2.png", 45, 682, "果境", 68, 771],
  ["蓝色 2.png", 161, 682, "云汐", 184, 771],
  ["黄色 2.png", 278, 682, "日冕", 300, 771],
  ["6 1.png", 17, 830, "夜冕", 47, 910],
  ["1 2.png", 113, 830, "梦羽", 139, 910],
  ["4 2.png", 203, 830, "虹翼", 230, 910],
  ["2 2.png", 301, 830, "樱庭", 321, 910]
];

const ACTIONS = [
  ["act1.png", 87, 516, 69, 72, "打招呼", 122, 602],
  ["act2.png", 188, 515, 69, 71, "点头晃晃", 223, 602],
  ["act3.png", 291, 515, 69, 72, "我来了", 326, 602],
  ["act4.png", 94, 656, 68, 64, "跟拍摇摆", 122, 737],
  ["act5.png", 187, 647, 74, 78, "开心转圈", 223, 737],
  ["act6.png", 291, 646, 75, 79, "抱抱", 326, 737],
  ["act7.png", 85, 787, 75, 79, "送你心心", 122, 874],
  ["act8.png", 182, 781, 83, 87, "安静听歌", 223, 874],
  ["act9.png", 291, 785, 75, 79, "偷偷看你", 326, 874],
  ["act10.png", 91, 925, 66, 62, "元气满满", 122, 1019],
  ["act11.png", 184, 911, 82, 85, "结束动作", 223, 1019],
  ["act12.png", 288, 922, 74, 65, "摆烂躺平", 326, 1019]
];
const ACT_TIERS = [["初识", "0", 511, 530], ["星契", "500", 646, 665], ["灵弦", "2000", 781, 800], ["心耀", "5000", 916, 935]];
const ACT_MILESTONES = [["初识", 42.5], ["星契", 143], ["灵弦", 243.5], ["心耀", 344]];

function renderSkinsBlock() {
  return `
    <span class="ps-group g1">基础款 ⌄</span>
    <span class="ps-group g2">特殊款 ⌄</span>
    ${SKINS.map(([src, l, t, name, nl, nt]) =>
      renderEquipSkin(src, l, t, name) +
      `<span class="ps-skin-name" style="left:${nl}px;top:${nt}px">${name}</span>`
    ).join("")}
    <span class="ps-more">——更多装扮，正在上线中——</span>
  `;
}

function renderEquipSkin(src, l, t, name) {
  const id = OUTFIT_IDS[name];
  const item = id ? state.petStore?.inventory?.outfits?.[id] : null;
  const locked = item && !item.unlocked;
  const equipped = id && state.petStore?.pet?.equippedOutfit === id;
  return `<button class="ps-skin ${locked ? "locked" : ""} ${equipped ? "equipped" : ""}" style="left:${l}px;top:${t}px" type="button" ${id ? `data-equip-kind="outfit" data-equip-id="${id}"` : ""}><img src="${PIC}/${src}" alt=""><span>${equipped ? "已装备" : locked ? "未解锁" : ""}</span></button>`;
}

function renderActionsBlock() {
  let cards = "";
  for (const t of [511, 645, 781, 916]) for (const l of [83, 182, 284]) cards += `<div class="ps-act-card" style="left:${l}px;top:${t}px"></div>`;
  return `
    <img class="ps-act-ld" src="${PIC}/act-ld.png" alt="">
    <div class="ps-act-line"></div>
    ${ACT_MILESTONES.map(([n, l]) => `<span class="ps-act-ms" style="left:${l}px">${n}</span>`).join("")}
    ${cards}
    ${[557, 692, 827].map((t) => `<i class="ps-act-divider" style="top:${t}px"></i>`).join("")}
    ${ACT_TIERS.map(([n, num, nt, vt]) => `<span class="ps-tier-name" style="top:${nt}px">${n}</span><span class="ps-tier-num" style="top:${vt}px">${num}</span>`).join("")}
    ${ACTIONS.map(([src, il, it, iw, ih, name, nl, nt]) =>
      renderEquipAction(src, il, it, iw, ih, name) +
      `<span class="ps-act-name" style="left:${nl}px;top:${nt}px">${name}</span>`
    ).join("")}
    <span class="ps-more ps-more-act">——更多动作，正在上线中——</span>
  `;
}

function renderEquipAction(src, il, it, iw, ih, name) {
  const id = ACTION_IDS[name];
  const item = id ? state.petStore?.inventory?.actions?.[id] : null;
  const locked = item && !item.unlocked;
  const equipped = id && state.petStore?.pet?.equippedAction === id;
  return `<button class="ps-act-img ${locked ? "locked" : ""} ${equipped ? "equipped" : ""}" type="button" style="left:${il}px;top:${it}px;width:${iw}px;height:${ih}px" ${id ? `data-equip-kind="action" data-equip-id="${id}"` : ""}><img src="${PIC}/${src}" alt=""><span>${equipped ? "✓" : locked ? "锁" : ""}</span></button>`;
}

function renderPetskin() {
  const isAction = state.petTab === "action";
  const pet = state.petStore?.pet;
  const outfits = Object.values(state.petStore?.inventory?.outfits || {});
  const actions = Object.values(state.petStore?.inventory?.actions || {});
  const unlockedCount = outfits.filter((item) => item.unlocked).length + actions.filter((item) => item.unlocked).length;
  const totalCount = outfits.length + actions.length || 25;
  const intimacy = pet?.intimacy ?? 0;
  return `
    <section class="ai-work-content" aria-label="我的专属陪伴">
      <div class="petskin-page${isAction ? " is-action" : ""}" data-node-id="406:87">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">我的专属陪伴</h1>

        <div class="ps-card"></div>
        <img class="ps-pet" src="${PIC}/zhu 1.png" alt="音乐宠物">
        <span class="ps-name">小玲团</span>
        <span class="ps-switch" data-toast="切换角色，敬请期待">切换角色</span>
        <span class="ps-intimacy">亲密度:</span>
        <span class="ps-intimacy-val">${intimacy}/100</span>
        <span class="ps-improve">去提升 〉</span>
        <div class="ps-divider"></div>
        <p class="ps-desc1">小铃团会根据你听歌行为变化状态<br>不同耳机搭配不同性格表现</p>
        <p class="ps-desc2">解锁「装扮」和「动作」<br>打造你的专属音乐陪伴角色</p>

        <h2 class="ps-task-title">做任务解锁装扮/动作</h2>
        <span class="ps-task-sub">已解锁${unlockedCount}/${totalCount},点击已解锁项目即可装备</span>
        <span class="ps-task-link" data-nav="tasks">去做任务 〉</span>

        <span class="ps-tab left ${isAction ? "off" : "on"}" data-pettab="skin">装扮</span>
        <span class="ps-tab right ${isAction ? "on" : "off"}" data-pettab="action">动作</span>
        <span class="ps-equip-msg">${state.equipMessage || "点击已解锁项目即可装备"}</span>

        ${isAction ? renderActionsBlock() : renderSkinsBlock()}
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("profile")}
  `;
}

/* ---------- 任务 (每日任务) ---------- */

const TASKS = [
  [true, "听完 3 首推荐歌", "让小Q获得音乐能量", "能量 +20", "#53b7ff"],
  [true, "和小Q聊天 1 次", "提升亲密度", "亲密 +12", "#22d66b"],
  [true, "写一篇音乐日记", "沉淀今日心情", "经验 +18", "#ffb84d"],
  [false, "分享音乐瞬间", "获得装扮碎片", "碎片 +1", "#a68bff"],
  [false, "给宠物换个装扮", "解锁新表情", "经验 +10", "#4dd0c0"],
  [false, "完成一次拍照推荐", "让 AI 更懂你", "能量 +15", "#ff8fab"],
  [false, "连续陪听 7 天", "解锁限定皮肤", "碎片 +2", "#7c9cff"]
];

function taskDoneCount() {
  return state.taskDone.filter(Boolean).length;
}

function renderTasks() {
  const pageH = 311 + TASKS.length * 86 + 130;
  return `
    <section class="ai-work-content" aria-label="任务">
      <div class="tasks-page" data-node-id="446:326" style="min-height:${pageH}px">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">任务</h1>

        <img class="tk-pet" src="${PIC}/zhu 1.png" alt="音乐宠物">
        <span class="tk-progress-title">今日照顾进度</span>
        <div class="tk-prog-bg"></div>
        <div class="tk-prog-fill" style="width:${(taskDoneCount() / state.taskTotal * 176).toFixed(1)}px"></div>
        <span class="tk-ratio">${taskDoneCount()} / ${state.taskTotal}</span>
        <span class="tk-reward-note">完成全部任务可获得：绿音铃铛碎片 ×2</span>
        <h2 class="tk-section">每日任务</h2>

        ${TASKS.map(([_, title, sub, reward, color], i) => {
          const t = 311 + i * 86;
          const done = state.taskDone[i];
          return `
        <div class="tk-card${done ? "" : " is-todo"}" style="top:${t}px" data-task="${i}"></div>
        <span class="tk-check${done ? " done" : ""}" style="top:${t + 22}px" data-task="${i}">${done ? "✓" : ""}</span>
        <span class="tk-title" style="top:${t + 16}px" data-task="${i}">${title}</span>
        <span class="tk-sub" style="top:${t + 40}px" data-task="${i}">${sub}</span>
        <span class="tk-pill" style="top:${t + 23}px;background:${color}" data-task="${i}">${reward}</span>`;
        }).join("")}
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("")}
  `;
}

/* ---------- 社区（复用日记信息流） ---------- */

/* ---------- 小宠物对话 ---------- */

function renderChatMessages() {
  return state.chatMessages.map((message) => `
    <div class="chat-msg ${message.role}">
      ${message.role === "pet" ? `<img src="${PIC}/${currentGrowthMode().petImg}" alt="">` : ""}
      ${message.type === "song" ? renderChatSongMessage(message) : `<p>${message.text}</p>`}
    </div>
  `).join("");
}

function renderChatSongMessage(message) {
  const song = message.song;
  if (!song) return `<p>${message.text || "我给你找了一首歌。"}</p>`;
  const playable = Boolean(song.previewUrl);
  const coverStyle = song.coverUrl
    ? `background-image:url('${song.coverUrl}');background-size:cover;background-position:center`
    : "background:#d9e8e0";
  return `
    <div class="chat-song-card">
      <button class="chat-song-main" type="button" data-listen-song="${song.id}" data-song-title="${song.title}" data-song-artist="${song.artist}" data-song-scene="${song.sceneId || state.musicMode}" data-song-payload="${encodeSong(song, song.sceneId || state.musicMode)}">
        <span class="chat-song-cover" style="${coverStyle}"></span>
        <span class="chat-song-meta">
          <strong>${song.title}</strong>
          <em>${song.artist}${song.bpm ? ` · ${Math.round(song.bpm)} BPM` : ""}</em>
        </span>
        <i class="chat-song-play" aria-hidden="true"></i>
      </button>
      <span class="chat-song-note">${playable ? "点一下直接听" : "这首没有试听，会自动切到可听版本"}</span>
    </div>`;
}

function shouldAttachChatSong(text) {
  return /推荐|换歌|歌单|听什么|听歌|来一首|路上|通勤|地铁|公交|走路|累|难过|烦|焦虑|压力|不开心|孤单|放松|安静/.test(text);
}

function pickChatRecommendation(text) {
  const songs = [
    ...(state.growthPlan?.songs || []),
    state.currentSong
  ].filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const song of songs) {
    const key = song.id || `${song.title}-${song.artist}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(song);
    }
  }
  const playable = unique.find((song) => song.previewUrl) || pickPlayableSong();
  const chosen = playable || unique[0];
  if (!chosen) return null;
  return {
    ...chosen,
    sceneId: chosen.sceneId || state.growthPlan?.moment?.sceneId || state.musicMode
  };
}

async function resolveChatRecommendation(text) {
  const existing = pickChatRecommendation(text);
  if (existing) return existing;
  try {
    const response = await fetch("/api/music-pet/recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: state.musicMode,
        sceneId: state.musicMode,
        message: text,
        petState: {
          energy: currentGrowthMode().energy,
          intimacy: currentGrowthMode().intimacy,
          growth: currentGrowthMode().growth,
          shards: currentGrowthMode().shards
        }
      })
    });
    if (!response.ok) throw new Error("recommendation_failed");
    const plan = await response.json();
    state.musicMode = plan.frontendMode || state.musicMode;
    state.growthPlan = plan;
    if (plan.songs?.[0]) {
      state.currentSong = {
        ...plan.songs[0],
        sceneId: plan.moment?.sceneId || state.musicMode
      };
    }
    return pickChatRecommendation(text);
  } catch {
    return pickChatRecommendation(text);
  }
}

function trimChatMessages() {
  state.chatMessages = state.chatMessages.slice(-12);
}

function buildPetChatReply(text) {
  const mode = currentGrowthMode();
  const song = state.currentSong || { title: mode.song, artist: mode.artist };
  if (/照片|拍照|图片|图像/.test(text)) {
    return `可以，把照片给我后，我会先看画面情绪，再结合你最近爱听的 ${mode.tags.join("、")}，找一组更贴近当下的歌。`;
  }
  if (/通勤|路上|地铁|公交/.test(text)) {
    return `路上我会陪你用「${mode.action}」的动作听歌。现在这首《${song.title}》节奏大概 ${mode.bpm} BPM，我会跟着鼓点轻轻动。`;
  }
  if (/难过|累|冷|烦|焦虑|压力/.test(text)) {
    return `我听见啦。先不急着变快乐，我陪你把音乐放柔一点。可以从《${song.title}》开始，慢慢把情绪放下来。`;
  }
  return `我会记住你刚刚说的状态，再结合正在听的《${song.title}》和最近偏好，给你更像朋友说话的推荐理由。`;
}

async function sendChatMessage(text) {
  const value = String(text || "").trim();
  if (!value) return;
  state.chatMessages.push({ role: "user", text: value });
  state.chatMessages.push({ role: "pet", text: "我听到了，正在给你挑一首现在能接住情绪的歌。" });
  trimChatMessages();
  renderView({ animate: false });
  try {
    const mode = currentGrowthMode();
    const song = state.currentSong || {
      title: mode.song,
      artist: mode.artist,
      bpm: mode.bpm,
      energy: mode.energy
    };
    const response = await fetch("/api/music-pet/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: value,
        song,
        mode,
        recentMessages: state.chatMessages.slice(-8)
      })
    });
    if (!response.ok) throw new Error("chat_failed");
    const data = await response.json();
    const recommendedSong = shouldAttachChatSong(value) ? await resolveChatRecommendation(value) : null;
    state.chatMessages[state.chatMessages.length - 1] = {
      role: "pet",
      text: data.reply || buildPetChatReply(value)
    };
    if (recommendedSong) {
      state.chatMessages.push({
        role: "pet",
        type: "song",
        text: `推荐 ${recommendedSong.title}`,
        song: recommendedSong
      });
    }
  } catch {
    const recommendedSong = shouldAttachChatSong(value) ? await resolveChatRecommendation(value) : null;
    state.chatMessages[state.chatMessages.length - 1] = {
      role: "pet",
      text: buildPetChatReply(value)
    };
    if (recommendedSong) {
      state.chatMessages.push({
        role: "pet",
        type: "song",
        text: `推荐 ${recommendedSong.title}`,
        song: recommendedSong
      });
    }
  }
  trimChatMessages();
  renderView({ animate: false });
}

function renderChat() {
  const mode = currentGrowthMode();
  const song = state.currentSong || { title: mode.song, artist: mode.artist };
  return `
    <section class="ai-work-content" aria-label="小宠物对话">
      <div class="chat-page">
        <h1 class="results-title">对话</h1>
        <button class="results-more" type="button" aria-label="更多" data-toast="对话设置稍后开放">...</button>

        <section class="chat-hero">
          <div class="chat-pet-stage beat-${mode.rhythm} ${state.isPlaying ? "is-playing" : ""}" style="--beat-speed:${mode.beatSpeed || 1}s;--beat-lift:${mode.beatLift || 6}px">
            <img src="${PIC}/${mode.petImg}" alt="音乐小宠物">
            <span>${mode.action}</span>
          </div>
          <div class="chat-state">
            <strong>${mode.mood}</strong>
            <em>正在理解：${song.title} · ${mode.bpm} BPM</em>
          </div>
        </section>

        <div class="chat-log">
          ${renderChatMessages()}
        </div>

        <div class="chat-prompts">
          <button type="button" data-chat-prompt="我今天通勤有点累，想听慢一点的">通勤有点累</button>
          <button type="button" data-chat-prompt="根据我现在这首歌，换一个适合的动作">换个动作</button>
          <button type="button" data-chat-prompt="我发照片后你怎么推荐歌">照片推荐</button>
        </div>

        <form class="chat-compose" data-chat-form>
          <input class="chat-input" name="message" type="text" placeholder="和小宠物说说你的心情">
          <button type="submit" aria-label="发送">发送</button>
        </form>
      </div>
    </section>

    ${statusBar()}
    ${bottomNav("chat")}
  `;
}

function renderCommunity() {
  return `
    <section class="ai-work-content" aria-label="社区">
      <div class="community-page">
        <h1 class="results-title">社区</h1>
        <div class="comm-tabs">
          <span class="comm-tab active">推荐</span>
          <span class="comm-tab">关注</span>
          <span class="comm-tab">附近</span>
        </div>
        <div class="feed-list comm-feed">
          ${FEED.map(feedCard).join("")}
        </div>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("community")}
  `;
}

/* ---------- 视频 ---------- */

const VIDEOS = [
  { title: "雨天的城市漫游", author: "小鲸鱼", cover: "Photo/City haze.png", len: "1:24" },
  { title: "通勤路上的光", author: "阿吉", cover: "Change Image Here.png", len: "0:48" },
  { title: "深夜 Lo-fi 现场", author: "星星也听歌", cover: "Photo/City haze.png", len: "3:12" },
  { title: "小Q的一天", author: "音乐宠物", cover: "33.png", len: "0:36" },
  { title: "晴天骑行 vlog", author: "海风", cover: "Change Image Here.png", len: "2:05" },
  { title: "治愈系钢琴", author: "柚子茶", cover: "Photo/City haze.png", len: "4:30" }
];

function videoCard(v) {
  return `
    <div class="video-card" data-toast="视频播放，敬请期待 ▶">
      <div class="video-cover" style="background-image:url('${PIC}/${v.cover}')">
        <span class="video-play" aria-hidden="true"></span>
        <span class="video-len">${v.len}</span>
      </div>
      <strong class="video-title">${v.title}</strong>
      <em class="video-author">@${v.author}</em>
    </div>`;
}

function renderVideo() {
  return `
    <section class="ai-work-content" aria-label="视频">
      <div class="video-page">
        <h1 class="results-title">视频</h1>
        <div class="video-grid">
          ${VIDEOS.map(videoCard).join("")}
        </div>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("video")}
  `;
}

/* ---------- Router ---------- */

const views = { home: renderHome, photoresult: renderPhotoResult, scene: renderScene, analyze: renderAnalyze, results: renderResults, recwheel: renderRecwheel, player: renderPlayer, diary: renderDiary, diarylog: renderDiaryLog, profile: renderProfile, petskin: renderPetskin, tasks: renderTasks, chat: renderChat, community: renderCommunity, video: renderVideo };

let analyzeTimer;
const ENTER_CLASS = { forward: "view-enter-forward", back: "view-enter-back", fade: "view-enter-fade" };

function bouncePet(selector) {
  const pet = screen.querySelector(selector);
  if (!pet) return;
  pet.classList.remove("pet-react");
  void pet.offsetWidth;
  pet.classList.add("pet-react");
  pet.addEventListener("animationend", () => pet.classList.remove("pet-react"), { once: true });
}

function toast(msg) {
  showActionToast(msg);
}

const REVEAL_SELECTOR = ".ps-skin, .ps-act-card, .ps-act-img, .tk-card, .dl-card, .pf-card, .feed-card, .feed-preview, .playlist-card";
let revealObserver;

function setupReveal(content) {
  if (revealObserver) revealObserver.disconnect();
  if (!content || !("IntersectionObserver" in window)) return;
  const targets = content.querySelectorAll(REVEAL_SELECTOR);
  if (!targets.length) return;
  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i, 8) * 32}ms`;
  });
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("reveal-in");
        revealObserver.unobserve(e.target);
      }
    });
  }, { root: content, threshold: 0.06 });
  targets.forEach((el) => revealObserver.observe(el));
}

function syncPlayerDom() {
  if (state.view !== "player") return;
  const mode = currentGrowthMode();
  const song = state.currentSong || {
    title: mode.song,
    artist: mode.artist,
    album: mode.mood,
    coverUrl: `${PIC}/Change Image Here.png`,
    previewUrl: ""
  };
  const statusText = state.playError || (song.previewUrl ? "30 秒试听片段" : "当前歌曲暂无试听链接");
  const title = screen.querySelector(".player-info h2");
  const artist = screen.querySelector(".player-artist span");
  const desc = screen.querySelector(".player-desc p");
  const cover = screen.querySelector(".player-photo img");
  const times = screen.querySelectorAll(".player-time span");
  const fill = screen.querySelector(".player-track-fill");
  const knob = screen.querySelector(".player-knob");
  if (title) title.textContent = song.title;
  if (artist) artist.textContent = song.artist;
  if (desc) desc.textContent = song.album || statusText;
  if (cover) cover.src = song.coverUrl || `${PIC}/Change Image Here.png`;
  if (fill) fill.style.width = `${Math.round(state.audioProgress * 100)}%`;
  if (knob) knob.style.left = `${Math.round(state.audioProgress * 100)}%`;
  if (times[0]) times[0].textContent = formatTime(state.audioCurrentTime);
  if (times[1]) times[1].textContent = state.playError || formatTime(state.audioDuration);
  updateLivePetDom();
}

function syncChatScroll() {
  if (state.view !== "chat") return;
  const content = screen.querySelector(".ai-work-content");
  const log = screen.querySelector(".chat-log");
  if (!content || !log) return;
  const scrollToLatest = () => {
    content.scrollTop = content.scrollHeight;
    log.lastElementChild?.scrollIntoView({ block: "end" });
  };
  scrollToLatest();
  requestAnimationFrame(scrollToLatest);
}

function renderView(options = {}) {
  const animate = options.animate !== false;
  clearTimeout(analyzeTimer);
  screen.innerHTML = views[state.view]();
  const content = screen.querySelector(".ai-work-content");
  if (content) {
    content.scrollTop = state.view === "chat" ? content.scrollHeight : 0;
    if (animate) {
      content.classList.add(ENTER_CLASS[state.navDir] || ENTER_CLASS.forward);
    }
  }
  paintToast();
  syncPlayerDom();
  syncChatScroll();
  setupReveal(content);
  saveState();

  /* AI分析中 → 自动进入歌曲推荐 */
  if (state.view === "analyze") {
    analyzeTimer = setTimeout(() => {
      if (state.view === "analyze") {
        navigateTo("results", { push: false });
      }
    }, 2400);
  }
}

/* ---------- Device simulator ---------- */

function applyDevice() {
  const spec = deviceSpecs[state.device];
  root.style.setProperty("--screen-w", `${spec.width}px`);
  root.style.setProperty("--screen-h", `${spec.height}px`);
  root.style.setProperty("--screen-r", `${spec.radius}px`);
  document.querySelector("#deviceName").textContent = spec.name;
  document.querySelector("#deviceSize").textContent = `${spec.width} x ${spec.height}`;
  document.querySelector("#deviceMode").textContent = state.rotated ? "Landscape" : "Portrait";
  shell.style.filter = `brightness(${state.brightness}%)`;
  shell.style.transform = `${state.rotated ? "rotate(90deg)" : ""} scale(${state.zoom / 100})`;
  document.querySelectorAll(".device-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.device === state.device);
  });
  document.querySelector("[data-action='rotate']").classList.toggle("active", state.rotated);
}

document.addEventListener("click", (event) => {
  const playerToggleEl = event.target.closest("[data-player-toggle]");
  if (playerToggleEl && screen.contains(playerToggleEl)) {
    togglePlayback();
    return;
  }

  const playerActionEl = event.target.closest("[data-player-action]");
  if (playerActionEl && screen.contains(playerActionEl)) {
    handlePlayerAction(playerActionEl.dataset.playerAction);
    return;
  }

  const photoAnalyzeEl = event.target.closest("[data-ai-analyze='photo']");
  if (photoAnalyzeEl && screen.contains(photoAnalyzeEl)) {
    screen.querySelector("[data-photo-input]")?.click();
    return;
  }

  const musicModeEl = event.target.closest("[data-music-mode]");
  if (musicModeEl && screen.contains(musicModeEl)) {
    state.musicMode = musicModeEl.dataset.musicMode;
    state.growthPlan = null;
    requestGrowthRecommendation(state.musicMode);
    return;
  }

  const listenEl = event.target.closest("[data-listen-song]");
  if (listenEl && screen.contains(listenEl)) {
    const song = readSongFromButton(listenEl);
    const playableFallback = pickPlayableSong();
    state.currentSong = song.previewUrl ? song : playableFallback || song;
    state.playError = song.previewUrl ? "" : "这首歌没有可用试听片段，已为你切到可试听歌曲";
    fetch("/api/music-pet/listening-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        songId: state.currentSong.id,
        title: state.currentSong.title,
        artist: state.currentSong.artist,
        sceneId: state.currentSong.sceneId,
        action: "listen"
      })
    }).catch(() => {});
    navigateTo("player");
    primeAudioSource();
    return;
  }

  const equipEl = event.target.closest("[data-equip-kind]");
  if (equipEl && screen.contains(equipEl)) {
    fetch("/api/music-pet/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: equipEl.dataset.equipKind,
        id: equipEl.dataset.equipId
      })
    })
      .then(async (response) => {
        if (response.ok) {
          state.equipMessage = "???????/??";
          await fetchUserState();
        } else {
          const data = await response.json().catch(() => ({}));
          state.equipMessage = data.message || "?????????";
          renderView({ animate: false });
        }
      })
      .catch(() => {
        state.equipMessage = "?????????";
        renderView({ animate: false });
      });
    return;
  }

  const petEl = event.target.closest(".ai-pet, .pf-pet, .tk-pet, .ps-pet, .analyze-pet");
  if (petEl && screen.contains(petEl)) {
    petEl.classList.remove("pet-react");
    void petEl.offsetWidth;
    petEl.classList.add("pet-react");
    petEl.addEventListener("animationend", () => petEl.classList.remove("pet-react"), { once: true });
    return;
  }

  const emoEl = event.target.closest(".dc-chip[data-emotion]");
  if (emoEl && screen.contains(emoEl)) {
    state.diaryEmotion = Number(emoEl.dataset.emotion);
    emoEl.parentElement.querySelectorAll(".dc-chip").forEach((c) => c.classList.toggle("on", c === emoEl));
    return;
  }

  const styEl = event.target.closest(".dc-style[data-style]");
  if (styEl && screen.contains(styEl)) {
    state.diaryStyle = Number(styEl.dataset.style);
    styEl.parentElement.querySelectorAll(".dc-style").forEach((c) => c.classList.toggle("on", c === styEl));
    return;
  }

  const advEl = event.target.closest("[data-advtoggle]");
  if (advEl && screen.contains(advEl)) {
    state.diaryAdvOpen = !state.diaryAdvOpen;
    advEl.classList.toggle("open", state.diaryAdvOpen);
    const panel = advEl.parentElement.querySelector(".dc-adv-panel");
    if (panel) panel.classList.toggle("open", state.diaryAdvOpen);
    return;
  }

  const taskEl = event.target.closest("[data-task]");
  if (taskEl && screen.contains(taskEl)) {
    const i = Number(taskEl.dataset.task);
    if (!state.taskDone[i]) {
      state.taskDone[i] = true;
      const card = screen.querySelector(`.tk-card[data-task="${i}"]`);
      if (card) card.classList.remove("is-todo");
      const chk = screen.querySelectorAll(".tk-check")[i];
      if (chk) {
        chk.classList.add("done");
        chk.textContent = "?";
        chk.classList.remove("pop");
        void chk.offsetWidth;
        chk.classList.add("pop");
      }
      const ratio = screen.querySelector(".tk-ratio");
      if (ratio) ratio.textContent = `${taskDoneCount()} / ${state.taskTotal}`;
      const fill = screen.querySelector(".tk-prog-fill");
      if (fill) fill.style.width = `${(taskDoneCount() / state.taskTotal * 176).toFixed(1)}px`;
      bouncePet(".tk-pet");
      toast("????????????");
    }
    return;
  }

  const toggleEl = event.target.closest("[data-toggle]");
  if (toggleEl && screen.contains(toggleEl)) {
    state.diaryPublic = toggleEl.dataset.toggle === "public";
    screen.querySelectorAll(".diary-toggle").forEach((el) => {
      el.classList.toggle("active", el.dataset.toggle === (state.diaryPublic ? "public" : "private"));
    });
    toast(state.diaryPublic ? "????????????" : "???????????");
    return;
  }

  const toastEl = event.target.closest("[data-toast]");
  if (toastEl && screen.contains(toastEl)) {
    toast(toastEl.dataset.toast);
    return;
  }

  const chatPromptEl = event.target.closest("[data-chat-prompt]");
  if (chatPromptEl && screen.contains(chatPromptEl)) {
    sendChatMessage(chatPromptEl.dataset.chatPrompt);
    return;
  }

  const petTabEl = event.target.closest("[data-pettab]");
  if (petTabEl && screen.contains(petTabEl)) {
    if (state.petTab !== petTabEl.dataset.pettab) {
      state.petTab = petTabEl.dataset.pettab;
      state.navDir = "fade";
      renderView({ animate: false });
    }
    return;
  }

  const navEl = event.target.closest("[data-nav]");
  if (navEl && (screen.contains(navEl) || document.querySelector(".ai-bottom-nav")?.contains(navEl))) {
    navigateTo(navEl.dataset.nav);
    return;
  }

  const sceneTabEl = event.target.closest(".scene-tab");
  if (sceneTabEl && screen.contains(sceneTabEl)) {
    screen.querySelectorAll(".scene-tab").forEach((tab) => tab.classList.remove("active"));
    sceneTabEl.classList.add("active");
    showActionToast(`已切换到 ${sceneTabEl.textContent.trim()}`);
    return;
  }

  const cameraEl = event.target.closest(".scene-prompt-cam");
  if (cameraEl && screen.contains(cameraEl)) {
    navigateTo("home");
    window.setTimeout(() => screen.querySelector("[data-photo-input]")?.click(), 0);
    return;
  }

  const moreEl = event.target.closest(".results-more, .scene-more, .ai-more-note, .ai-recommend-title > button, .results-edit, .diary-fab");
  if (moreEl && screen.contains(moreEl)) {
    showActionToast("功能已响应，稍后接入完整面板");
    return;
  }

  const deviceButton = event.target.closest("[data-device]");
  if (deviceButton) {
    state.device = deviceButton.dataset.device;
    applyDevice();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton?.dataset.action === "rotate") {
    state.rotated = !state.rotated;
    applyDevice();
    return;
  }

  if (actionButton?.dataset.action === "reset") {
    state.device = "iphone16";
    state.brightness = 100;
    state.zoom = 100;
    state.rotated = false;
    document.querySelector("#brightness").value = 100;
    document.querySelector("#zoom").value = 100;
    document.querySelector("#brightnessValue").textContent = "100%";
    document.querySelector("#zoomValue").textContent = "100%";
    applyDevice();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const navEl = event.target.closest("[data-nav]");
  if (navEl && screen.contains(navEl)) {
    event.preventDefault();
    navigateTo(navEl.dataset.nav);
  }
});

document.addEventListener("pointerdown", (event) => {
  const seekTrack = event.target.closest("[data-seek-track]");
  if (!seekTrack || !screen.contains(seekTrack)) return;
  state.isSeeking = true;
  seekTrack.setPointerCapture?.(event.pointerId);
  seekAudioFromEvent(event);
});

document.addEventListener("pointermove", (event) => {
  if (!state.isSeeking) return;
  seekAudioFromEvent(event);
});

document.addEventListener("pointerup", () => {
  state.isSeeking = false;
});

document.addEventListener("pointercancel", () => {
  state.isSeeking = false;
});

document.addEventListener("change", (event) => {
  const input = event.target.closest("[data-photo-input]");
  if (!input || !screen.contains(input)) return;

  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.musicMode = "heal";
    state.photoName = file.name;
    state.photoPreview = String(reader.result || "");
    requestGrowthRecommendation("heal", "photo", state.photoPreview);
  });
  reader.readAsDataURL(file);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-chat-form]");
  if (!form || !screen.contains(form)) return;
  event.preventDefault();
  const input = form.querySelector(".chat-input");
  sendChatMessage(input?.value || "");
});

document.querySelector("#brightness").addEventListener("input", (event) => {
  state.brightness = Number(event.target.value);
  document.querySelector("#brightnessValue").textContent = `${state.brightness}%`;
  applyDevice();
});

document.querySelector("#zoom").addEventListener("input", (event) => {
  state.zoom = Number(event.target.value);
  document.querySelector("#zoomValue").textContent = `${state.zoom}%`;
  applyDevice();
});

/* 日记创作：心情字数统计 */
document.addEventListener("input", (event) => {
  const ta = event.target.closest(".dc-mood-input");
  if (!ta) return;
  const counter = ta.parentElement.querySelector(".dc-counter");
  if (counter) counter.textContent = `${ta.value.length}/2800`;
});

/* 场景页心情标签：切换 sceneMood → 换副标题 + 场景卡组 */
document.addEventListener("click", (event) => {
  const tab = event.target.closest(".scene-tab[data-scenemood]");
  if (!tab || !screen.contains(tab)) return;
  const m = Number(tab.dataset.scenemood);
  if (m === state.sceneMood) return;
  state.sceneMood = m;
  state.navDir = "fade";
  renderView({ animate: false });
});

/* ---------- 轻量持久化（刷新/演示可续） ---------- */

function saveState() {
  try {
    localStorage.setItem("mpet", JSON.stringify({
      taskDone: state.taskDone,
      diaryPublic: state.diaryPublic,
      petTab: state.petTab,
      skinSel: state.skinSel,
      sceneMood: state.sceneMood
    }));
  } catch (e) { /* 隐私模式等忽略 */ }
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem("mpet"));
    if (!s) return;
    if (Array.isArray(s.taskDone) && s.taskDone.length === TASKS.length) state.taskDone = s.taskDone;
    if (typeof s.diaryPublic === "boolean") state.diaryPublic = s.diaryPublic;
    if (s.petTab === "skin" || s.petTab === "action") state.petTab = s.petTab;
    if ("skinSel" in s) state.skinSel = s.skinSel;
    if (Number.isInteger(s.sceneMood) && s.sceneMood >= 0 && s.sceneMood < SCENE_DATA.length) state.sceneMood = s.sceneMood;
  } catch (e) { /* ignore */ }
}

loadState();
applyDevice();
renderView();
fetchUserState();
