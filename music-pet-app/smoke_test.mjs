import { readFile } from "node:fs/promises";
import { createMusicPetRecommendation } from "./server/music-pet-pipeline.mjs";
import { analyzeVideoRhythm } from "./server/video-rhythm-analyzer.mjs";

const [index, app, css] = await Promise.all([
  readFile(new URL("./index.html", import.meta.url), "utf8"),
  readFile(new URL("./app.js", import.meta.url), "utf8"),
  readFile(new URL("./styles.css", import.meta.url), "utf8")
]);

function assertContains(name, text, values) {
  const missing = values.filter((value) => !text.includes(value));
  if (missing.length) {
    throw new Error(`${name} missing: ${missing.join(", ")}`);
  }
}

assertContains("index", index, [
  "Weekendgo App Simulator",
  "device-controls",
  "iphone-shell",
  "./styles.css",
  "./app.js"
]);

assertContains("app", app, [
  "iphone16: { name: \"iPhone 16\", width: 393, height: 852",
  "iphone16pro: { name: \"iPhone 16 Pro\", width: 402, height: 874",
  "renderHome",
  "data-node-id=\"356:9307\"",
  "const views = {",
  "renderCommunity",
  "renderDiary",
  "MUSIC_GROWTH_MODES",
  "renderMusicGrowthPanel",
  "requestGrowthRecommendation",
  "renderPhotoResult",
  "renderChat",
  "data-chat-form",
  "data-chat-prompt",
  "data-listen-song",
  "data-equip-kind",
  "融合用户库",
  "运动提神",
  "开心转圈",
  "音乐养成状态",
  "ai-scene-section",
  "ai-scene-track",
  "ai-mini-player",
  "音乐宠物",
  "拍照推荐",
  "场景选择",
  "晴天",
  "律动"
]);

assertContains("css", css, [
  "--screen-w: 393px",
  "--screen-h: 852px",
  "--screen-r: 47px",
  ".iphone-body",
  ".app-container",
  ".ai-work-frame",
  ".music-growth-card",
  ".growth-modes",
  ".beat-bounce",
  ".photo-result-page",
  ".pr-songs",
  ".ai-scene-section",
  ".ai-scene-track",
  ".ai-photo-cta",
  ".ai-mini-player",
  ".ai-bottom-nav",
  ".ai-playlists"
]);

const recommendation = await createMusicPetRecommendation({
  mode: "energy",
  sceneId: "energy",
  recentSongs: ["晴天"],
  petState: {
    energy: 68,
    intimacy: 42,
    growth: 340,
    shards: 6
  }
});

if (recommendation.frontendMode !== "energy") {
  throw new Error(`pipeline mode mismatch: ${recommendation.frontendMode}`);
}

assertContains("pipeline", recommendation.pipeline.join(","), [
  "VisionAnalyzer",
  "AIReranker",
  "PersonaAgent",
  "PetGrowthAgent"
]);

if (!recommendation.personaProvider || !recommendation.musicProvider) {
  throw new Error("pipeline missing provider metadata");
}

if (!recommendation.userProfile?.likedTags?.length) {
  throw new Error("pipeline missing fused user profile");
}

if (!recommendation.songs.some((song) => song.matchReason.includes("符合你的偏好"))) {
  throw new Error("ranking did not use user preference signals");
}

const videoRhythm = analyzeVideoRhythm({
  durationSec: 8,
  sampleRate: 4,
  motionSeries: [0.1, 0.8, 0.2, 0.85, 0.18, 0.86, 0.2, 0.82, 0.18, 0.84, 0.2, 0.88, 0.22, 0.8, 0.2, 0.82],
  audioEnergySeries: [0.12, 0.9, 0.18, 0.88, 0.2, 0.92, 0.2, 0.86, 0.18, 0.9, 0.2, 0.88, 0.18, 0.86, 0.2, 0.9]
});

if (!videoRhythm.bpm || !videoRhythm.rhythmProfile?.speed || !videoRhythm.petDirective?.animation) {
  throw new Error("video rhythm analyzer missing animation output");
}

console.log("smoke ok");
