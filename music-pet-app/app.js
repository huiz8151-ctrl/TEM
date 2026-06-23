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
  history: []
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
      <button type="button">
        <img src="${PIC}/视频 1.svg" alt="">
        <span>视频</span>
      </button>
      <button type="button" class="center ${active === "scene" ? "active" : ""}" data-nav="scene" aria-label="在听">
        <img src="${PIC}/Ellipse 13219.svg" alt="">
        <img class="center-glyph" src="${PIC}/Icon.svg" alt="">
      </button>
      <button type="button">
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
function sceneCards() {
  return `
    <article class="scene-card s1" data-nav="scene">
      <div class="sc-photo" style="background-image:url('${PIC}/Change Image Here.png')"></div>
      <span class="sc-badge-img"><img src="${PIC}/Icon Container-1.svg" alt=""></span>
      <div class="sc-text">
        <strong>通勤路上</strong>
        <em>在路上慢慢切换状态</em>
      </div>
    </article>

    <article class="scene-card s2" data-nav="scene">
      <div class="sc-photo" style="background-image:url('${PIC}/Photo/City haze.png')"></div>
      <span class="sc-badge-img black"><img src="${PIC}/Group 1000001037.svg" alt=""></span>
      <div class="sc-text">
        <strong>城市漫游</strong>
        <em>把当下变成旅途的背景</em>
      </div>
    </article>`;
}

/* ---------- Home (在听首页) ---------- */

