export function buildUserPreferenceProfile(user = {}, catalog = []) {
  const songById = new Map(catalog.map((song) => [song.id, song]));
  const tagScores = new Map();
  const artistScores = new Map();
  const sceneScores = new Map(Object.entries(user.profile?.sceneAffinity || {}));
  const actionWeights = {
    favorite: 4,
    share: 3,
    listen: 2,
    recommend: 1,
    skip: -3
  };

  for (const event of user.listeningHistory || []) {
    const song = songById.get(event.songId);
    const weight = actionWeights[event.action] ?? 1;
    if (event.artist) addScore(artistScores, event.artist, weight);
    if (event.sceneId) addScore(sceneScores, event.sceneId, weight / 10);
    if (!song) continue;
    for (const tag of song.tags || []) addScore(tagScores, tag, weight);
    for (const mood of song.moods || []) addScore(tagScores, mood, weight / 2);
  }

  for (const tag of user.profile?.favoriteTags || []) addScore(tagScores, tag, 3);
  for (const tag of user.profile?.dislikedTags || []) addScore(tagScores, tag, -4);
  for (const artist of user.profile?.favoriteArtists || []) addScore(artistScores, artist, 3);

  const likedTags = topEntries(tagScores, (score) => score > 0, 10);
  const dislikedTags = topEntries(tagScores, (score) => score < 0, 8).map((item) => item.key);
  const favoriteArtists = topEntries(artistScores, (score) => score > 0, 6).map((item) => item.key);

  return {
    likedTags: likedTags.map((item) => item.key),
    dislikedTags,
    favoriteArtists,
    sceneAffinity: Object.fromEntries(sceneScores),
    tagScores: Object.fromEntries(tagScores),
    artistScores: Object.fromEntries(artistScores),
    historySize: user.listeningHistory?.length || 0
  };
}

export function getTimeTags(date = new Date(), profile = {}) {
  const hour = date.getHours();
  const bucket = hour < 11 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night";
  return {
    bucket,
    tags: profile.timePreference?.[bucket] || []
  };
}

function addScore(map, key, delta) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + delta);
}

function topEntries(map, predicate, limit) {
  return [...map.entries()]
    .filter(([, score]) => predicate(score))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, limit)
    .map(([key, score]) => ({ key, score }));
}
