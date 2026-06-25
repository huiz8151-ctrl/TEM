const rhythmPresets = {
  soft: {
    label: "soft-sway",
    frontendMode: "heal",
    actionId: "listen",
    petImg: "act8.png",
    tags: ["治愈", "低噪", "慢律动", "陪伴"]
  },
  steady: {
    label: "steady-nod",
    frontendMode: "commute",
    actionId: "nod",
    petImg: "act2.png",
    tags: ["通勤", "轻快", "稳定节拍", "人声"]
  },
  focus: {
    label: "focus-pulse",
    frontendMode: "focus",
    actionId: "peek",
    petImg: "act9.png",
    tags: ["专注", "低干扰", "Lo-fi", "克制律动"]
  },
  bounce: {
    label: "bounce",
    frontendMode: "energy",
    actionId: "spin",
    petImg: "act5.png",
    tags: ["高能", "运动", "律动", "提神"]
  },
  cheer: {
    label: "cheer-hop",
    frontendMode: "energy",
    actionId: "cheer",
    petImg: "act10.png",
    tags: ["元气", "强节拍", "派对感", "释放"]
  }
};

export function analyzeVideoRhythm(input = {}) {
  const durationSec = clamp(Number(input.durationSec || input.duration || 15), 1, 180);
  const motionSeries = normalizeSeries(input.motionSeries || input.motion || []);
  const audioSeries = normalizeSeries(input.audioEnergySeries || input.audioSeries || input.rmsSeries || []);
  const brightnessSeries = normalizeSeries(input.brightnessSeries || []);
  const sourceSeries = audioSeries.length ? audioSeries : motionSeries;
  const sampleRate = Number(input.sampleRate || input.samplesPerSecond || estimateSampleRate(sourceSeries.length, durationSec));

  const peaks = detectPeaks(sourceSeries, sampleRate);
  const bpm = estimateBpmFromPeaks(peaks, durationSec) || estimateBpmFromMotion(motionSeries, durationSec);
  const motionEnergy = average(motionSeries);
  const audioEnergy = average(audioSeries);
  const brightness = average(brightnessSeries);
  const energy = clamp(audioEnergy * 0.62 + motionEnergy * 0.38 || motionEnergy || audioEnergy, 0, 1);
  const regularity = estimateRegularity(peaks);
  const rhythmKey = chooseRhythm({ bpm, energy, motionEnergy, audioEnergy, regularity, brightness });
  const preset = rhythmPresets[rhythmKey];

  return {
    provider: "video-rhythm-analyzer",
    rhythmType: preset.label,
    frontendMode: preset.frontendMode,
    actionId: preset.actionId,
    petImg: preset.petImg,
    bpm,
    confidence: confidenceScore({ peaks, durationSec, energy, regularity, sourceSeries }),
    features: {
      durationSec,
      sampleRate,
      peakCount: peaks.length,
      motionEnergy: round(motionEnergy, 3),
      audioEnergy: round(audioEnergy, 3),
      brightness: round(brightness, 3),
      regularity: round(regularity, 3)
    },
    rhythmProfile: {
      speed: round(60 / bpm, 2),
      lift: Math.round(4 + energy * 12),
      sway: Math.round(2 + motionEnergy * 10),
      intensity: round(energy, 2)
    },
    musicIntent: {
      musicTags: preset.tags,
      bpmRange: [Math.max(55, bpm - 12), Math.min(180, bpm + 12)],
      reason: buildReason(preset.label, bpm, energy, regularity)
    },
    petDirective: {
      action: preset.actionId,
      animation: preset.label,
      copy: buildPetCopy(preset.label, bpm, energy)
    }
  };
}

function normalizeSeries(series) {
  if (!Array.isArray(series)) return [];
  const values = series
    .map((value) => Number(typeof value === "object" ? value.value ?? value.energy ?? value.motion : value))
    .filter(Number.isFinite)
    .map((value) => clamp(value, 0, 1));
  if (!values.length) return [];
  const max = Math.max(...values);
  if (max <= 1) return values;
  return values.map((value) => value / max);
}