function renderHome() {
  return `
    <section class="ai-work-content" aria-label="AI参赛作品：在听首页">
      <div class="ai-work-frame" data-node-id="356:9307">
        <div class="ai-search-row">
          <label class="ai-search">
            <img src="${PIC}/搜索 1.svg" alt="">
            <span>搜索歌曲 / 歌手 / 歌单</span>
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
            <h2>为此刻推荐</h2>
            <button type="button" data-nav="scene">更多 〉</button>
            <p class="ai-scene-sub">Music for this moment</p>
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
            <button class="playlist-card morning" type="button">
              <span></span><strong>清晨 · 元气</strong><em>32 首</em><b>▶</b>
            </button>
            <button class="playlist-card relax" type="button">
              <span></span><strong>放松 · 治愈</strong><em>28 首</em><b>▶</b>
            </button>
            <button class="playlist-card rain" type="button">
              <span></span><strong>雨天 · 安静</strong><em>30 首</em><b>▶</b>
            </button>
          </div>
          <button class="ai-more-note" type="button">更多 〉</button>
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
          <button class="scene-more" type="button" aria-label="更多">
            <i></i><i></i><i></i>
          </button>
        </header>

        <div class="scene-prompt">
          <img class="scene-prompt-spark" src="${PIC}/Group 145.svg" alt="">
          <span>我在跑步，想把今天的情绪全部跑掉</span>
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
          ${SCENE_TABS.map((t, i) => `<button type="button" class="scene-tab${i === 0 ? " active" : ""}">${t}</button>`).join("")}
        </div>

        <h2 class="scene-section-title">选择你的此刻状态</h2>
        <p class="scene-section-sub">AI将根据你的状态生成专属音乐氛围</p>

        <div class="ai-scene-track scene-track-page">
          ${sceneCards()}
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
  { title: "想自由", artist: "林宥嘉", cover: "#bfcccc" },
  { title: "Everyday", artist: "Ariana Grande", cover: "#bfcccc" }
];

function songRow(song, i) {
  const top = 451 + i * 58;
  return `
    <div class="song-row" style="top:${top}px">
      <div class="song-cover" style="background:${song.cover}"></div>
      <span class="song-title">${song.title}</span>
      <span class="song-artist">${song.artist}</span>
      ${song.active ? `<span class="song-play-active" aria-hidden="true"></span>` : `<span class="song-play" aria-hidden="true"></span>`}
      <span class="song-dots">...</span>
    </div>`;
}

function renderResults() {
  return `
    <section class="ai-work-content" aria-label="歌曲推荐">
      <div class="results-page" data-node-id="365:9389">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">歌曲推荐</h1>
        <button class="results-more" type="button" aria-label="更多">...</button>

        <div class="results-photo">
          <div class="results-photo-img" style="background-image:url('${PIC}/Photo/City haze.png')"></div>
          <div class="results-mood-input"><span>写点此刻心情</span></div>
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

        <div class="results-mascot"><img src="${PIC}/33.png" alt=""></div>
        <div class="results-bubble">
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
    rw(c.img, `<div class="rimg ${c.rot}"><img src="${PIC}/${c.src}" alt=""><span class="card-play"></span></div>`) +
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
    `<i class="eqbar${i === 7 ? " on" : ""}" style="top:${(top0 + i * step).toFixed(2)}px;left:${(right - w).toFixed(2)}px;width:${w}px"></i>`
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
        <button class="results-more" type="button" aria-label="更多">...</button>
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
        <button class="results-more" type="button" aria-label="更多">...</button>
      </div>
    </section>

    ${bottomNav("player")}
  `;
}

/* ---------- 音乐日记 (日记编辑 + 公开信息流) ---------- */

function renderDiary() {
  return `
    <section class="ai-work-content" aria-label="音乐日记">
      <div class="diary-page" data-node-id="365:9490">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">音乐日记</h1>
        <button class="diary-save" type="button" data-nav="diarylog">保存日记</button>

        <div class="diary-card composer-card"></div>
        <div class="composer-photo">
          <img src="${PIC}/Photo/City haze.png" alt="">
          <span class="composer-close">×</span>
        </div>
        <div class="composer-textarea"><span>记录此刻的心情...</span></div>
        <div class="composer-songchip">
          <span class="cs-cover"></span>
          <strong class="cs-title">慢慢喜欢你</strong>
          <em class="cs-artist">莫文蔚</em>
          <span class="cs-play" aria-hidden="true"></span>
        </div>
        <span class="ctag t1">雨天</span>
        <span class="ctag t2">安静</span>
        <span class="ctag t3">治愈</span>
        <span class="ctag-add">+</span>
        <div class="composer-divider"></div>
        <span class="composer-publabel">公开设置</span>
        <span class="toggle-private">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="#6b7375" stroke-width="2"/><rect x="5" y="10" width="14" height="10" rx="2" fill="#6b7375"/></svg>
          私人
        </span>
        <span class="toggle-public">●&nbsp;&nbsp;公开</span>

        <span class="diary-tab tab1">公开日记</span>
        <span class="diary-tab tab2 active">推荐</span>
        <span class="diary-tab tab3">关注</span>

        <div class="diary-card feed-card"></div>
        <span class="feed-avatar a1"></span>
        <strong class="feed-name n1">小鲸鱼</strong>
        <em class="feed-time tm1">2分钟前</em>
        <span class="feed-more">...</span>
        <p class="feed-text">雨后的城市，空气里都是温柔的味道 ☔</p>
        <div class="feed-photo"><img src="${PIC}/Photo/City haze.png" alt=""></div>
        <div class="feed-song">
          <span class="fs-cover"></span>
          <strong class="fs-title">想自由</strong>
          <em class="fs-artist">林宥嘉</em>
          <span class="fs-play" aria-hidden="true"></span>
        </div>
        <span class="feed-stat s-like"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 20S4 15 4 9.5A3.8 3.8 0 0 1 12 7 3.8 3.8 0 0 1 20 9.5C20 15 12 20 12 20z" fill="none" stroke="#0a0e0e" stroke-width="1.8"/></svg>128</span>
        <span class="feed-stat s-cmt"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M4 5h16v11H9l-4 3v-3H4z" fill="none" stroke="#0a0e0e" stroke-width="1.8" stroke-linejoin="round"/></svg>32</span>
        <span class="feed-stat s-share"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M4 12 20 5 15 21 12 13z" fill="none" stroke="#0a0e0e" stroke-width="1.8" stroke-linejoin="round"/></svg>12</span>

        <div class="diary-card feed-preview"></div>
        <span class="feed-avatar a2"></span>
        <strong class="feed-name n2">星星也听歌</strong>
        <em class="feed-time tm2">1小时前</em>

        <button class="diary-fab" type="button" aria-label="新建">+</button>
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

function renderDiaryLog() {
  return `
    <section class="ai-work-content" aria-label="音乐日记">
      <div class="diarylog-page" data-node-id="389:9329">
        <button class="results-back" type="button" data-nav="back" aria-label="返回">‹</button>
        <h1 class="results-title">音乐日记</h1>

        <div class="dl-cal-card"></div>
        <span class="dl-month">6月</span>
        ${DIARY_WEEKS.map(([w, l]) => `<span class="dl-wk" style="left:${l}px">${w}</span>`).join("")}
        ${DIARY_DATES.map(([n, l]) => `<span class="dl-date${n === 18 ? " sel" : ""}" style="left:${l}px">${n}</span>`).join("")}

        <span class="dl-recent">最近记录</span>

        <div class="dl-card c1" data-nav="player"></div>
        <span class="dl-time t1">今天 21:18</span>
        <span class="dl-title ti1">低噪放松的一晚</span>
        <span class="dl-desc d1">小Q推荐了 12 首歌，整体情绪从疲惫转向平静。</span>
        <span class="dl-pill p1">平静</span>

        <div class="dl-card c2"></div>
        <span class="dl-time t2">昨天 08:42</span>
        <span class="dl-title ti2">通勤路上的绿色能量</span>
        <span class="dl-desc d2">照片识别为晴天街景，推荐节奏更明亮。</span>
        <span class="dl-pill p2">轻快</span>

        <div class="dl-card c3"></div>
        <span class="dl-curve-title">本周情绪曲线</span>
        ${MOOD_LINES.map(([c, l, t, w, bg]) => `<i class="dl-line ${c}" style="left:${l}px;top:${t}px;width:${w}px;background:${bg}"></i>`).join("")}
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

function renderProfile() {
  return `
    <section class="ai-work-content" aria-label="我的在听档案">
      <div class="profile-page" data-node-id="389:9702">
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
        <button class="pf-setting" type="button">去设置</button>
      </div>
    </section>

    ${statusBar()}
    ${miniPlayer()}
    ${bottomNav("profile")}
  `;
}

/* ---------- Router ---------- */

const views = { home: renderHome, scene: renderScene, analyze: renderAnalyze, results: renderResults, recwheel: renderRecwheel, player: renderPlayer, diary: renderDiary, diarylog: renderDiaryLog, profile: renderProfile };

let analyzeTimer;

function renderView() {
  clearTimeout(analyzeTimer);
  screen.innerHTML = views[state.view]();
  const content = screen.querySelector(".ai-work-content");
  if (content) content.scrollTop = 0;

  /* AI分析中 → 自动进入歌曲推荐 */
  if (state.view === "analyze") {
    analyzeTimer = setTimeout(() => {
      if (state.view === "analyze") {
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
  const navEl = event.target.closest("[data-nav]");
  if (navEl && screen.contains(navEl)) {
    let next = navEl.dataset.nav;
    if (next === "back") {
      next = state.history.pop() || "home";
    } else {
      if (next === state.view) return;
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

/* Activate a tab chip on the scene page (visual only) */
document.addEventListener("click", (event) => {
  const tab = event.target.closest(".scene-tab");
  if (!tab) return;
  tab.parentElement.querySelectorAll(".scene-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
});

applyDevice();
renderView();
