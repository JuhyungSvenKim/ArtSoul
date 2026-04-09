/**
 * 125 Case Code AI Image Prompts
 *
 * DALL-E / Midjourney / Stable Diffusion용 프롬프트
 * 각 케이스코드의 오행(색상) × 에너지(구도) × 스타일(표현)을 반영
 */

import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";
import { buildCaseCode } from "@/lib/case-code/types";

// 오행별 색상/소재/분위기
const ELEMENT_PROMPTS: Record<OhaengElement, { colors: string; subjects: string; mood: string }> = {
  W: {
    colors: "emerald green, forest green, jade, moss tones",
    subjects: "bamboo forest, spring trees, flowing vines, green mountains",
    mood: "growth, vitality, renewal, upward energy",
  },
  F: {
    colors: "crimson red, orange, warm magenta, ember glow",
    subjects: "sunset sky, flames, blooming flowers, volcanic landscape",
    mood: "passion, warmth, radiance, creative fire",
  },
  E: {
    colors: "ochre, terracotta, warm brown, golden wheat",
    subjects: "autumn fields, pottery, ancient village, rolling hills",
    mood: "stability, nurture, grounding, harvest abundance",
  },
  M: {
    colors: "silver, cool grey, platinum, moonlight white",
    subjects: "moonlit lake, winter frost, metallic textures, crystal formations",
    mood: "precision, clarity, refinement, quiet strength",
  },
  A: {
    colors: "deep blue, navy, cerulean, midnight indigo",
    subjects: "ocean waves, misty rain, flowing river, deep lake reflection",
    mood: "wisdom, depth, fluidity, mysterious calm",
  },
};

// 에너지별 구도/밀도
const ENERGY_PROMPTS: Record<EnergyLevel, string> = {
  1: "extremely minimal composition, vast negative space, single focal point, meditative emptiness, zen-like simplicity",
  2: "balanced symmetrical layout, harmonious proportions, calm orderly arrangement, golden ratio composition",
  3: "dynamic diagonal composition, bold movement, energetic brushstrokes, strong contrast, expansive scale",
  4: "flowing organic curves, interconnected forms, rhythmic patterns, gentle transitions, emotional fluidity",
  5: "dense intricate details, rich layered textures, complex patterns, concentrated energy, maximal composition",
};

// 스타일별 표현
const STYLE_PROMPTS: Record<StyleCode, { technique: string; reference: string }> = {
  S1: {
    technique: "classical oil painting technique, academic realism, careful chiaroscuro, Renaissance mastery",
    reference: "in the style of Vermeer, Rembrandt, or classical European masters, museum-quality fine art",
  },
  S2: {
    technique: "traditional East Asian ink wash painting, sumi-e brushwork, calligraphic strokes, rice paper texture",
    reference: "in the style of traditional Korean sumukhwa or Chinese shan shui, contemplative oriental art",
  },
  S3: {
    technique: "modern minimalist art, clean geometric forms, contemporary design, white space emphasis",
    reference: "in the style of Mondrian, Agnes Martin, or Scandinavian modern art, gallery-ready contemporary piece",
  },
  S4: {
    technique: "bold pop art colors, graphic design influence, screen print aesthetic, street art energy",
    reference: "in the style of Warhol, Basquiat, or Kaws, vibrant contemporary urban art",
  },
  S5: {
    technique: "mixed media luxury art, gold leaf accents, premium textures, collector-grade craftsmanship",
    reference: "in the style of Klimt, Anish Kapoor, or Damien Hirst, exclusive gallery exhibition piece",
  },
};

export interface ArtPrompt {
  caseCode: string;
  element: OhaengElement;
  energy: EnergyLevel;
  style: StyleCode;
  prompt: string;
  negativePrompt: string;
}

function generatePrompt(el: OhaengElement, en: EnergyLevel, st: StyleCode): string {
  const e = ELEMENT_PROMPTS[el];
  const energy = ENERGY_PROMPTS[en];
  const style = STYLE_PROMPTS[st];

  return `A beautiful fine art painting. ${style.technique}. ${energy}. Color palette: ${e.colors}. Subject matter: ${e.subjects}. Mood: ${e.mood}. ${style.reference}. High resolution, 4K, masterpiece quality, suitable for luxury interior display.`;
}

const NEGATIVE_PROMPT = "text, watermark, signature, frame, border, low quality, blurry, distorted, ugly, deformed, disfigured, bad anatomy, extra limbs, cartoon, anime, 3D render, photo, photograph";

/**
 * 125개 AI 이미지 생성 프롬프트
 */
export function generateAllPrompts(): ArtPrompt[] {
  const elements: OhaengElement[] = ["W", "F", "E", "M", "A"];
  const energies: EnergyLevel[] = [1, 2, 3, 4, 5];
  const styles: StyleCode[] = ["S1", "S2", "S3", "S4", "S5"];
  const prompts: ArtPrompt[] = [];

  for (const el of elements) {
    for (const en of energies) {
      for (const st of styles) {
        prompts.push({
          caseCode: buildCaseCode(el, en, st),
          element: el,
          energy: en,
          style: st,
          prompt: generatePrompt(el, en, st),
          negativePrompt: NEGATIVE_PROMPT,
        });
      }
    }
  }

  return prompts;
}

/**
 * 특정 케이스코드의 프롬프트 가져오기
 */
export function getPrompt(el: OhaengElement, en: EnergyLevel, st: StyleCode): ArtPrompt {
  return {
    caseCode: buildCaseCode(el, en, st),
    element: el,
    energy: en,
    style: st,
    prompt: generatePrompt(el, en, st),
    negativePrompt: NEGATIVE_PROMPT,
  };
}
