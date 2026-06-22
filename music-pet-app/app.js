import {
  analyzeCameraPhoto,
  analyzeScene,
  completeTask,
  getDiaries,
  getDiaryDetail,
  getForYou,
  getPet,
  getPlayer,
  getProfile,
  getRecommendations,
  getScenes,
  getTasks,
  saveDiary
} from "./api.js";

const screen = document.querySelector("#screen");
const topBar = document.querySelector("#topBar");
const phone = document.querySelector(".phone");
const tabs = [...document.querySelectorAll(".tab-button")];

const appState = {
  selectedSongId: "sunny",
  detailOpen: false,
  lastDiaryId: "rain-night"
};

const routeMeta = {
  home: { title: "", root: "home", backTo: null },
  camera: { title: "拍照推荐", root: "home", backTo: "home" },
  scene: { title: "场景选择", root: "home", backTo: "home" },
  analyzing: { title: "AI分析中", root: "home", backTo: "scene" },
  recommendations: { title: "歌曲推荐", root: "home", backTo: "home" },
  "for-you": { title: "为你推荐", root: "home", backTo: "recommendations" },
  player: { title: "在线听", root: "home", backTo: "for-you" },
  "diary-new": { title: "音乐日记", root: "diary-list", backTo: "home", action: "保存日记" },
  "diary-list": { title: "音乐日记", root: "diary-list", backTo: "player" },
  "diary-detail": { title: "日记详情", root: "diary-list", backTo: "diary-list" },
  profile: { title: "我的在听档案", root: "profile", backTo: "home" },
  pet: { title: "我的专属陪伴", root: "profile", backTo: "home" },
  "pet-actions": { title: "我的专属陪伴", root: "profile", backTo: "pet" },
  tasks: { title: "任务", root: "profile", backTo: "pet" },
  video: { title: "视频", root: "video", backTo: "home" }
};

const routes = {
  home: renderHome,
  camera: renderCamera,
  scene: renderScene,
  analyzing: renderAnalyzing,
  recommendations: renderRecommendations,
  "for-you": renderForYou,
  player: renderPlayer,
  "diary-new": renderDiaryNew,
  "diary-list": renderDiaryList,
  "diary-detail": renderDiaryDetail,
  profile: renderProfile,
  pet: renderPet,
  "pet-actions": renderPetActions,
  tasks: renderTasks,
  video: renderVideo
};

function navigate(route) {
  appState.detailOpen = false;
  window.location.hash = route;
}

function currentRoute() {
  return window.location.hash.replace("#", "") || "home";
}

function setTopBar(route) {
  const meta = routeMeta[route] || routeMeta.home;
  const backButton = meta.backTo
    ? `<button class="icon-button back-button" data-route="${meta.backTo}" type="button" aria-label="返回"></button>`
    : "<span></span>";
  const rightButton = meta.action
    ? `<button class="text-action" data-action="save-diary" type="button">${meta.action}</button>`
    : `<button class="icon-button more-button" type="button" aria-label="更多"></button>`;

  topBar.innerHTML = `
    ${backButton}
    <strong>${meta.title}</strong>
    ${route === "home" ? "<span></span>" : rightButton}
  `;
}

function setActiveTab(route) {
  const root = routeMeta[route]?.root || "home";
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.route === root);
  });
}

async function render() {
  const route = routes[currentRoute()] ? currentRoute() : "home";
  phone.classList.toggle("figma-home", route === "home");
  setTopBar(route);
  setActiveTab(route);
  screen.innerHTML = `<div class="loading-card">正在生成音乐氛围</div>`;
  screen.innerHTML = await routes[route]();
}

function tagRow(items) {
  return `<div class="tag-row">${items.map((item) => `<span>${item}</span>`).join("")}</div>`;
}

function petShape(size = "medium") {
  return `
    <div class="pet-shape ${size}" aria-hidden="true">
      <i class="ear left"></i>
      <i class="ear right"></i>
      <span class="face"><i></i><i></i><b></b></span>
      <span class="headphone"></span>
    </div>
  `;
}

