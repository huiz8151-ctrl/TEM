const petByMode = {
  commute: {
    mode: "commute",
    mood: "轻快陪伴",
    outfit: "星屿耳机",
    outfitImg: "lan2 2.png",
    action: "点头晃晃",
    petImg: "act2.png",
    rhythm: "steady"
  },
  heal: {
    mode: "heal",
    mood: "安静治愈",
    outfit: "月庭耳机",
    outfitImg: "绿色 2.png",
    action: "安静听歌",
    petImg: "act8.png",
    rhythm: "soft"
  },
  focus: {
    mode: "focus",
    mood: "稳定专注",
    outfit: "虹翼耳机",
    outfitImg: "4 2.png",
    action: "偷偷看你",
    petImg: "act9.png",
    rhythm: "focus"
  },
  energy: {
    mode: "energy",
    mood: "元气释放",
    outfit: "日冕耳机",
    outfitImg: "黄色 2.png",
    action: "开心转圈",
    petImg: "act5.png",
    rhythm: "bounce"
  }
};

function chooseMode(moment, songs) {
  if (moment.tags.includes("运动") || songs[0]?.bpm >= 112) return "energy";
  if (moment.tags.includes("治愈") || moment.tags.includes("雨天")) return "heal";
  if (moment.tags.includes("专注") || moment.tags.includes("低干扰")) return "focus";
  return "commute";
}

export function planPetGrowth({ moment, intent, songs, petState = {} }) {
  const mode = chooseMode(moment, songs);
  const base = petByMode[mode];
  const topSong = songs[0];
  const energyDelta = mode === "energy" ? 10 : mode === "heal" ? -4 : 4;
  const intimacyDelta = mode === "heal" ? 8 : 5;
  const growthDelta = Math.max(12, Math.round((topSong?.score || 50) / 4));

  return {
    ...base,
    rhythmProfile: {
      bpm: topSong?.bpm || 90,
      speed: Number((60 / Math.max(60, topSong?.bpm || 90)).toFixed(2)),
      lift: Math.round(4 + (topSong?.energy || 50) / 12),
      strength: topSong?.energy || 50
    },
    energy: Math.max(0, Math.min(100, Number(petState.energy ?? 62) + energyDelta)),
    intimacy: Math.max(0, Math.min(100, Number(petState.intimacy ?? 42) + intimacyDelta)),
    growth: Number(petState.growth ?? 320) + growthDelta,
    shards: Number(petState.shards ?? 6) + (topSong?.score > 70 ? 2 : 1),
    reply: `${moment.sceneLabel}适合听「${topSong?.title || "这首歌"}」。我会用「${base.action}」陪你，把${intent.musicTags.slice(0, 2).join("、")}的状态留住。`,
    unlock: mode === "energy"
      ? "完成一次高能听歌，解锁「元气满满」动作预览"
      : mode === "heal"
        ? "治愈值继续提升，可解锁「花信」温柔装扮"
        : mode === "focus"
          ? "连续专注 20 分钟，获得「星夜」碎片 +1"
          : "再听 2 首通勤歌单，解锁「云汐」配色"
  };
}