function detectPeaks(series, sampleRate) {
  if (series.length < 3) return [];
  const mean = average(series);
  const deviation = stddev(series, mean);
  const threshold = Math.min(0.9, Math.max(0.18, mean + deviation * 0.45));
  const minGap = Math.max(1, Math.floor(sampleRate * 0.28));
  const peaks = [];
  let lastPeak = -minGap;

  for (let index = 1; index < series.length - 1; index += 1) {
    const value = series[index];
    const isPeak = value >= threshold && value >= series[index - 1] && value > series[index + 1];
    if (isPeak && index - lastPeak >= minGap) {
      peaks.push(index / sampleRate);
      lastPeak = index;
    }
  }
  return peaks;
}

function estimateBpmFromPeaks(peaks) {
  if (peaks.length < 2) return 0;
  const intervals = [];
  for (let index = 1; index < peaks.length; index += 1) {
    const interval = peaks[index] - peaks[index - 1];
    if (interval >= 0.25 && interval <= 1.4) intervals.push(interval);
  }
  if (!intervals.length) return 0;
  let bpm = Math.round(60 / median(intervals));
  while (bpm < 65) bpm *= 2;
  while (bpm > 180) bpm = Math.round(bpm / 2);
  return clamp(bpm, 55, 180);
}

function estimateBpmFromMotion(series, durationSec) {
  if (!series.length || durationSec <= 0) return 88;
  const crossings = countRisingCrossings(series, average(series));
  const bpm = Math.round((crossings / durationSec) * 60);
  if (!bpm) return 88;
  return clamp(bpm < 60 ? bpm * 2 : bpm, 55, 170);
}

function chooseRhythm({ bpm, energy, motionEnergy, regularity, brightness }) {
  if (bpm >= 128 && energy >= 0.72) return "cheer";
  if (bpm >= 112 && energy >= 0.58) return "bounce";
  if (energy <= 0.36 && bpm <= 86) return "soft";
  if (motionEnergy <= 0.32 && regularity >= 0.55) return "focus";
  if (brightness <= 0.28 && energy <= 0.5) return "soft";
  return "steady";
}

function estimateRegularity(peaks) {
  if (peaks.length < 3) return 0.35;
  const intervals = [];
  for (let index = 1; index < peaks.length; index += 1) intervals.push(peaks[index] - peaks[index - 1]);
  const mean = average(intervals);
  if (!mean) return 0.35;
  return clamp(1 - stddev(intervals, mean) / mean, 0, 1);
}

function confidenceScore({ peaks, durationSec, energy, regularity, sourceSeries }) {
  const coverage = clamp(sourceSeries.length / Math.max(12, durationSec * 6), 0, 1);
  const peakDensity = clamp(peaks.length / Math.max(3, durationSec * 1.2), 0, 1);
  return round(0.25 + coverage * 0.25 + peakDensity * 0.2 + energy * 0.15 + regularity * 0.15, 2);
}

function buildReason(label, bpm, energy, regularity) {
  return `视频律动判断为 ${label}，估计 ${bpm} BPM，能量 ${round(energy, 2)}，节拍稳定度 ${round(regularity, 2)}。`;
}

function buildPetCopy(label, bpm, energy) {
  if (label === "cheer-hop" || label === "bounce") return `节拍很亮，我会按 ${bpm} BPM 跳起来。`;
  if (label === "soft-sway") return "画面和声音都偏柔，我会小幅度陪你慢慢晃。";
  if (label === "focus-pulse") return "律动很克制，我会轻轻点一下，不打扰你。";
  return `这个节奏很稳，我会跟着 ${bpm} BPM 点头。`;
}

function countRisingCrossings(series, threshold) {
  let count = 0;
  for (let index = 1; index < series.length; index += 1) {
    if (series[index - 1] < threshold && series[index] >= threshold) count += 1;
  }
  return count;
}

function estimateSampleRate(length, durationSec) {
  return Math.max(1, Math.round(length / Math.max(1, durationSec)));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values, mean = average(values)) {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
