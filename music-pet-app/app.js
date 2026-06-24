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
  diaryPublic: true
};

const PIC = "./picture";

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
      <button type="button" class="center ${active === "scene" ? "active" : ""}" data-nav="scene" aria-label="在听">
        <img src="${PIC}/Ellipse 13219.svg" alt="">
        <img class="center-glyph" src="${PIC}/Icon.svg" alt="">
      </button>
      <button type="button" data-nav="community" class="${active === "community" ? "active" : ""}">
        <img src="${PIC}/交流 1.svg" alt="">
        <span>社区</span>
      </button>
      <button type="button" data-nav="profile">
        <img src="${PIC}/我的 1.svg" alt="">
        <span>我的</span>
      </button>
      <i aria-hidden="true"></i>
    </nav>`;
}

function miniPlayer() {
  return `
    <button class="ai-mini-player" type="button" data-nav="player">
      <img src="${PIC}/Mini Player/Cover.png" alt="">
      <span><strong>晴天</strong><em>周杰伦</em></span>
      <i class="mini-play" aria-hidden="true"></i>
      <i class="mini-menu" aria-hidden="true"></i>
    </button>`;
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
          <img class="ai-pet" src="${PIC}/33.png" alt="音乐宠物">
          <div class="ai-speech">
            <p>嗨~<br>今天想听点什么<br>好音乐?</p>
          </div>
          <button class="ai-pet-link" type="button" data-nav="profile">
            <strong>音乐宠物 〉</strong>
            <span>陪你发现此刻的好音乐</span>
          </button>
        </section>

        <button class="ai-photo-cta" type="button" data-nav="scene">
          <span class="ai-camera-box">
            <img src="${PIC}/拍照 1.svg" alt="">
          </span>
          <strong>拍照推荐</strong>
          <em>上传或拍照，为此刻推荐</em>
          <b>〉</b>
        </button>

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
            <button class="playlist-card morning" type="button" data-toast="歌单功能即将上线 🎵">
              <span></span><strong>清晨 · 元气</strong><em>32 首</em><b>▶</b>
            </button>
            <button class="playlist-card relax" type="button" data-toast="歌单功能即将上线 🎵">
              <span></span><strong>放松 · 治愈</strong><em>28 首</em><b>▶</b>
            </button>
            <button class="playlist-card rain" type="button" data-toast="歌单功能即将上线 🎵">
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
  { title: "慢慢喜欢你", artist: "莫文蔚", cover: "#141f29", active: true },
  { title: "想自由", artist: "林宥嘉", cover: "#5b6b6e" },
  { title: "Everyday", artist: "Ariana Grande", cover: "#c98f7a" },
  { title: "晴天", artist: "周杰伦", cover: "#7a93a8" },
  { title: "小幸运", artist: "田馥甄", cover: "#d8a7b0" },
  { title: "夜空中最亮的星", artist: "逃跑计划", cover: "#26354f" },
  { title: "平凡之路", artist: "朴树", cover: "#8a8275" },
  { title: "雨爱", artist: "杨丞琳", cover: "#6f7e8c" },
  { title: "体面", artist: "于文文", cover: "#42505a" },
  { title: "起风了", artist: "买辣椒也用券", cover: "#9ab0a0" }
];

function songRow(song, i) {
  const top = 451 + i * 58;
  return `
    <div class="song-row" style="top:${top}px" data-nav="player">
      <div class="song-cover" style="background:${song.cover}"></div>
      <span class="song-title">${song.title}</span>
      <span class="song-artist">${song.artist}</span>
      ${song.active ? `<span class="song-play-active" aria-hidden="true"></span>` : `<span class="song-play" aria-hidden="true"></span>`}
      <span class="song-dots">...</span>
    </div>`;
}

function renderResults() {
  const listEnd = 451 + REC_SONGS.length * 58;
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

        ${REC_SONGS.map((s, i) => songRow(s, i)).join("")}

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
  return `
    <section class="ai-work-content" aria-label="在线听">
      <div class="player-page" data-node-id="365:9693">
        <div class="player-photo"><img src="${PIC}/Change Image Here.png" alt=""></div>

        <button class="pa-btn pa-like" type="button" aria-label="喜欢">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 20.5S4.5 15.6 4.5 10.3A4.2 4.2 0 0 1 12 7.2 4.2 4.2 0 0 1 19.5 10.3C19.5 15.6 12 20.5 12 20.5z" fill="#0a0e0e"/></svg>
          <span class="cnt">999</span>
        </button>
        <button class="pa-btn pa-plus" type="button" aria-label="收藏">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#0a0e0e" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
        <button class="pa-btn pa-share" type="button" aria-label="分享">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 13h11M11 7l6 6-6 6" stroke="#0a0e0e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="pa-btn pa-more" type="button" aria-label="更多">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="#0a0e0e"/><circle cx="12" cy="12" r="2" fill="#0a0e0e"/><circle cx="19" cy="12" r="2" fill="#0a0e0e"/></svg>
        </button>

        <div class="player-info">
          <h2>晴天</h2>
          <div class="player-artist"><img src="${PIC}/avatar.png" alt=""><span>周杰伦</span></div>
          <div class="player-desc">
            <p>Join the rhythm of the night with "Echoes…</p>
            <span class="player-detail">查看详情</span>
          </div>
        </div>

        <button class="player-diary" type="button" data-nav="diary">创建日记</button>

        <div class="player-media">
          <div class="player-progress">
            <div class="player-track">
              <div class="player-track-fill"></div>
              <div class="player-knob"></div>
            </div>
            <div class="player-time"><span>0:37</span><span>-3:14</span></div>
          </div>
          <div class="player-controls">
            <button class="player-skip" type="button" aria-label="上一首">
              <svg viewBox="0 0 20 25" width="20" height="25" aria-hidden="true"><path d="M18 2 7 12.5 18 23Z" fill="#000"/><rect x="2" y="2" width="3.4" height="21" rx="1.5" fill="#000"/></svg>
            </button>
            <button class="player-play" type="button" aria-label="播放"></button>
            <button class="player-skip" type="button" aria-label="下一首">
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

