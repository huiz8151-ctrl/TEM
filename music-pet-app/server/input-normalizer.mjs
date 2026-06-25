const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

export function normalizeRecommendationInput(input = {}) {
  const imageData = typeof input.imageData === "string" ? input.imageData : "";
  const imageMatch = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);

  if (imageData && !imageMatch) {
    throw new Error("imageData must be a base64 data URL");
  }

  if (imageMatch && !allowedImageTypes.has(imageMatch[1])) {
    throw new Error(`Unsupported image type: ${imageMatch[1]}`);
  }

  const imageBytes = imageMatch ? Math.ceil(imageMatch[2].length * 0.75) : 0;
  if (imageBytes > 4_000_000) {
    throw new Error("Image is too large; please keep it under 4 MB");
  }

  return {
    ...input,
    mode: safeText(input.mode, 32) || "commute",
    sceneId: safeText(input.sceneId, 32) || safeText(input.mode, 32) || "commute",
    photoHint: safeText(input.photoHint, 32),
    imageData,
    imageName: safeText(input.imageName, 120),
    recentSongs: Array.isArray(input.recentSongs)
      ? input.recentSongs.map((item) => safeText(item, 80)).filter(Boolean).slice(0, 20)
      : [],
    petState: normalizePetState(input.petState)
  };
}

function safeText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePetState(value = {}) {
  return {
    energy: boundedNumber(value.energy, 0, 100, 68),
    intimacy: boundedNumber(value.intimacy, 0, 100, 42),
    growth: boundedNumber(value.growth, 0, 10000, 340),
    shards: boundedNumber(value.shards, 0, 999, 6)
  };
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
