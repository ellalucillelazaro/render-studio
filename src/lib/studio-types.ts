export type DrawingType =
  | "Floor Plan"
  | "Elevation"
  | "Section"
  | "Site Plan"
  | "Detail"
  | "Roof Plan"
  | "Reflected Ceiling"
  | "Unknown";

export interface SheetRow {
  id: string;
  sourceFile: string;
  sheetNumber: string;
  title: string;
  drawingType: DrawingType;
  thumbnailUrl: string | null;
  pageIndex?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  kind: "pdf" | "image";
  url: string;
}

export type CleanupStrength = "Light" | "Standard" | "Aggressive";

export interface CleanupOptions {
  removeDimensions: boolean;
  removeLabels: boolean;
  removeTitleBlock: boolean;
  removeCallouts: boolean;
  removeHatch: boolean;
  cleanLinework: boolean;
  sharpen: boolean;
  cropCenter: boolean;
  strength: CleanupStrength;
}

export const DEFAULT_CLEANUP: CleanupOptions = {
  removeDimensions: true,
  removeLabels: true,
  removeTitleBlock: true,
  removeCallouts: true,
  removeHatch: false,
  cleanLinework: true,
  sharpen: true,
  cropCenter: true,
  strength: "Standard",
};

export interface FirmPreset {
  id: string;
  name: string;
  programType: string;
  moodKeywords: string;
  materials: string;
  lightingStyle: string;
  negativePrompts: string;
  colorPalette: string;
  referenceImageUrl: string | null;
}

export const DEFAULT_PRESETS: FirmPreset[] = [
  {
    id: "warm-hospitality",
    name: "Warm Hospitality",
    programType: "Hospitality",
    moodKeywords: "warm, inviting, golden hour, intimate, refined",
    materials: "walnut, travertine, brushed brass, linen, woven rugs",
    lightingStyle: "soft warm 2700K, layered ambient + accent",
    negativePrompts: "cold tones, fluorescent, clutter, harsh shadows",
    colorPalette: "#1a1410, #6b4a2b, #c9a875, #f2ead7",
    referenceImageUrl: null,
  },
  {
    id: "minimal-white",
    name: "Minimal White Presentation",
    programType: "All",
    moodKeywords: "minimal, monochrome, museum, quiet, precise",
    materials: "white plaster, pale oak, polished concrete, glass",
    lightingStyle: "diffuse north light, soft shadows",
    negativePrompts: "color saturation, ornament, busy textures",
    colorPalette: "#ffffff, #f2f2f0, #c8c5be, #1a1a1a",
    referenceImageUrl: null,
  },
  {
    id: "luxury-multifamily",
    name: "Luxury Multifamily",
    programType: "Residential — Multifamily",
    moodKeywords: "elevated, urban, sophisticated, twilight",
    materials: "blackened steel, marble, oak millwork, bronze",
    lightingStyle: "twilight exterior, warm interior glow",
    negativePrompts: "suburban, beige, generic apartment",
    colorPalette: "#0e1014, #2a2622, #8a7a64, #d9c9a8",
    referenceImageUrl: null,
  },
  {
    id: "boutique-hotel",
    name: "Boutique Hotel",
    programType: "Hospitality",
    moodKeywords: "moody, layered, editorial, cinematic",
    materials: "smoked oak, terrazzo, brass, velvet, leather",
    lightingStyle: "low warm pools, candlelit accents",
    negativePrompts: "corporate, bright daylight, flat",
    colorPalette: "#16110d, #4a2e22, #b08246, #ead7b8",
    referenceImageUrl: null,
  },
  {
    id: "soft-residential",
    name: "Soft Residential",
    programType: "Residential — Single Family",
    moodKeywords: "calm, natural, lived-in, morning light",
    materials: "white oak, limewash, linen, ceramic, stone",
    lightingStyle: "soft morning daylight, gentle bounce",
    negativePrompts: "dark, dramatic, commercial feel",
    colorPalette: "#fbf7f0, #e8dccb, #a8987f, #2e2a24",
    referenceImageUrl: null,
  },
  {
    id: "developer-brochure",
    name: "Developer Brochure",
    programType: "Marketing",
    moodKeywords: "aspirational, clean, sunlit, lifestyle",
    materials: "glass, white render, timber accents, landscape",
    lightingStyle: "golden hour exterior, blue sky",
    negativePrompts: "construction artifacts, technical look",
    colorPalette: "#ffffff, #e6e1d6, #8aa17c, #1c2a1e",
    referenceImageUrl: null,
  },
  {
    id: "competition-board",
    name: "Competition Board",
    programType: "Competition",
    moodKeywords: "conceptual, diagrammatic, bold, graphic",
    materials: "abstracted volumes, single material expression",
    lightingStyle: "high-contrast, single direction",
    negativePrompts: "photorealism, decoration, furniture clutter",
    colorPalette: "#ffffff, #000000, #8f201f, #c8c5be",
    referenceImageUrl: null,
  },
];