function cover(song, size = "") {
  return `<span class="cover ${song?.cover || "green"} ${size}" aria-hidden="true"><i></i></span>`;
}

function songRow(song, route = "player") {
  return `
    <button class="song-row" data-route="${route}" data-song-id="${song.id}" type="button">
      ${cover(song)}
      <span>
        <strong>${song.title}</strong>
        <em>${song.artist} / ${song.tag}</em>
      </span>
      <i class="play-dot" aria-hidden="true"></i>
    </button>
  `;
}

function routePill(label, route, extraClass = "") {
  return `<button class="pill-button ${extraClass}" data-route="${route}" type="button">${label}</button>`;
}

async function renderHome() {
  return `
    <section class="figma-home-frame" data-node-id="365:9308">
      <div class="figma-status">
        <strong>9:41</strong>
        <i></i>
        <span class="figma-levels" aria-hidden="true">
          <b></b><b></b><b></b>
        </span>
      </div>

      <div class="figma-search">
        <img src="./picture/Screen/Search/Icon.svg" alt="">
        <span>搜索歌曲 / 歌手 / 歌单</span>
      </div>
      <img class="figma-sound" src="./picture/Screen/disc.svg" alt="">

      <div class="figma-speech">
        <p>Hi~<br>今天想听点什么<br>好音乐?</p>
      </div>
      <img class="figma-pet" src="./picture/Screen/33%201.png" alt="音乐宠物">

      <button class="figma-pet-link" data-route="pet" type="button">
        <strong>音乐宠物 〉</strong>
        <span>我的专属陪伴</span>
        <span>我的在听档案</span>
      </button>

      <button class="figma-photo-cta" data-route="camera" type="button">
        <span class="figma-camera-box">
          <img src="./picture/Screen/camera.svg" alt="">
        </span>
        <strong>拍照推荐</strong>
        <em>上传或拍照，为此刻推荐</em>
        <b>〉</b>
      </button>

      <header class="figma-section scene-title">
        <h2>场景选择</h2>
        <button data-route="scene" type="button">更多选项 〉</button>
        <p>AI将根据你的状态生成专属音乐氛围</p>
      </header>

      <button class="figma-scene-card sunny" data-route="scene" type="button">
        <img class="scene-photo" src="./picture/Screen/Change%20Image%20Here.png" alt="">
        <span class="scene-icon pink-note">♪</span>
        <span class="scene-caption">
          <strong>通勤路上</strong>
          <em>在路上慢慢切换状态</em>
        </span>
      </button>
      <button class="figma-scene-card city" data-route="scene" type="button">
        <img class="scene-photo" src="./picture/Screen/Photo/City%20haze.png" alt="">
        <span class="scene-icon black-city">▦</span>
        <span class="scene-caption">
          <strong>城市漫游</strong>
          <em>把当下变成旅途的背景</em>
        </span>
      </button>

      <button class="figma-mini-player" data-route="player" data-song-id="sunny" type="button">
        <img src="./picture/Screen/Mini%20Player/Cover.png" alt="">
        <span><strong>晴天</strong><em>周杰伦</em></span>
        <img class="mini-play" src="./picture/Screen/Mini%20Player/Play.svg" alt="">
        <i></i>
      </button>

      <nav class="figma-bottom-nav" aria-label="首页底部导航">
        <button class="active" data-route="home" type="button">
          <img src="./picture/Screen/home.svg" alt="">
          <span>首页</span>
        </button>
        <button data-route="video" type="button">
          <img src="./picture/Screen/video.svg" alt="">
          <span>视频</span>
        </button>
        <button class="center" data-route="camera" type="button">
          <img src="./picture/Screen/Ellipse%2013219.svg" alt="">
          <img src="./picture/Screen/Icon-1.svg" alt="">
        </button>
        <button data-route="diary-list" type="button">
          <img src="./picture/Screen/community.svg" alt="">
          <span>社区</span>
        </button>
        <button data-route="profile" type="button">
          <img src="./picture/Screen/profile.svg" alt="">
          <span>我的</span>
        </button>
        <i></i>
      </nav>

      <header class="figma-section recommend-title">
        <h2>为此此刻推荐</h2>
        <button data-route="for-you" type="button">更多 〉</button>
      </header>
      <div class="figma-playlists">
        <button class="playlist-card morning" data-route="recommendations" type="button">
          <span></span><strong>清晨 · 元气</strong><em>5 首</em><b>▶</b>
        </button>
        <button class="playlist-card relax" data-route="recommendations" type="button">
          <span></span><strong>放松 · 治愈</strong><em>5 首</em><b>▶</b>
        </button>
        <button class="playlist-card rain" data-route="recommendations" type="button">
          <span></span><strong>雨天 · 安静</strong><em>6 首</em><b>▶</b>
        </button>
      </div>
    </section>
  `;
}