function renderProfile() {
  return `
    <section class="ai-work-content" aria-label="我的在听档案">
      <div class="profile-page" data-node-id="389:9702" style="min-height:1080px">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">我的在听档案</h1>

        <div class="pf-header-block"></div>
        <img class="pf-pet" src="${PIC}/zhu 1.png" alt="音乐宠物">
        <h2 class="pf-greeting">小Q陪听第 28 天</h2>
        <p class="pf-sub">你最常在夜晚听治愈、轻快和低噪人声。</p>

        <div class="pf-card pf-stats-card"></div>
        <span class="pf-card-title pf-t1">本月数据</span>
        ${PF_STATS.map(([n, l, c]) => `<span class="pf-stat-num" style="left:${c}px">${n}</span><span class="pf-stat-lbl" style="left:${c + 1}px">${l}</span>`).join("")}

        <div class="pf-card pf-pref-card"></div>
        <span class="pf-card-title pf-t2">偏好标签</span>
        ${PF_PREFS.map(([t, l]) => `<span class="pf-pill" style="left:${l}px">${t}</span>`).join("")}

        <div class="pf-card pf-pet-card"></div>
        <span class="pf-card-title pf-t3">宠物声音和陪伴方式</span>
        <span class="pf-pet-sub">温柔提醒 · 每晚 21:30</span>
        <button class="pf-setting" type="button" data-nav="petskin">去设置</button>

        <div class="pf-card pf-ach-card"></div>
        <span class="pf-card-title pf-t4">成就徽章</span>
        ${PF_ACH.map(([e, l, bg], i) => `<span class="pf-ach" style="left:${39 + i * 82}px"><b style="background:${bg}">${e}</b><em>${l}</em></span>`).join("")}

        <div class="pf-card pf-recent-card"></div>
        <span class="pf-card-title pf-t5">最近在听</span>
        ${PF_RECENT.map((s, i) => `
        <div class="pf-rec-row" style="top:${822 + i * 44}px" data-nav="player">
          <span class="pf-rec-cover" style="background:${s.cover}"></span>
          <strong class="pf-rec-title">${s.title}</strong>
          <em class="pf-rec-artist">${s.artist}</em>
          <span class="pf-rec-play" aria-hidden="true"></span>
        </div>`).join("")}
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
      `<div class="ps-skin${name === state.skinSel ? " sel" : ""}" style="left:${l}px;top:${t}px" data-skin="${name}"><img src="${PIC}/${src}" alt=""></div>` +
      `<span class="ps-skin-name${name === state.skinSel ? " sel" : ""}" style="left:${nl}px;top:${nt}px">${name}</span>`
    ).join("")}
    <span class="ps-more">——更多装扮，正在上线中——</span>
  `;
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
      `<img class="ps-act-img" src="${PIC}/${src}" style="left:${il}px;top:${it}px;width:${iw}px;height:${ih}px" alt="" data-act="${name}">` +
      `<span class="ps-act-name" style="left:${nl}px;top:${nt}px">${name}</span>`
    ).join("")}
    <span class="ps-more ps-more-act">——更多动作，正在上线中——</span>
  `;
}

function renderPetskin() {
  const isAction = state.petTab === "action";
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
        <span class="ps-intimacy-val">0/500</span>
        <span class="ps-improve" data-toast="亲密度提升玩法开发中">去提升 〉</span>
        <div class="ps-divider"></div>
        <p class="ps-desc1">小铃团会根据你听歌行为变化状态<br>不同耳机搭配不同性格表现</p>
        <p class="ps-desc2">解锁「装扮」和「动作」<br>打造你的专属音乐陪伴角色</p>

        <h2 class="ps-task-title">做任务解锁装扮/动作</h2>
        <span class="ps-task-sub">已解锁25/25,点击即可以预览</span>
        <span class="ps-task-link" data-nav="tasks">去做任务 〉</span>

        <span class="ps-tab left ${isAction ? "off" : "on"}" data-pettab="skin">装扮</span>
        <span class="ps-tab right ${isAction ? "on" : "off"}" data-pettab="action">动作</span>

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

const views = { home: renderHome, scene: renderScene, analyze: renderAnalyze, results: renderResults, recwheel: renderRecwheel, player: renderPlayer, diary: renderDiary, diarylog: renderDiaryLog, profile: renderProfile, petskin: renderPetskin, tasks: renderTasks, community: renderCommunity, video: renderVideo };

let analyzeTimer;

const ENTER_CLASS = { forward: "view-enter-forward", back: "view-enter-back", fade: "view-enter-fade" };

/* ---------- 模拟播放引擎 ---------- */

let playerTimer;

function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* 把当前播放状态画到现有 DOM（迷你播放器跨页都在，播放页仅当前页有） */
function paintPlayer() {
  const p = state.player;
  document.querySelectorAll(".ai-mini-player, .rec-mini").forEach((mp) => mp.classList.toggle("is-playing", p.playing));

  const fill = document.querySelector(".player-track-fill");
  if (fill) {
    const w = fill.parentElement.clientWidth;
    fill.style.width = `${p.progress * w}px`;
    const knob = document.querySelector(".player-knob");
    if (knob) knob.style.left = `${p.progress * w}px`;
    const times = document.querySelectorAll(".player-time span");
    if (times.length === 2) {
      const elapsed = p.progress * p.dur;
      times[0].textContent = fmtTime(elapsed);
      times[1].textContent = `-${fmtTime(p.dur - elapsed)}`;
    }
    const btn = document.querySelector(".player-play");
    if (btn) btn.classList.toggle("paused", !p.playing);
  }
}

/* 进度计时只在播放页运行（离开即清除），避免常驻 DOM 改写干扰截图 */
function syncPlayerTimer() {
  clearInterval(playerTimer);
  if (state.view === "player") {
    playerTimer = setInterval(() => {
      if (!state.player.playing) return;
      state.player.progress += 0.25 / state.player.dur;
      if (state.player.progress >= 1) state.player.progress = 0;
      paintPlayer();
    }, 250);
  }
}

function togglePlay() {
  state.player.playing = !state.player.playing;
  paintPlayer();
}

/* ---------- Toast（给“点了没目的页”的入口兜底反馈） ---------- */

function bouncePet(selector) {
  const pet = screen.querySelector(selector);
  if (!pet) return;
  pet.classList.remove("pet-react");
  void pet.offsetWidth;
  pet.classList.add("pet-react");
  pet.addEventListener("animationend", () => pet.classList.remove("pet-react"), { once: true });
}

let toastTimer;

function toast(msg) {
  const host = document.querySelector(".app-container") || document.body;
  let el = host.querySelector(".app-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "app-toast";
    host.appendChild(el);
  }
  el.textContent = msg;
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

/* ---------- 滚动入场（卡片随滚动淡入上移；纯增强，JS 缺失不影响可见性） ---------- */

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

function renderView() {
  clearTimeout(analyzeTimer);
  screen.innerHTML = views[state.view]();
  const content = screen.querySelector(".ai-work-content");
  if (content) {
    content.scrollTop = 0;
    content.classList.add(ENTER_CLASS[state.navDir] || ENTER_CLASS.forward);
  }
  paintPlayer();
  syncPlayerTimer();
  setupReveal(content);
  saveState();

  /* AI分析中 → 自动进入歌曲推荐 */
  if (state.view === "analyze") {
    analyzeTimer = setTimeout(() => {
      if (state.view === "analyze") {
        state.navDir = "forward";
        state.view = "results";
        renderView();
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
  const petEl = event.target.closest(".ai-pet, .pf-pet, .tk-pet, .ps-pet, .analyze-pet");
  if (petEl && screen.contains(petEl)) {
    petEl.classList.remove("pet-react");
    void petEl.offsetWidth; /* restart the animation */
    petEl.classList.add("pet-react");
    petEl.addEventListener("animationend", () => petEl.classList.remove("pet-react"), { once: true });
    return;
  }

  /* 专属陪伴·选皮肤：选中态 + 宠物开心反应 + toast */
  const skinEl = event.target.closest(".ps-skin[data-skin]");
  if (skinEl && screen.contains(skinEl)) {
    const name = skinEl.dataset.skin;
    state.skinSel = name;
    screen.querySelectorAll(".ps-skin.sel, .ps-skin-name.sel").forEach((e) => e.classList.remove("sel"));
    skinEl.classList.add("sel");
    skinEl.nextElementSibling && skinEl.nextElementSibling.classList.add("sel");
    bouncePet(".ps-pet");
    toast(`已切换皮肤：${name} 🎧`);
    return;
  }

  /* 专属陪伴·动作：宠物表演该动作 */
  const actEl = event.target.closest(".ps-act-img[data-act]");
  if (actEl && screen.contains(actEl)) {
    bouncePet(".ps-pet");
    toast(`小Q 正在「${actEl.dataset.act}」`);
    return;
  }

  /* 日记创作：选情绪 */
  const emoEl = event.target.closest(".dc-chip[data-emotion]");
  if (emoEl && screen.contains(emoEl)) {
    state.diaryEmotion = Number(emoEl.dataset.emotion);
    emoEl.parentElement.querySelectorAll(".dc-chip").forEach((c) => c.classList.toggle("on", c === emoEl));
    return;
  }

  /* 日记创作：选音乐风格 */
  const styEl = event.target.closest(".dc-style[data-style]");
  if (styEl && screen.contains(styEl)) {
    state.diaryStyle = Number(styEl.dataset.style);
    styEl.parentElement.querySelectorAll(".dc-style").forEach((c) => c.classList.toggle("on", c === styEl));
    return;
  }

  /* 日记创作：高级选项折叠 */
  const advEl = event.target.closest("[data-advtoggle]");
  if (advEl && screen.contains(advEl)) {
    state.diaryAdvOpen = !state.diaryAdvOpen;
    advEl.classList.toggle("open", state.diaryAdvOpen);
    const panel = advEl.parentElement.querySelector(".dc-adv-panel");
    if (panel) panel.classList.toggle("open", state.diaryAdvOpen);
    return;
  }

  /* 迷你播放器上的播放小三角：切换播放，不触发跳转 */
  if (event.target.closest(".mini-play")) {
    togglePlay();
    return;
  }

  /* 播放页大播放键 */
  if (event.target.closest(".player-play")) {
    togglePlay();
    return;
  }

  /* 上/下一首：重置进度（占位反馈） */
  if (event.target.closest(".player-skip")) {
    state.player.progress = 0;
    paintPlayer();
    return;
  }

  /* 任务卡：点击未完成任务 → 勾选动画 + 进度推进 + 宠物反应 */
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
        chk.textContent = "✓";
        chk.classList.remove("pop");
        void chk.offsetWidth;
        chk.classList.add("pop");
      }
      const ratio = screen.querySelector(".tk-ratio");
      if (ratio) ratio.textContent = `${taskDoneCount()} / ${state.taskTotal}`;
      const fill = screen.querySelector(".tk-prog-fill");
      if (fill) fill.style.width = `${(taskDoneCount() / state.taskTotal * 176).toFixed(1)}px`;
      const pet = screen.querySelector(".tk-pet");
      if (pet) {
        pet.classList.remove("pet-react");
        void pet.offsetWidth;
        pet.classList.add("pet-react");
        pet.addEventListener("animationend", () => pet.classList.remove("pet-react"), { once: true });
      }
      toast("任务完成，小Q更开心了 🎉");
    }
    return;
  }

  /* 日记公开 / 私人开关 */
  const toggleEl = event.target.closest("[data-toggle]");
  if (toggleEl && screen.contains(toggleEl)) {
    state.diaryPublic = toggleEl.dataset.toggle === "public";
    screen.querySelectorAll(".diary-toggle").forEach((el) => {
      el.classList.toggle("active", el.dataset.toggle === (state.diaryPublic ? "public" : "private"));
    });
    toast(state.diaryPublic ? "已设为公开，将出现在社区" : "已设为私人，仅自己可见");
    return;
  }

  const toastEl = event.target.closest("[data-toast]");
  if (toastEl && screen.contains(toastEl)) {
    toast(toastEl.dataset.toast);
    return;
  }

  const petTabEl = event.target.closest("[data-pettab]");
  if (petTabEl && screen.contains(petTabEl)) {
    if (state.petTab !== petTabEl.dataset.pettab) {
      state.petTab = petTabEl.dataset.pettab;
      state.navDir = "fade";
      renderView();
    }
    return;
  }

  const navEl = event.target.closest("[data-nav]");
  if (navEl && screen.contains(navEl)) {
    let next = navEl.dataset.nav;
    if (next === "back") {
      state.navDir = "back";
      next = state.history.pop() || "home";
    } else {
      if (next === state.view) return;
      state.navDir = "forward";
      state.history.push(state.view);
    }
    state.view = next;
    renderView();
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
  renderView();
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
