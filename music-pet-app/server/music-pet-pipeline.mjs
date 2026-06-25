import { analyzeMoment, analyzeWithKimi } from "./vision-analyzer.mjs";
import { buildMusicIntent, recallAndRankSongs } from "./recommendation-engine.mjs";
import { planPetGrowth } from "./pet-growth-agent.mjs";
import { normalizeRecommendationInput } from "./input-normalizer.mjs";
import { searchMusicCatalog } from "./music-provider.mjs";
import { enrichWithPersona } from "./persona-agent.mjs";
import { getDemoUser, persistRecommendation, recordListeningEvent, updatePetProgress } from "./data-store.mjs";
import { buildUserPreferenceProfile, getTimeTags } from "./user-profile.mjs";

export async function createMusicPetRecommendation(input = {}) {
  const normalizedInput = normalizeRecommendationInput(input);
  const user = await getDemoUser();
  const recentSongs = user.listeningHistory.slice(0, 12).map((item) => item.title);
  normalizedInput.recentSongs = normalizedInput.recentSongs.length
    ? normalizedInput.recentSongs
    : recentSongs;
  normalizedInput.petState = normalizedInput.petState || user.pet;
  const baseMoment = await analyzeMoment(normalizedInput);
  const kimiMoment = await maybeAnalyzeWithKimi(normalizedInput, baseMoment);
  const moment = {
    ...baseMoment,
    ...kimiMoment,
    provider: kimiMoment ? "kimi-vision" : baseMoment.provider
  };
  const intent = buildMusicIntent(moment, normalizedInput);
  const providerResult = await searchMusicCatalog(intent, user);
  const userPreference = buildUserPreferenceProfile(user, providerResult.songs);
  const timePreference = getTimeTags(new Date(), user.profile);
  normalizedInput.userPreference = userPreference;
  normalizedInput.timeTags = timePreference.tags;
  const fusedIntent = buildMusicIntent(moment, normalizedInput);
  const songs = recallAndRankSongs(fusedIntent, normalizedInput, providerResult.songs);
  const pet = planPetGrowth({
    moment,
    intent: fusedIntent,
    songs,
    petState: normalizedInput.petState
  });
  const persona = await enrichWithPersona({ moment, intent: fusedIntent, songs, pet });
  pet.reply = persona.petReply || pet.reply;
  pet.personalityTone = persona.personalityTone;
  pet.growthExplanation = persona.growthExplanation;
  fusedIntent.reason = persona.recommendationReason || fusedIntent.reason;
  await applyGrowthAndUnlocks(pet, songs[0], moment.sceneId);

  const result = {
    traceId: `mp-${Date.now().toString(36)}`,
    pipeline: [
      "VisionAnalyzer",
      "AIMusicIntent",
      "CandidateRecall",
      "AIReranker",
      "PersonaAgent",
      "PetGrowthAgent"
    ],
    moment,
    intent: fusedIntent,
    userProfile: {
      likedTags: userPreference.likedTags.slice(0, 6),
      dislikedTags: userPreference.dislikedTags.slice(0, 4),
      favoriteArtists: userPreference.favoriteArtists.slice(0, 4),
      timeBucket: timePreference.bucket,
      timeTags: timePreference.tags,
      historySize: userPreference.historySize
    },
    songs,
    pet,
    musicProvider: providerResult.source,
    personaProvider: persona.provider,
    frontendMode: pet.mode,
    imageName: normalizedInput.imageName || ""
  };
  await persistRecommendation({
    traceId: result.traceId,
    sceneId: moment.sceneId,
    frontendMode: result.frontendMode,
    topSongId: songs[0]?.id,
    petMood: pet.mood
  });
  return result;
}

async function applyGrowthAndUnlocks(pet, topSong, sceneId) {
  await updatePetProgress({
    energy: pet.energy,
    intimacy: pet.intimacy,
    growth: pet.growth,
    shards: pet.shards,
    mood: pet.mood
  }, unlockByPetState(pet, topSong));

  if (topSong) {
    await recordListeningEvent({
      songId: topSong.id,
      title: topSong.title,
      artist: topSong.artist,
      action: "recommend",
      sceneId
    });
  }
}

function unlockByPetState(pet, topSong) {
  const unlock = [];
  if (pet.mode === "energy" || topSong?.energy >= 80) {
    unlock.push(["outfit", "rimian"], ["action", "spin"]);
  }
  if (pet.intimacy >= 50) {
    unlock.push(["outfit", "huaxin"]);
  }
  if (pet.mode === "focus") {
    unlock.push(["outfit", "xingye"]);
  }
  return unlock;
}

async function maybeAnalyzeWithKimi(input, fallbackMoment) {
  const kimiConfig = getKimiConfig();
  if (!input.imageData || !kimiConfig.apiKey) return null;

  const prompt = [
    "请识别用户照片的场景、情绪和适合的音乐推荐标签。",
    "返回字段：sceneLabel, emotion, tags, avoidTags, bpmRange, visualSignals。",
    `用户最近听歌：${(input.recentSongs || []).join("、") || "未知"}`,
    `默认场景参考：${fallbackMoment.sceneLabel}`
  ].join("\n");

  try {
    return await analyzeWithKimi({
      imageData: input.imageData,
      prompt,
      ...kimiConfig
    });
  } catch (error) {
    return {
      modelError: error.message
    };
  }
}

function getKimiConfig() {
  return {
    apiKey: process.env.KIMI_API_KEY,
    baseUrl: process.env.KIMI_BASE_URL || "https://api.moonshot.cn",
    model: process.env.KIMI_VISION_MODEL || "kimi-k2.6"
  };
}