async function renderCamera() {
  return `
    <section class="camera-view">
      <input class="camera-input" id="cameraInput" type="file" accept="image/*" capture="environment">
      <div class="camera-frame">
        <i class="scan-line"></i>
        ${petShape("dot")}
      </div>
      <h2>用此刻画面生成歌曲推荐</h2>
      <p>手机上会调用内置相机；电脑预览时会打开文件选择器。</p>
      <div class="camera-actions">
        <button class="primary-cta" data-action="open-camera" type="button">打开相机</button>
        <button class="ghost-cta" data-route="recommendations" type="button">跳过拍照，查看推荐</button>
      </div>
    </section>
  `;
}

async function renderScene() {
  const scenes = await getScenes();
  return `
    <section class="scene-prompt">
      <p>我在跑步，想把今天的情绪全部跑掉</p>
      ${tagRow(["放空", "专注", "提神", "陪伴", "释放"])}
    </section>
    <div class="scene-grid">
      ${scenes.map((scene) => `
        <button class="scene-card" data-route="analyzing" type="button">
          <strong>${scene.title}</strong>
          <span>${scene.copy}</span>
          <em>${scene.mood}</em>
        </button>
      `).join("")}
    </div>
    <button class="primary-cta" data-route="analyzing" type="button">查看推荐结果</button>
  `;
}

async function renderAnalyzing() {
  const data = await analyzeScene();
  return `
    <section class="analysis-hero">
      <div class="orbital">
        ${petShape("dot")}
        <i></i><i></i><i></i>
      </div>
      <h2>${data.title}</h2>
    </section>
    <section class="progress-card">
      <h3>推荐生成进度</h3>
      ${data.steps.map((step, index) => `
        <button class="step-row ${index < 2 ? "done" : ""}" data-route="${index === data.steps.length - 1 ? "recommendations" : "analyzing"}" type="button">
          <i></i>
          <span>${step}</span>
          <em>${index < 2 ? "已完成" : index === 2 ? "进行中" : "等待"}</em>
        </button>
      `).join("")}
      ${tagRow(data.tags)}
    </section>
    <button class="primary-cta" data-route="recommendations" type="button">查看推荐结果</button>
  `;
}

async function renderRecommendations() {
  const data = await analyzeCameraPhoto();
  return `
    <section class="photo-result">
      <span>AI 分析</span>
      ${tagRow(data.tags)}
    </section>
    <section class="section-title">
      <h2>为你推荐</h2>
      <button data-route="for-you" type="button">查看更多 〉</button>
    </section>
    <div class="song-list">
      ${data.songs.map((song) => songRow(song)).join("")}
    </div>
    <section class="pet-message">
      ${petShape("tiny")}
      <p>${data.petFeedback}</p>
    </section>
    <div class="dual-actions">
      ${routePill("写点此刻心情", "diary-new")}
      ${routePill("查看更多", "for-you", "strong")}
    </div>
  `;
}

async function renderForYou() {
  const data = await getForYou();
  return `
    <section class="for-you-cover">
      <span>${data.moods[0]}</span>
      <h1>${data.title}</h1>
      <p>${data.lead}</p>
      <button data-route="player" data-song-id="${data.songs[0].id}" type="button">Get Started</button>
    </section>
    <div class="mood-row">
      ${data.moods.map((mood) => `<span>${mood}</span>`).join("")}
    </div>
    <div class="song-list floating-list">
      ${data.songs.map((song) => songRow(song)).join("")}
    </div>
  `;
}

