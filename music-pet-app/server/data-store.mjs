import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSqliteCommand } from "./sqlite-store.mjs";
import { songCatalog } from "./music-catalog.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(root, "data", "music-pet-db.json");

const defaultState = {
  users: {
    demo: {
      id: "demo",
      name: "Demo User",
      pet: {
        energy: 68,
        intimacy: 42,
        growth: 340,
        shards: 6,
        mood: "轻快陪伴",
        equippedOutfit: "xingyu",
        equippedAction: "nod"
      },
      profile: {
        favoriteTags: ["通勤", "治愈", "人声", "城市感", "低干扰"],
        favoriteArtists: ["周杰伦", "莫文蔚", "Morning Tape"],
        dislikedTags: ["强刺激", "过强电子"],
        sceneAffinity: {
          commute: 0.82,
          heal: 0.76,
          focus: 0.64,
          energy: 0.42,
          "photo-rain": 0.72
        },
        timePreference: {
          morning: ["通勤", "轻快", "提神"],
          afternoon: ["专注", "低干扰", "Lo-fi"],
          evening: ["治愈", "人声", "低噪"],
          night: ["夜晚", "睡前", "放空"]
        }
      },
      inventory: {
        outfits: {
          xingyu: { unlocked: true, name: "星屿耳机", asset: "lan2 2.png" },
          yueting: { unlocked: true, name: "月庭耳机", asset: "绿色 2.png" },
          hongyi: { unlocked: true, name: "虹翼耳机", asset: "4 2.png" },
          rimian: { unlocked: false, name: "日冕耳机", asset: "黄色 2.png", requirement: "完成一次高能听歌" },
          huaxin: { unlocked: false, name: "花信耳机", asset: "肉色 2.png", requirement: "治愈值达到 60" },
          xingye: { unlocked: false, name: "星夜耳机", asset: "紫色 2.png", requirement: "连续专注 20 分钟" }
        },
        actions: {
          nod: { unlocked: true, name: "点头晃晃", asset: "act2.png" },
          listen: { unlocked: true, name: "安静听歌", asset: "act8.png" },
          peek: { unlocked: true, name: "偷偷看你", asset: "act9.png" },
          spin: { unlocked: false, name: "开心转圈", asset: "act5.png", requirement: "完成一次运动听歌" },
          cheer: { unlocked: false, name: "元气满满", asset: "act10.png", requirement: "高能歌曲累计 3 首" }
        }
      },
      listeningHistory: [
        { songId: "sunny", title: "晴天", artist: "周杰伦", action: "listen", sceneId: "commute", playedAt: "2026-06-24T08:20:00.000Z" },
        { songId: "slow-love", title: "慢慢喜欢你", artist: "莫文蔚", action: "favorite", sceneId: "heal", playedAt: "2026-06-23T21:10:00.000Z" },
        { songId: "city-lights", title: "City Lights", artist: "Morning Tape", action: "listen", sceneId: "focus", playedAt: "2026-06-23T15:30:00.000Z" },
        { songId: "rain-window", title: "Rain Window", artist: "Soul Soother", action: "favorite", sceneId: "photo-rain", playedAt: "2026-06-22T22:05:00.000Z" },
        { songId: "metro-breath", title: "Metro Breath", artist: "City Loops", action: "listen", sceneId: "commute", playedAt: "2026-06-22T08:11:00.000Z" },
        { songId: "study-lamp", title: "Study Lamp", artist: "Lo Room", action: "listen", sceneId: "focus", playedAt: "2026-06-21T14:20:00.000Z" },
        { songId: "night-blanket", title: "Night Blanket", artist: "Warm Noise", action: "listen", sceneId: "heal", playedAt: "2026-06-20T23:18:00.000Z" },
        { songId: "friend-signal", title: "Friend Signal", artist: "Weekend Chat", action: "share", sceneId: "commute", playedAt: "2026-06-20T18:42:00.000Z" },
        { songId: "everyday", title: "Everyday", artist: "Ariana Grande", action: "skip", sceneId: "energy", playedAt: "2026-06-19T18:40:00.000Z" },
        { songId: "heartbeat-run", title: "Heartbeat Run", artist: "Motion Club", action: "skip", sceneId: "energy", playedAt: "2026-06-18T19:00:00.000Z" }
      ],
      recommendationRecords: []
    }
  }
};

let cache;
let sqliteAvailable = process.env.DISABLE_SQLITE !== "1";

function defaultDbState() {
  return {
    ...structuredClone(defaultState),
    songCatalog
  };
}

export async function loadDb() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(dbPath, "utf8"));
  } catch {
    cache = structuredClone(defaultState);
    await persistDb();
  }
  return cache;
}

