import { readFile } from "node:fs/promises";
import {
  apiConfig,
  getHome,
  getRecommendations,
  getTasks
} from "./api.js";

const [index, app, css] = await Promise.all([
  readFile(new URL("./index.html", import.meta.url), "utf8"),
  readFile(new URL("./app.js", import.meta.url), "utf8"),
  readFile(new URL("./styles.css", import.meta.url), "utf8")
]);

const requiredText = [
  "音乐宠物",
  "拍照推荐",
  "搜索歌曲 / 歌手 / 歌单",
  "场景选择",
  "AI分析中",
  "歌曲推荐",
  "为你推荐",
  "在线听",
  "音乐日记",
  "我的在听档案",
  "我的专属陪伴",
  "任务"
];

const requiredRoutes = [
  "home",
  "camera",
  "scene",
  "analyzing",
  "recommendations",
  "for-you",
  "player",
  "diary-new",
  "diary-list",
  "diary-detail",
  "profile",
  "pet",
  "pet-actions",
  "tasks",
  "video"
];

function assertContains(name, text, values) {
  const missing = values.filter((value) => !text.includes(value));
  if (missing.length) {
    throw new Error(`${name} missing: ${missing.join(", ")}`);
  }
}

assertContains("index", index, ["./styles.css", "./app.js", "zh-CN"]);
assertContains("app routes", app, requiredRoutes);
assertContains("app text", app, requiredText);
assertContains("figma assets", app, [
  "./picture/Screen/33%201.png",
  "./picture/Screen/Change%20Image%20Here.png",
  "./picture/Screen/Photo/City%20haze.png",
  "./picture/Screen/Mini%20Player/Cover.png"
]);
assertContains("css", css, [
  ".phone.figma-home",
  ".figma-home-frame",
  ".figma-photo-cta",
  ".figma-bottom-nav",
  "Noto Sans SC"
]);

const [home, recommendations, tasks] = await Promise.all([
  getHome(),
  getRecommendations(),
  getTasks()
]);

if (home.mixes.length !== 3) throw new Error("home mixes count mismatch");
if (recommendations.songs.length < 4) throw new Error("recommendations missing songs");
if (Object.keys(apiConfig.endpoints).length < 10) throw new Error("api endpoints missing");
if (tasks.total < 5) throw new Error("tasks missing");

console.log("smoke ok");
