import { songCatalog } from "./music-catalog.mjs";
import { listStoredSongs } from "./data-store.mjs";

export async function searchMusicCatalog(intent, user = {}) {
  if (process.env.MUSIC_PROVIDER_URL) {
    const remote = await tryRemoteProvider(intent, user);
    if (remote?.length) {
      return {
        source: "remote-provider",
        songs: remote
      };
    }
  }

  if (process.env.MUSIC_LIVE_PROVIDER !== "off") {
    const live = await tryPublicMusicProvider(intent, user);
    if (live?.length) {
      return {
        source: "public-preview-fusion",
        songs: live
      };
    }
  }

  const storedSongs = await listStoredSongs();
  return {
    source: storedSongs === songCatalog ? "local-js-catalog" : "sqlite-catalog",
    songs: storedSongs
  };
}

async function tryRemoteProvider(intent, user) {
  try {
    const response = await fetch(process.env.MUSIC_PROVIDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MUSIC_PROVIDER_TOKEN
          ? { Authorization: `Bearer ${process.env.MUSIC_PROVIDER_TOKEN}` }
          : {})
      },
      body: JSON.stringify({
        intent,
        userId: user.id || "demo",
        limit: 50
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data.songs) ? data.songs.map(normalizeSong).filter(Boolean) : null;
  } catch {
    return null;
  }
}

function normalizeSong(song) {
  if (!song?.id || !song?.title) return null;
  return {
    id: String(song.id),
    title: String(song.title),
    artist: String(song.artist || "Unknown Artist"),
    album: String(song.album || ""),
    bpm: Number(song.bpm || 90),
    energy: Number(song.energy || 50),
    valence: Number(song.valence || 50),
    tags: Array.isArray(song.tags) ? song.tags.map(String) : [],
    scenes: Array.isArray(song.scenes) ? song.scenes.map(String) : [],
    moods: Array.isArray(song.moods) ? song.moods.map(String) : [],
    coverUrl: String(song.coverUrl || ""),
    previewUrl: String(song.previewUrl || ""),
    sourcePreviewUrl: String(song.sourcePreviewUrl || song.previewUrl || ""),
    externalUrl: String(song.externalUrl || ""),
    platform: String(song.platform || "remote"),
    platformSongId: String(song.platformSongId || song.id),
    copyright: String(song.copyright || "unknown")
  };
}

async function tryPublicMusicProvider(intent, user) {
  const queries = buildLiveQueries(intent, user);
  const itunesSongs = await searchItunes(queries, intent);
  const deezerSongs = await searchDeezer(queries, intent);
  return rankProviderSongs([...itunesSongs, ...deezerSongs], intent);
}

function buildLiveQueries(intent, user) {
  const artistNames = [
    ...(intent.userSignals?.favoriteArtists || []),
    ...(user.profile?.favoriteArtists || [])
  ];
  const tagTerms = (intent.musicTags || [])
    .filter((tag) => !/低干扰|陪伴|轻快|治愈|通勤|专注|提神|夜晚/.test(tag))
    .slice(0, 3);
  const fallbackTerms = ["Jay Chou", "lofi", "city pop", "healing music"];
  return [...new Set([...artistNames, ...tagTerms, ...fallbackTerms])]
    .filter(Boolean)
    .slice(0, 5);
}

async function searchItunes(queries, intent) {
  const songs = [];
  const countries = (process.env.ITUNES_COUNTRIES || process.env.ITUNES_COUNTRY || "CN,HK,TW,US,JP")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean);

  for (const query of queries) {
    for (const country of countries) {
      const url = new URL("https://itunes.apple.com/search");
      url.searchParams.set("term", query);
      url.searchParams.set("country", country);
      url.searchParams.set("media", "music");
      url.searchParams.set("entity", "song");
      url.searchParams.set("limit", "8");
      const data = await fetchJson(url, 2500);
      for (const item of data?.results || []) {
        songs.push(normalizeItunesSong(item, intent, country));
      }
      if (songs.length >= 40) break;
    }
    if (songs.length >= 40) break;
  }
  return uniqueSongs(songs).slice(0, 50);
}

