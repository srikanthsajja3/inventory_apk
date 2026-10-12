import { supabase } from '../../supabase';

export interface StoneMasterItem {
  id: string;
  name: string;
  category: string;
  sub_category?: string | null;
  min_wt?: number | null;
  max_wt?: number | null;
  rate: number;
}

const num = (v: any): number => parseFloat(String(v)) || 0;

/**
 * Calculates average carat size per piece and looks up the rate in stone_master.
 */
export function getDynamicStoneRate(
  stoneName: string,
  category: string = 'Diamond',
  weight: number | string,
  pcs: number | string,
  masterStones: StoneMasterItem[] = [],
  defaultRate: number = 69000,
  masterRates: Record<string, any> = {},
  productName: string = ''
): number {
  const w = num(weight);
  const p = num(pcs);
  const avgSize = (p > 0 && w > 0) ? (w / p) : w;

  const rawName = (stoneName || '').trim();
  const normName = rawName.toUpperCase();
  let normCat = (category || '').trim().toUpperCase();

  // If master list is empty, fallback
  if (!masterStones || masterStones.length === 0) {
    return defaultRate;
  }

  // Infer category if not provided or vague
  if (!normCat || normCat === 'UNKNOWN' || normCat === 'OTHER') {
    if (normName.includes('DIAMOND') || normName.includes('VVS') || normName.includes('EF') || normName.includes('RD') || normName.includes('POLKI') || normName === 'D3') {
      normCat = 'DIAMOND';
    } else if (normName.includes('BEAD') || normName.includes('PEARL') || normName.includes('DROP') || normName.includes('MOTI')) {
      normCat = 'BEADS';
    } else {
      normCat = 'STONE';
    }
  }

  // 1. Identify Diamond Sub-Categories
  const isPolki = normName.includes('POLKI');
  const isShape = !isPolki && (
    normName.includes('SHAPE') || normName.includes('FANCY') || normName.includes('MARQUISE') ||
    normName.includes('OVAL') || (normName.includes('PEAR') && !normName.includes('PEARL')) || normName.includes('PRINCESS') ||
    normName.includes('BAGUETTE') || normName.includes('HEART')
  );
  const isRD = !isPolki && !isShape && (
    normCat === 'DIAMOND' && (
      normName.includes('VVS') || normName.includes('EF') || normName.includes('RD') ||
      normName.includes('ROUND') || normName === 'DIAMOND' || normName.startsWith('DIAMOND (')
    )
  );

  // Exact name alias mapping for common variations
  const aliasName = (name: string) => {
    if (name === 'EMBRALD') return 'EMERALD';
    if (name === 'RUBY POTAS') return 'RUBY POTA';
    if (name === 'KUNDAN') return 'KUNDHAN STONE';
    if (name === 'S SEA PEARL') return 'PEARLS';
    if (name === 'CS') return 'C.S (COLOR STONE)';
    if (name === 'STRING (DORI)' || name === 'DORI' || name === 'WAX') return 'BLACKBEADS'; // 0 rate
    return name;
  };
  const targetName = aliasName(normName);

  // 2. Bracket lookup for Polki
  if (isPolki) {
    const polkiMatches = masterStones.filter(s => {
      const sub = (s.sub_category || '').toUpperCase().trim();
      const sName = (s.name || '').toUpperCase().trim();
      if (sub !== 'POLKI' && !sName.includes('POLKI')) return false;
      const minW = num(s.min_wt);
      const maxW = num(s.max_wt) || 999;
      return avgSize === 0 || (avgSize >= minW && avgSize <= maxW);
    });
    if (polkiMatches.length > 0) {
      polkiMatches.sort((a, b) => ((num(a.max_wt) || 999) - num(a.min_wt)) - ((num(b.max_wt) || 999) - num(b.min_wt)));
      return num(polkiMatches[0].rate);
    }
    return 30000;
  }

  // 3. Bracket lookup for Shape Diamonds
  if (isShape) {
    const shapeMatches = masterStones.filter(s => {
      const sub = (s.sub_category || '').toUpperCase().trim();
      if (sub !== 'SHAPE') return false;
      const minW = num(s.min_wt);
      const maxW = num(s.max_wt) || 999;
      return avgSize === 0 || (avgSize >= minW && avgSize <= maxW);
    });
    if (shapeMatches.length > 0) {
      shapeMatches.sort((a, b) => ((num(a.max_wt) || 999) - num(a.min_wt)) - ((num(b.max_wt) || 999) - num(b.min_wt)));
      return num(shapeMatches[0].rate);
    }
    return 80000;
  }

  // 4. Bracket lookup for RD Diamonds
  if (isRD) {
    const rdMatches = masterStones.filter(s => {
      const sub = (s.sub_category || '').toUpperCase().trim();
      if (sub !== 'RD') return false;
      const minW = num(s.min_wt);
      const maxW = num(s.max_wt) || 999;
      return avgSize === 0 || (avgSize >= minW && avgSize <= maxW);
    });
    if (rdMatches.length > 0) {
      rdMatches.sort((a, b) => ((num(a.max_wt) || 999) - num(a.min_wt)) - ((num(b.max_wt) || 999) - num(b.min_wt)));
      return num(rdMatches[0].rate);
    }
    return 69000;
  }

  // 5. Direct Master Stones lookup by exact name
  const exactMatch = masterStones.find(s => (s.name || '').toUpperCase().trim() === targetName);
  if (exactMatch) {
    let rate = num(exactMatch.rate);
    // Apply Emerald / Ruby discount on non-diamond products
    const prodName = (productName || '').trim().toUpperCase();
    if ((targetName.includes('EMERALD') || targetName.includes('RUBY')) && !prodName.startsWith('D')) {
      const discount = num(masterRates.emerald_ruby_discount || 1000);
      rate = Math.max(0, rate - discount);
    }
    return rate;
  }

  // Partial name match in masterStones
  const partialMatch = masterStones.find(s => {
    const sName = (s.name || '').toUpperCase().trim();
    return targetName.includes(sName) || sName.includes(targetName);
  });
  if (partialMatch) {
    let rate = num(partialMatch.rate);
    const prodName = (productName || '').trim().toUpperCase();
    if ((targetName.includes('EMERALD') || targetName.includes('RUBY')) && !prodName.startsWith('D')) {
      const discount = num(masterRates.emerald_ruby_discount || 1000);
      rate = Math.max(0, rate - discount);
    }
    return rate;
  }

  // 6. Category fallbacks
  if (normCat === 'BEADS') return num(masterRates.default_beads_rate || 850);
  if (normCat === 'STONE') return num(masterRates.stone_rate || 3500);
  if (normCat === 'DIAMOND') return 69000;

  return defaultRate;
}

/**
 * Calculates total monetary value for a stone line item.
 * Weight (in carats/grams) * rate (per carat/gram), OR pcs * rate if weight is 0.
 */
export function calculateStoneAmount(
  weight: number | string,
  pcs: number | string,
  rate: number | string
): number {
  const w = num(weight);
  const p = num(pcs);
  const r = num(rate);

  if (w > 0) {
    return w * r;
  } else if (p > 0) {
    return p * r;
  }
  return 0;
}