async function renderPlayer() {
  const song = await getPlayer(appState.selectedSongId);
  return `
    <section class="player-area">
      ${cover(song, "large")}
      <h1>${song.title}</h1>
      <p>${song.artist}</p>
      <div class="timeline"><i></i></div>
      <div class="time-row"><span>${song.elapsed}</span><span>${song.remaining}</span></div>
      <div class="controls">
        <button class="control prev" type="button" aria-label="上一首"></button>
        <button class="control play" type="button" aria-label="播放"></button>
        <button class="control next" type="button" aria-label="下一首"></button>
      </div>
    </section>
    <section class="detail-panel ${appState.detailOpen ? "open" : ""}">
      <button data-action="toggle-song-detail" type="button">查看详情</button>
      <p>${song.detail}</p>
    </section>
    <div class="dual-actions">
      ${routePill("查看详情", "player", "js-detail")}
      ${routePill("创建日记", "diary-new", "strong")}
    </div>
  `;
}

async function renderDiaryNew() {
  const song = await getPlayer(appState.selectedSongId);
  return `
    <section class="diary-editor">
      <button class="close-button" data-route="home" type="button">×</button>
      <textarea id="diaryText" aria-label="记录此刻的心情">雨后的城市，空气里都是温柔的味道。</textarea>
      ${songRow(song, "player")}
      ${tagRow(["雨天", "安静", "治愈", "+"])}
    </section>
    <section class="settings-list">
      <button type="button"><strong>公开设置</strong><span>私人 / 公开</span></button>
      <button type="button"><strong>公开日记</strong><span>推荐 / 关注</span></button>
    </section>
    <button class="primary-cta" data-action="save-diary" type="button">保存日记</button>
  `;
}

async function renderDiaryList() {
  const diaries = await getDiaries();
  return `
    <section class="calendar-card">
      <header><strong>6月</strong><span>最近记录</span></header>
      <div class="week-row">${["一", "二", "三", "四", "五", "六", "日"].map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="date-grid">
        ${Array.from({ length: 21 }, (_, index) => {
          const date = index + 1;
          return `<button class="${date === 16 ? "active" : [12, 13, 14, 15, 17, 18].includes(date) ? "marked" : ""}" data-route="diary-detail" type="button">${date}</button>`;
        }).join("")}
      </div>
    </section>
    <div class="diary-list">
      ${diaries.map((item) => `
        <button class="diary-card" data-route="diary-detail" data-diary-id="${item.id}" type="button">
          ${cover({ cover: item.id === "rain-night" ? "blue" : "green" })}
          <span>
            <em>${item.time}</em>
            <strong>${item.title}</strong>
            <small>${item.copy}</small>
          </span>
        </button>
      `).join("")}
    </div>
  `;
}

async function renderDiaryDetail() {
  const item = await getDiaryDetail(appState.lastDiaryId);
  return `
    <section class="diary-detail-hero">
      <span>${item.time}</span>
      <h1>${item.title}</h1>
    </section>
    <section class="diary-quote">
      <p>${item.copy}</p>
      <strong>${item.song}</strong>
      ${tagRow(item.tags)}
    </section>
    <button class="primary-cta" data-route="player" type="button">返回播放页</button>
  `;
}

async function renderProfile() {
  const data = await getProfile();
  return `
    <section class="profile-card">
      ${petShape("medium")}
      <h1>${data.name}</h1>
      <p>${data.copy}</p>
    </section>
    <div class="stats-grid">
      ${data.stats.map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("")}
    </div>
    <section class="profile-section">
      <h2>偏好标签</h2>
      ${tagRow(data.tags)}
    </section>
    <button class="setting-row" data-route="pet" type="button">
      <span>宠物声音和陪伴方式</span>
      <strong>${data.reminder}</strong>
    </button>
  `;
}

