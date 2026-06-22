import { readFile } from "node:fs/promises";

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
  "renderAiCompetitionHome",
  "data-node-id=\"365:9308\"",
  "ai-scene-section",
  "ai-scene-track",
  "ai-mini-player",
  "音乐宠物",
  "拍照推荐",
  "场景选择",
  "晴天",
  "为此刻推荐"
]);

assertContains("css", css, [
  "--screen-w: 393px",
  "--screen-h: 852px",
  "--screen-r: 47px",
  ".iphone-body",
  ".app-container",
  ".ai-work-frame",
  ".ai-scene-section",
  ".ai-scene-track",
  ".ai-photo-cta",
  ".ai-mini-player",
  ".ai-bottom-nav",
  ".ai-playlists"
]);

console.log("smoke ok");
