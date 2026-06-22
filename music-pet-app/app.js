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
  view: "home"
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
      <button type="button">
        <img src="${PIC}/我的 1.svg" alt="">
        <span>我的</span>
      </button>
      <i aria-hidden="true"></i>
    </nav>`;
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
          <button class="ai-pet-link" type="button">
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

    <button class="ai-mini-player" type="button">
      <img src="${PIC}/Mini Player/Cover.png" alt="">
      <span><strong>晴天</strong><em>周杰伦</em></span>
      <i class="mini-play" aria-hidden="true"></i>
      <i class="mini-menu" aria-hidden="true"></i>
    </button>

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
          <button class="scene-back" type="button" data-nav="home" aria-label="返回">
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

    <button class="scene-cta" type="button" data-nav="home">查看推荐结果</button>

    ${bottomNav("scene")}
  `;
}

/* ---------- Router ---------- */

const views = { home: renderHome, scene: renderScene };

function renderView() {
  screen.innerHTML = views[state.view]();
  const content = screen.querySelector(".ai-work-content");
  if (content) content.scrollTop = 0;
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
    const next = navEl.dataset.nav;
    if (next !== state.view) {
      state.view = next;
      renderView();
    }
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