async function searchDeezer(queries, intent) {
  const songs = [];
  for (const query of queries) {
    const url = new URL("https://api.deezer.com/search");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "8");
    const data = await fetchJson(url, 2500);
    for (const item of data?.data || []) {
      songs.push(normalizeDeezerSong(item, intent));
    }
    if (songs.length >= 30) break;
  }
  return uniqueSongs(songs).slice(0, 50);
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeItunesSong(item, intent, country = "") {
  if (!item?.trackId || !item?.trackName) return null;
  return normalizeSong({
    id: `itunes-${item.trackId}`,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    bpm: estimateBpm(intent),
    energy: estimateEnergy(intent),
    valence: estimateValence(intent),
    tags: buildProviderTags(intent),
    scenes: [],
    moods: buildProviderTags(intent).slice(0, 3),
    coverUrl: upgradeArtwork(item.artworkUrl100),
    previewUrl: proxyPreviewUrl(item.previewUrl),
    sourcePreviewUrl: item.previewUrl,
    platform: "itunes",
    platformSongId: item.trackId,
    copyright: item.previewUrl ? `itunes-preview-${country}` : `itunes-metadata-${country}`,
    externalUrl: item.trackViewUrl
  });
}

function normalizeDeezerSong(item, intent) {
  if (!item?.id || !item?.title) return null;
  return normalizeSong({
    id: `deezer-${item.id}`,
    title: item.title_short || item.title,
    artist: item.artist?.name,
    album: item.album?.title,
    bpm: estimateBpm(intent),
    energy: estimateEnergy(intent),
    valence: estimateValence(intent),
    tags: buildProviderTags(intent),
    scenes: [],
    moods: buildProviderTags(intent).slice(0, 3),
    coverUrl: item.album?.cover_medium || item.album?.cover,
    previewUrl: proxyPreviewUrl(item.preview),
    sourcePreviewUrl: item.preview,
    platform: "deezer",
    platformSongId: item.id,
    copyright: "deezer-preview",
    externalUrl: item.link
  });
}

function uniqueSongs(songs) {
  const seen = new Set();
  return songs.filter((song) => {
    if (!song) return false;
    const key = `${song.platform}:${String(song.title).toLowerCase()}:${String(song.artist).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rankProviderSongs(songs, intent) {
  const unique = uniqueSongs(songs);
  const previewable = unique.filter((song) => song.previewUrl);
  const pool = previewable.length >= 4 ? previewable : unique;
  return pool
    .map((song) => ({
      ...song,
      providerRank: providerRankScore(song, intent)
    }))
    .sort((a, b) => b.providerRank - a.providerRank)
    .slice(0, 50);
}

function providerRankScore(song, intent) {
  const previewScore = song.previewUrl ? 100 : -40;
  const deezerScore = song.platform === "deezer" ? 8 : 0;
  const artistScore = (intent.userSignals?.favoriteArtists || [])
    .some((artist) => String(song.artist).toLowerCase().includes(String(artist).toLowerCase()))
    ? 18
    : 0;
  const tagScore = overlap(buildProviderTags(intent), song.tags) * 4;
  return previewScore + deezerScore + artistScore + tagScore;
}

function overlap(left = [], right = []) {
  const set = new Set(left);
  return right.reduce((count, item) => count + (set.has(item) ? 1 : 0), 0);
}

function buildProviderTags(intent) {
  return [...new Set(intent.musicTags || [])].slice(0, 8);
}

function estimateBpm(intent) {
  const range = intent.bpmRange || [72, 104];
  return Math.round((Number(range[0]) + Number(range[1])) / 2) || 90;
}

function estimateEnergy(intent) {
  const tags = intent.musicTags || [];
  if (tags.some((tag) => /高能|运动|提神|律动/.test(tag))) return 82;
  if (tags.some((tag) => /治愈|低干扰|睡前|放空/.test(tag))) return 42;
  return 58;
}

function estimateValence(intent) {
  const tags = intent.musicTags || [];
  if (tags.some((tag) => /轻快|明亮|元气/.test(tag))) return 72;
  if (tags.some((tag) => /雨天|孤独|疲惫/.test(tag))) return 48;
  return 60;
}

function upgradeArtwork(url = "") {
  return String(url).replace(/100x100bb\.(jpg|png)$/i, "300x300bb.$1");
}

function proxyPreviewUrl(url = "") {
  return url ? `/api/music-pet/audio-preview?url=${encodeURIComponent(url)}` : "";
}
