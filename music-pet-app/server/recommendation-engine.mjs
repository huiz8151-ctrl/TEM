function overlapScore(a = [], b = []) {
  const set = new Set(a);
  return b.reduce((score, item) => score + (set.has(item) ? 1 : 0), 0);
}

function bpmScore(songBpm, [min, max]) {
  if (songBpm >= min && songBpm <= max) return 1;
  const distance = songBpm < min ? min - songBpm : songBpm - max;
  return Math.max(0, 1 - distance / 40);
}

export function buildMusicIntent(moment, input = {}) {
  const recentTitles = input.recentSongs || [];
  const profile = input.userPreference || {};
  const timeTags = input.timeTags || [];
  const preferenceTags = recentTitles.includes("晴天")
    ? ["人声", "怀念", "城市感"]
    : ["低干扰"];

  return {
    intent: `${moment.sceneLabel} · ${moment.emotion}`,
    musicTags: [...new Set([
      ...moment.tags,
      ...preferenceTags,
      ...(profile.likedTags || []).slice(0, 5),
      ...timeTags
    ])],
    avoidTags: [...new Set([...(moment.avoidTags || []), ...(profile.dislikedTags || []).slice(0, 4)])],
    bpmRange: moment.bpmRange,
    userSignals: {
      likedTags: (profile.likedTags || []).slice(0, 5),
      favoriteArtists: (profile.favoriteArtists || []).slice(0, 4),
      historySize: profile.historySize || 0
    },
    reason: `根据${moment.sceneLabel}、${moment.emotion}和你的历史偏好，优先选择 ${moment.tags.join(" / ")} 的音乐。`
  };
}

export function recallAndRankSongs(intent, input = {}, candidateSongs = []) {
  const recent = new Set(input.recentSongs || []);

  return candidateSongs
    .map((song) => {
      const tagScore = overlapScore(intent.musicTags, song.tags) * 18;
      const moodScore = overlapScore(intent.musicTags, song.moods) * 10;
      const tempoScore = bpmScore(song.bpm, intent.bpmRange) * 26;
      const userTagScore = userPreferenceScore(song, input.userPreference?.tagScores) * 4;
      const artistScore = userPreferenceScore({ tags: [song.artist] }, input.userPreference?.artistScores) * 5;
      const sceneAffinity = Number(input.userPreference?.sceneAffinity?.[input.sceneId] || 0) * (song.scenes?.includes(input.sceneId) ? 8 : 0);
      const novelty = recent.has(song.title) ? -8 : 4;
      const avoidPenalty = overlapScore(intent.avoidTags, song.tags) * -16;
      const score = Math.round(tagScore + moodScore + tempoScore + userTagScore + artistScore + sceneAffinity + novelty + avoidPenalty);
      return {
        ...song,
        score,
        matchReason: [
          tagScore > 0 ? "标签贴合" : "",
          userTagScore > 0 ? "符合你的偏好" : "",
          artistScore > 0 ? "常听歌手相近" : "",
          tempoScore > 18 ? "BPM 合适" : "",
          novelty > 0 ? "保留新鲜感" : "延续最近偏好"
        ].filter(Boolean).join(" · ")
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function userPreferenceScore(song, scores = {}) {
  return (song.tags || []).reduce((sum, tag) => sum + Number(scores[tag] || 0), 0);
}
