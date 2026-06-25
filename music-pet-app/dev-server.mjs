import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { loadLocalEnv } from "./server/env-loader.mjs";
import { createMusicPetRecommendation } from "./server/music-pet-pipeline.mjs";
import { equipPetItem, getDemoUser, recordListeningEvent } from "./server/data-store.mjs";
import { songCatalog } from "./server/music-catalog.mjs";
import { buildUserPreferenceProfile, getTimeTags } from "./server/user-profile.mjs";
import { listStoredSongs } from "./server/data-store.mjs";
import { analyzeVideoRhythm } from "./server/video-rhythm-analyzer.mjs";
import { createPetChatReply } from "./server/pet-chat-agent.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8_000_000) {
      throw new Error("Request body is too large");
    }
  }
  return body ? JSON.parse(body) : {};
}

async function handleApi(request, response, rawPath) {
  if (request.method === "GET" && rawPath === "/api/music-pet/audio-preview") {
    try {
      await proxyAudioPreview(request, response);
    } catch (error) {
      sendJson(response, 400, { error: "audio_preview_failed", message: error.message });
    }
    return true;
  }

  if (request.method === "GET" && rawPath === "/api/health") {
    sendJson(response, 200, { ok: true, service: "music-pet-app" });
    return true;
  }

  if (request.method === "POST" && rawPath === "/api/music-pet/recommendation") {
    try {
      const input = await readJsonBody(request);
      const result = await createMusicPetRecommendation(input);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        error: "recommendation_failed",
        message: error.message
      });
    }
    return true;
  }

  if (request.method === "POST" && rawPath === "/api/music-pet/video-rhythm") {
    try {
      const input = await readJsonBody(request);
      const result = analyzeVideoRhythm(input);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, {
        error: "video_rhythm_failed",
        message: error.message
      });
    }
    return true;
  }

  if (request.method === "POST" && rawPath === "/api/music-pet/chat") {
    try {
      const input = await readJsonBody(request);
      const user = await getDemoUser();
      const storedSongs = await listStoredSongs();
      const userProfile = buildUserPreferenceProfile(user, storedSongs);
      const result = await createPetChatReply({
        message: input.message,
        song: input.song,
        mode: input.mode,
        pet: user.pet,
        userProfile: {
          likedTags: userProfile.likedTags.slice(0, 8),
          dislikedTags: userProfile.dislikedTags.slice(0, 5),
          favoriteArtists: userProfile.favoriteArtists.slice(0, 5),
          historySize: userProfile.historySize
        },
        recentMessages: input.recentMessages
      });
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: "chat_failed", message: error.message });
    }
    return true;
  }

  if (request.method === "GET" && rawPath === "/api/music-pet/state") {
    const user = await getDemoUser();
    const storedSongs = await listStoredSongs();
    const userProfile = buildUserPreferenceProfile(user, storedSongs);
    const timePreference = getTimeTags(new Date(), user.profile);
    sendJson(response, 200, {
      userId: user.id,
      pet: user.pet,
      profile: user.profile,
      userProfile: {
        likedTags: userProfile.likedTags.slice(0, 8),
        dislikedTags: userProfile.dislikedTags.slice(0, 5),
        favoriteArtists: userProfile.favoriteArtists.slice(0, 5),
        timeBucket: timePreference.bucket,
        timeTags: timePreference.tags,
        historySize: userProfile.historySize
      },
      musicLibrary: {
        count: storedSongs.length,
        source: storedSongs === songCatalog ? "local-js-catalog" : "sqlite-catalog"
      },
      inventory: user.inventory,
      listeningHistory: user.listeningHistory.slice(0, 20),
      recommendationRecords: user.recommendationRecords.slice(0, 10)
    });
    return true;
  }

  if (request.method === "POST" && rawPath === "/api/music-pet/listening-events") {
    try {
      const input = await readJsonBody(request);
      const event = await recordListeningEvent({
        songId: String(input.songId || ""),
        title: String(input.title || ""),
        artist: String(input.artist || ""),
        action: String(input.action || "listen"),
        sceneId: String(input.sceneId || "")
      });
      sendJson(response, 200, { ok: true, event });
    } catch (error) {
      sendJson(response, 400, { error: "listening_event_failed", message: error.message });
    }
    return true;
  }

  if (request.method === "POST" && rawPath === "/api/music-pet/equip") {
    try {
      const input = await readJsonBody(request);
      const result = await equipPetItem(String(input.kind || ""), String(input.id || ""));
      sendJson(response, 200, { ok: true, ...result });
    } catch (error) {
      sendJson(response, 400, { error: "equip_failed", message: error.message });
    }
    return true;
  }

  if (rawPath.startsWith("/api/")) {
    sendJson(response, 404, { error: "not_found" });
    return true;
  }

  return false;
}

async function proxyAudioPreview(request, response) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const target = new URL(url.searchParams.get("url") || "");
  if (!isAllowedAudioHost(target.hostname)) {
    throw new Error("Audio host is not allowed");
  }

  const upstream = await fetch(target, {
    headers: request.headers.range ? { Range: request.headers.range } : {}
  });
  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`Audio upstream failed: ${upstream.status}`);
  }

  const headers = {
    "Content-Type": upstream.headers.get("content-type") || "audio/mp4",
    "Accept-Ranges": upstream.headers.get("accept-ranges") || "bytes",
    "Cache-Control": "public, max-age=3600"
  };
  if (upstream.headers.get("content-length")) headers["Content-Length"] = upstream.headers.get("content-length");
  if (upstream.headers.get("content-range")) headers["Content-Range"] = upstream.headers.get("content-range");
  response.writeHead(upstream.status, headers);
  Readable.fromWeb(upstream.body).pipe(response);
}

function isAllowedAudioHost(hostname) {
  return hostname === "audio-ssl.itunes.apple.com"
    || (/^cdn[st]-preview/i.test(hostname) && hostname.endsWith(".dzcdn.net"));
}

const server = createServer(async (request, response) => {
  const rawPath = decodeURIComponent((request.url || "/").split("?")[0]);

  if (await handleApi(request, response, rawPath)) {
    return;
  }

  const safePath = rawPath === "/" ? "/index.html" : rawPath;
  const filePath = resolve(root, `.${safePath}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await loadLocalEnv();

server.listen(port, "127.0.0.1", () => {
  console.log(`music-pet-app listening on http://127.0.0.1:${port}`);
});