export async function getDemoUser() {
  if (sqliteAvailable) {
    try {
      return mergeUserDefaults(await runSqliteCommand("getUser", {}, defaultDbState()));
    } catch {
      sqliteAvailable = false;
    }
  }
  const db = await loadDb();
  db.users.demo ||= structuredClone(defaultState.users.demo);
  db.users.demo = mergeUserDefaults(db.users.demo);
  return db.users.demo;
}

export async function updateDemoUser(mutator) {
  const db = await loadDb();
  const user = db.users.demo ||= structuredClone(defaultState.users.demo);
  db.users.demo = mergeUserDefaults(user);
  const result = await mutator(user);
  await persistDb();
  return result ?? user;
}

function mergeUserDefaults(user) {
  return {
    ...structuredClone(defaultState.users.demo),
    ...user,
    pet: {
      ...structuredClone(defaultState.users.demo.pet),
      ...(user.pet || {})
    },
    profile: {
      ...structuredClone(defaultState.users.demo.profile),
      ...(user.profile || {}),
      sceneAffinity: {
        ...structuredClone(defaultState.users.demo.profile.sceneAffinity),
        ...(user.profile?.sceneAffinity || {})
      },
      timePreference: {
        ...structuredClone(defaultState.users.demo.profile.timePreference),
        ...(user.profile?.timePreference || {})
      }
    },
    inventory: {
      outfits: {
        ...structuredClone(defaultState.users.demo.inventory.outfits),
        ...(user.inventory?.outfits || {})
      },
      actions: {
        ...structuredClone(defaultState.users.demo.inventory.actions),
        ...(user.inventory?.actions || {})
      }
    },
    listeningHistory: user.listeningHistory?.length
      ? user.listeningHistory
      : structuredClone(defaultState.users.demo.listeningHistory),
    recommendationRecords: user.recommendationRecords || []
  };
}

export async function persistRecommendation(record) {
  const stampedRecord = {
    ...record,
    createdAt: record.createdAt || new Date().toISOString()
  };
  if (sqliteAvailable) {
    try {
      await runSqliteCommand("insertRecommendation", stampedRecord, defaultDbState());
      return;
    } catch {
      sqliteAvailable = false;
    }
  }
  return updateDemoUser((user) => {
    user.recommendationRecords.unshift({
      ...stampedRecord
    });
    user.recommendationRecords = user.recommendationRecords.slice(0, 30);
  });
}

export async function recordListeningEvent(event) {
  const stampedEvent = {
    ...event,
    playedAt: event.playedAt || new Date().toISOString()
  };
  if (sqliteAvailable) {
    try {
      return await runSqliteCommand("insertListening", stampedEvent, defaultDbState());
    } catch {
      sqliteAvailable = false;
    }
  }
  return updateDemoUser((user) => {
    user.listeningHistory.unshift({
      ...stampedEvent
    });
    user.listeningHistory = user.listeningHistory.slice(0, 100);
    return user.listeningHistory[0];
  });
}

export async function equipPetItem(kind, id) {
  if (sqliteAvailable) {
    try {
      const user = await runSqliteCommand("equip", { kind, id }, defaultDbState());
      const item = kind === "action" ? user.inventory.actions[id] : user.inventory.outfits[id];
      return { kind, id, item, pet: user.pet };
    } catch (error) {
      if (error.message.includes("Item is locked or missing")) throw error;
      sqliteAvailable = false;
    }
  }
  return updateDemoUser((user) => {
    const collection = kind === "action" ? user.inventory.actions : user.inventory.outfits;
    const item = collection[id];
    if (!item || !item.unlocked) {
      throw new Error("Item is locked or missing");
    }
    if (kind === "action") user.pet.equippedAction = id;
    else user.pet.equippedOutfit = id;
    return { kind, id, item, pet: user.pet };
  });
}

export async function updatePetProgress(pet, unlock = []) {
  if (sqliteAvailable) {
    try {
      return await runSqliteCommand("updatePet", { pet, unlock }, defaultDbState());
    } catch {
      sqliteAvailable = false;
    }
  }
  return updateDemoUser((user) => {
    user.pet = {
      ...user.pet,
      ...pet
    };
    for (const [kind, id] of unlock) {
      const collection = kind === "action" ? user.inventory.actions : user.inventory.outfits;
      if (collection[id]) collection[id].unlocked = true;
    }
    return user;
  });
}

export async function listStoredSongs() {
  if (sqliteAvailable) {
    try {
      return await runSqliteCommand("listSongs", {}, defaultDbState());
    } catch {
      sqliteAvailable = false;
    }
  }
  return songCatalog;
}

async function persistDb() {
  try {
    await mkdir(dirname(dbPath), { recursive: true });
    await writeFile(dbPath, JSON.stringify(cache, null, 2), "utf8");
  } catch {
    // Keep the in-memory cache usable in restricted preview environments.
  }
}