async function renderPet() {
  const data = await getPet();
  return `
    <section class="pet-room">
      ${petShape("large")}
      <h1>我的专属陪伴</h1>
      <p>已解锁 ${data.unlocked}，点击即可以预览</p>
      <button data-route="tasks" type="button">去做任务</button>
    </section>
    <div class="pet-tabs">
      <button class="active" data-route="pet" type="button">装扮</button>
      <button data-route="pet-actions" type="button">动作</button>
    </div>
    <div class="wardrobe-grid">
      ${data.skins.slice(0, 10).map((name) => `
        <button type="button">${petShape("mini")}<span>${name}</span></button>
      `).join("")}
    </div>
  `;
}

async function renderPetActions() {
  const data = await getPet();
  return `
    <section class="pet-room compact-room">
      ${petShape("large")}
      <h1>动作</h1>
      <p>做任务解锁装扮 / 动作</p>
      <button data-route="tasks" type="button">去提升</button>
    </section>
    <div class="pet-tabs">
      <button data-route="pet" type="button">装扮</button>
      <button class="active" data-route="pet-actions" type="button">动作</button>
    </div>
    <div class="action-grid">
      ${data.actions.map((name, index) => `
        <button type="button"><span>${name}</span><strong>${index < 8 ? "已解锁" : `${(index + 1) * 500}`}</strong></button>
      `).join("")}
    </div>
  `;
}

async function renderTasks() {
  const data = await getTasks();
  return `
    <section class="task-summary">
      <span>今日照顾进度</span>
      <strong>${data.progress} / ${data.total}</strong>
      <p>完成全部任务可获得：${data.reward}</p>
      <div class="pet-metrics">
        <span>能量 ${data.pet.energy}</span>
        <span>亲密 ${data.pet.intimacy}</span>
        <span>碎片 ${data.pet.shards}</span>
      </div>
    </section>
    <div class="task-list">
      ${data.tasks.map((task) => `
        <button class="task-card ${task.done ? "done" : ""}" data-task-id="${task.id}" type="button">
          <i>${task.done ? "✓" : "+"}</i>
          <span><strong>${task.title}</strong><em>${task.copy}</em></span>
          <b>${task.reward}</b>
        </button>
      `).join("")}
    </div>
  `;
}

async function renderVideo() {
  return `
    <section class="empty-page">
      <h1>视频</h1>
      <p>当前音乐宠物流程聚焦“在听”，这里先保留 QQ 音乐原有入口。</p>
      <button class="primary-cta" data-route="home" type="button">回到首页</button>
    </section>
  `;
}

async function handleSaveDiary() {
  const text = document.querySelector("#diaryText")?.value || "记录此刻的心情。";
  const song = await getPlayer(appState.selectedSongId);
  const saved = await saveDiary({
    title: "刚保存的音乐日记",
    song: `${song.title} / ${song.artist}`,
    copy: text
  });
  appState.lastDiaryId = saved.id;
  navigate("diary-list");
}

document.addEventListener("click", async (event) => {
  const detailButton = event.target.closest(".js-detail, [data-action='toggle-song-detail']");
  if (detailButton) {
    appState.detailOpen = !appState.detailOpen;
    render();
    return;
  }

  if (event.target.closest("[data-action='open-camera']")) {
    document.querySelector("#cameraInput")?.click();
    return;
  }

  if (event.target.closest("[data-action='save-diary']")) {
    await handleSaveDiary();
    return;
  }

  const taskButton = event.target.closest("[data-task-id]");
  if (taskButton) {
    await completeTask(taskButton.dataset.taskId);
    render();
    return;
  }

  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget) {
    if (routeTarget.dataset.songId) appState.selectedSongId = routeTarget.dataset.songId;
    if (routeTarget.dataset.diaryId) appState.lastDiaryId = routeTarget.dataset.diaryId;
    navigate(routeTarget.dataset.route);
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.matches("#cameraInput")) {
    await analyzeCameraPhoto();
    navigate("recommendations");
  }
});

window.addEventListener("hashchange", render);
render();
