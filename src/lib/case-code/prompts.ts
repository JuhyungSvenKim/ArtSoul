/**
 * 25 Base Case 이미지 생성 프롬프트
 *
 * 각 Base Case(Element × Energy)별 DALL-E/Midjourney용 프롬프트
 * 4:3 비율, 미술작품 느낌
 */

export interface BaseCasePrompt {
  baseCode: string
  element: string
  energy: number
  titleKor: string
  titleEng: string
  prompt: string
  negativePrompt: string
}

export const BASE_CASE_PROMPTS: BaseCasePrompt[] = [
  // ═══ W (목/Wood) ═══════════════════════════════════════
  {
    baseCode: 'W1',
    element: 'W',
    energy: 1,
    titleKor: '목 × 여백 — 고요한 숲의 새벽',
    titleEng: 'Wood × Minimal — Dawn in a Silent Forest',
    prompt: 'A serene minimalist painting of a misty bamboo forest at dawn. Soft sage green and muted emerald tones. Sparse composition with generous negative space. Delicate ink-wash style branches barely visible through morning fog. Subtle dew drops on single bamboo leaves. Ethereal, meditative atmosphere. Matte canvas texture. Fine art painting, museum quality. 4:3 aspect ratio.',
    negativePrompt: 'busy, cluttered, bright colors, photorealistic, text, watermark',
  },
  {
    baseCode: 'W2',
    element: 'W',
    energy: 2,
    titleKor: '목 × 균형 — 사계의 정원',
    titleEng: 'Wood × Balanced — The Four Seasons Garden',
    prompt: 'A harmonious landscape painting of a meticulously arranged East Asian garden across four seasons. Balanced composition with a central pond reflecting jade-green willows and coral maple leaves. Stone pathways creating geometric harmony. Warm greens, moss tones, and touches of amber. Oil on canvas texture, impressionist brushwork. Tranquil and orderly atmosphere. Fine art. 4:3 aspect ratio.',
    negativePrompt: 'chaotic, dark, horror, photorealistic, text, watermark',
  },
  {
    baseCode: 'W3',
    element: 'W',
    energy: 3,
    titleKor: '목 × 역동 — 봄의 폭발',
    titleEng: 'Wood × Dynamic — Explosion of Spring',
    prompt: 'A dynamic expressionist painting of wild spring growth. Vigorous brushstrokes depicting climbing vines, unfurling ferns, and bursting cherry blossoms. Electric greens, vivid lime, and splashes of pink against deep forest shadows. Diagonal composition suggesting upward movement and growth energy. Bold impasto technique. Energetic, powerful atmosphere. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'static, dull, muted, photorealistic, text, watermark',
  },
  {
    baseCode: 'W4',
    element: 'W',
    energy: 4,
    titleKor: '목 × 유동 — 바람에 흐르는 녹음',
    titleEng: 'Wood × Flowing — Greenery Dancing in Wind',
    prompt: 'A fluid, organic painting of willow branches and leaves flowing in gentle wind. Curving lines and swirling forms in varied greens — jade, celadon, olive, and chartreuse. Watercolor-like translucency with areas blending into each other. Rhythmic, wave-like composition suggesting natural breath. Soft, dreamy, emotionally warm atmosphere. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'rigid, geometric, sharp edges, photorealistic, text, watermark',
  },
  {
    baseCode: 'W5',
    element: 'W',
    energy: 5,
    titleKor: '목 × 밀도 — 고목의 내면',
    titleEng: 'Wood × Dense — Inner Rings of an Ancient Tree',
    prompt: 'A richly detailed painting showing the cross-section of an ancient tree trunk. Concentric growth rings in deep brown, forest green, and aged gold. Intricate wood grain patterns fill the entire canvas with mesmerizing density. Occasional crystallized amber and embedded fossil details. Dark background emphasizing the specimen. Hyper-textured, contemplative. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'empty, sparse, cartoon, photorealistic, text, watermark',
  },

  // ═══ F (화/Fire) ═══════════════════════════════════════
  {
    baseCode: 'F1',
    element: 'F',
    energy: 1,
    titleKor: '화 × 여백 — 꺼져가는 촛불',
    titleEng: 'Fire × Minimal — A Fading Candle Flame',
    prompt: 'A minimalist painting of a single candle flame in vast darkness. Warm amber glow with a tiny core of white-hot light, surrounded by expansive dark space. Subtle warm haze radiating outward. Simple, contemplative composition. Soft chiaroscuro technique reminiscent of Georges de La Tour. Intimate, meditative warmth. Fine art painting, oil on dark canvas. 4:3 aspect ratio.',
    negativePrompt: 'busy, multiple objects, bright, neon, photorealistic, text, watermark',
  },
  {
    baseCode: 'F2',
    element: 'F',
    energy: 2,
    titleKor: '화 × 균형 — 노을의 지평선',
    titleEng: 'Fire × Balanced — The Horizon at Sunset',
    prompt: 'A balanced landscape painting of a golden sunset over calm waters. Perfect horizontal composition with sky and sea mirroring warm tones. Gradient from deep crimson through coral, peach, and soft gold. Thin clouds catching the last light. Reflective water surface creating symmetry. Warm but composed atmosphere. Turner-inspired color mastery. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'chaotic, cold, blue, stormy, photorealistic, text, watermark',
  },
  {
    baseCode: 'F3',
    element: 'F',
    energy: 3,
    titleKor: '화 × 역동 — 용암의 춤',
    titleEng: 'Fire × Dynamic — Dance of Lava',
    prompt: 'A powerful abstract expressionist painting of flowing lava and volcanic eruption. Violent reds, molten oranges, incandescent yellows against charcoal black. Aggressive, gestural brushstrokes suggesting explosive force. Diagonal compositions and splatters of pigment. Texture of cracked earth and flowing magma. Raw, primal energy. Inspired by Pollock meets volcanic force. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'calm, pastel, delicate, photorealistic, text, watermark',
  },
  {
    baseCode: 'F4',
    element: 'F',
    energy: 4,
    titleKor: '화 × 유동 — 오로라의 리듬',
    titleEng: 'Fire × Flowing — Rhythm of Aurora',
    prompt: 'A flowing, ethereal painting of aurora borealis with warm fire undertones. Sinuous ribbons of magenta, coral, rose-gold, and amber flowing across a twilight sky. Soft gradients and luminous transparency. Organic, wave-like rhythms suggesting cosmic dance. Warm color palette unusual for aurora — as if fire dances in the sky. Romantic, dreamy atmosphere. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'rigid, geometric, cold green aurora, photorealistic, text, watermark',
  },
  {
    baseCode: 'F5',
    element: 'F',
    energy: 5,
    titleKor: '화 × 밀도 — 불꽃의 결정',
    titleEng: 'Fire × Dense — Crystallized Flame',
    prompt: 'A dense, jewel-like painting depicting fire frozen into crystalline structures. Faceted geometric forms in ruby, garnet, amber, and topaz colors. Overlapping translucent layers creating depth and complexity. Light refracting through crystal-fire formations. Richly layered, each area revealing new detail upon inspection. Dark obsidian background. Precious, concentrated warmth. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'empty, flat, cartoon, photorealistic, text, watermark',
  },

  // ═══ E (토/Earth) ═══════════════════════════════════════
  {
    baseCode: 'E1',
    element: 'E',
    energy: 1,
    titleKor: '토 × 여백 — 사막의 적막',
    titleEng: 'Earth × Minimal — Silence of the Desert',
    prompt: 'A minimalist painting of a vast desert landscape. Single sand dune curve against pale sky. Warm ochre, sand beige, and cream tones with minimal detail. Expansive negative space suggesting infinite solitude. Subtle shadow gradient on the dune. Matte, earthy texture. Reminiscent of Georgia O\'Keeffe\'s desert works. Serene, grounding atmosphere. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'busy, vegetation, water, bright colors, photorealistic, text, watermark',
  },
  {
    baseCode: 'E2',
    element: 'E',
    energy: 2,
    titleKor: '토 × 균형 — 계단식 논',
    titleEng: 'Earth × Balanced — Terraced Rice Fields',
    prompt: 'A harmonious painting of terraced rice fields carved into hillsides. Repeating horizontal curves in warm golden-brown, sienna, and soft green. Perfect balance between earth and cultivation. Stone walls creating organized patterns. Morning mist softening the edges. Warm earth tones dominating with touches of harvest gold. Peaceful, abundant, grounding. Fine art painting, impressionist style. 4:3 aspect ratio.',
    negativePrompt: 'chaotic, industrial, cold colors, photorealistic, text, watermark',
  },
  {
    baseCode: 'E3',
    element: 'E',
    energy: 3,
    titleKor: '토 × 역동 — 대지의 균열',
    titleEng: 'Earth × Dynamic — Earth\'s Fracture',
    prompt: 'A powerful painting of dramatic geological formation — tectonic plates shifting, canyon walls revealing layered strata. Rich burnt sienna, raw umber, terracotta, and ochre with veins of copper and gold. Dynamic diagonal lines and fracture patterns. Thick impasto texture suggesting actual earth and stone. Monumental, awe-inspiring geological force. Fine art painting, large-scale composition. 4:3 aspect ratio.',
    negativePrompt: 'flat, smooth, delicate, photorealistic, text, watermark',
  },
  {
    baseCode: 'E4',
    element: 'E',
    energy: 4,
    titleKor: '토 × 유동 — 황토 물결',
    titleEng: 'Earth × Flowing — Waves of Ochre Clay',
    prompt: 'A flowing abstract painting of earth and clay in liquid motion. Swirling forms in warm terracotta, golden clay, amber honey, and cream. Organic curves suggesting flowing mud, melting pottery, and shifting dunes. Smooth gradients between tones. Texture alternating between matte clay and glossy glaze surfaces. Nurturing, embracing warmth. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'rigid, cold, angular, photorealistic, text, watermark',
  },
  {
    baseCode: 'E5',
    element: 'E',
    energy: 5,
    titleKor: '토 × 밀도 — 지층의 기억',
    titleEng: 'Earth × Dense — Memory in Geological Layers',
    prompt: 'A richly dense painting of geological cross-section showing millions of years of sediment. Horizontal striations in hundreds of earth tones — burnt orange, clay red, sandstone beige, limestone white, shale grey. Embedded fossils, mineral veins, and crystal formations throughout. Every square inch reveals detail. Archaeologically fascinating, deeply textured. Fine art painting, mixed media feel. 4:3 aspect ratio.',
    negativePrompt: 'empty, sparse, bright neon, photorealistic, text, watermark',
  },

  // ═══ M (금/Metal) ═══════════════════════════════════════
  {
    baseCode: 'M1',
    element: 'M',
    energy: 1,
    titleKor: '금 × 여백 — 달빛의 은',
    titleEng: 'Metal × Minimal — Silver of Moonlight',
    prompt: 'A minimalist painting of moonlight on a still metallic surface. Single source of pale silver-white light reflecting off a mirror-like plane. Monochromatic palette of silver, platinum, pearl grey, and soft white. Vast empty space with a single luminous point. Clean, precise, almost architectural stillness. Cool elegance and refined simplicity. Fine art painting, silver-leaf technique. 4:3 aspect ratio.',
    negativePrompt: 'busy, warm colors, organic, cluttered, photorealistic, text, watermark',
  },
  {
    baseCode: 'M2',
    element: 'M',
    energy: 2,
    titleKor: '금 × 균형 — 강철의 질서',
    titleEng: 'Metal × Balanced — Order of Steel',
    prompt: 'A balanced, geometric painting inspired by precision metalwork. Symmetrical composition of polished steel forms, interlocking geometric shapes in silver, gunmetal, and platinum. Subtle warm reflections of gold on cool metal surfaces. Clean lines and precise proportions. Industrial beauty meets classical harmony. Bauhaus-inspired aesthetics. Dignified, structured atmosphere. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'chaotic, organic, colorful, messy, photorealistic, text, watermark',
  },
  {
    baseCode: 'M3',
    element: 'M',
    energy: 3,
    titleKor: '금 × 역동 — 검의 섬광',
    titleEng: 'Metal × Dynamic — Flash of the Blade',
    prompt: 'A dynamic painting of light refracting off spinning metal surfaces. Sharp angular compositions of chrome, steel blue, and white-hot highlights. Streaking diagonal lines suggesting rapid motion of polished metal. Sparks and light trails. Contrast between dark steel shadows and brilliant reflective highlights. Powerful, decisive energy. Futurist art movement inspired. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'soft, pastel, organic, static, photorealistic, text, watermark',
  },
  {
    baseCode: 'M4',
    element: 'M',
    energy: 4,
    titleKor: '금 × 유동 — 수은의 흐름',
    titleEng: 'Metal × Flowing — Mercury\'s Flow',
    prompt: 'A mesmerizing painting of liquid metal in motion. Flowing mercury and molten silver forming organic pools and streams. Reflective surfaces capturing distorted rainbow refractions. Cool palette of silver, chrome, and iridescent blue-grey with occasional warm gold reflections. Smooth, hypnotic movement. Art Nouveau meets liquid dynamics. Ethereally beautiful. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'rigid, matte, warm colors dominant, photorealistic, text, watermark',
  },
  {
    baseCode: 'M5',
    element: 'M',
    energy: 5,
    titleKor: '금 × 밀도 — 광맥의 보고',
    titleEng: 'Metal × Dense — Treasury of Ore Veins',
    prompt: 'A densely detailed painting of a precious metal ore vein cross-section. Intricate patterns of gold veins running through quartz and granite. Silver, copper, and platinum traces creating complex mineral networks. Crystalline formations catching light from within. Deep underground palette of charcoal, slate, with brilliant metallic accents throughout. Museum specimen quality. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'empty, simple, cartoon, bright background, photorealistic, text, watermark',
  },

  // ═══ A (수/Water) ═══════════════════════════════════════
  {
    baseCode: 'A1',
    element: 'A',
    energy: 1,
    titleKor: '수 × 여백 — 새벽 안개의 호수',
    titleEng: 'Water × Minimal — Lake in Dawn Mist',
    prompt: 'A minimalist painting of a perfectly still lake in pre-dawn mist. Vast expanse of pale blue-grey water merging with fog at the horizon. Single dark silhouette of a distant tree reflected perfectly. Monochromatic blue-grey palette with whisper of lavender. Maximum negative space, absolute stillness. Reminiscent of Whistler\'s Nocturnes. Profoundly calm. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'busy, colorful, waves, boats, people, photorealistic, text, watermark',
  },
  {
    baseCode: 'A2',
    element: 'A',
    energy: 2,
    titleKor: '수 × 균형 — 비 온 뒤의 연못',
    titleEng: 'Water × Balanced — Pond After Rain',
    prompt: 'A balanced painting of a garden pond after gentle rain. Concentric ripple circles creating geometric harmony on water surface. Reflected sky, lotus pads, and stone edges in perfect symmetry. Soft blue-green, teal, and silver-blue palette. Monet-inspired but more structured composition. Droplets creating ordered patterns. Refreshing, cleansing calm. Fine art painting, impressionist. 4:3 aspect ratio.',
    negativePrompt: 'chaotic, stormy, dark, dramatic, photorealistic, text, watermark',
  },
  {
    baseCode: 'A3',
    element: 'A',
    energy: 3,
    titleKor: '수 × 역동 — 폭포의 포효',
    titleEng: 'Water × Dynamic — Roar of the Waterfall',
    prompt: 'A powerful painting of a massive waterfall crashing into rocks below. Dramatic composition with rushing water in deep indigo, cerulean, and white foam. Mist and spray creating atmospheric perspective. Rocks glistening with wet surfaces. Powerful diagonal water flow dominating the canvas. Romantic era painting style, sublime nature. Awe-inspiring force. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'calm, still, dry, minimal, photorealistic, text, watermark',
  },
  {
    baseCode: 'A4',
    element: 'A',
    energy: 4,
    titleKor: '수 × 유동 — 해류의 춤',
    titleEng: 'Water × Flowing — Dance of Ocean Currents',
    prompt: 'A fluid abstract painting of intertwining ocean currents seen from above. Swirling patterns in deep navy, turquoise, aquamarine, and seafoam white. Organic, spiraling forms suggesting the great oceanic conveyor. Bioluminescent touches of cyan light. Smooth, meditative flow like Hokusai meets abstract expressionism. Deeply soothing yet alive with movement. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'rigid, geometric, dry, warm colors, photorealistic, text, watermark',
  },
  {
    baseCode: 'A5',
    element: 'A',
    energy: 5,
    titleKor: '수 × 밀도 — 심해의 보석',
    titleEng: 'Water × Dense — Jewels of the Deep Sea',
    prompt: 'A richly dense painting of the deep ocean floor ecosystem. Layered composition of coral, anemones, bioluminescent creatures, and mineral deposits in deep sapphire, midnight blue, and teal. Scattered points of luminescent light — aqua, violet, pearl. Every area packed with intricate marine detail. Abyssal pressure and mystery. Dark but jewel-toned and alive. Fine art painting. 4:3 aspect ratio.',
    negativePrompt: 'empty, bright surface water, sunny, sparse, photorealistic, text, watermark',
  },
]

/**
 * Base Code로 프롬프트 조회
 */
export function getPromptByBaseCode(baseCode: string): BaseCasePrompt | undefined {
  return BASE_CASE_PROMPTS.find(p => p.baseCode === baseCode)
}
