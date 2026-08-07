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
  defaultRate: number = 65000
): number {
  const w = num(weight);
  const p = num(pcs);
  const normalizedName = (stoneName || '').toLowerCase().trim();
  const normalizedCat = (category || 'Diamond').toLowerCase().trim();

  // If master list is empty, fallback
  if (!masterStones || masterStones.length === 0) {
    return defaultRate;
  }

  // Calculate average weight per piece (carats per stone)
  const avgSize = (p > 0 && w > 0) ? (w / p) : w;

  const isShapeQuery = normalizedName.includes('shape') || normalizedName.includes('fancy') || normalizedName.includes('marquise') || normalizedName.includes('oval') || normalizedName.includes('pear') || normalizedName.includes('princess') || normalizedName.includes('baguette');
  const isRDQuery = !isShapeQuery && (normalizedCat === 'diamond' || normalizedName.includes('vvs') || normalizedName.includes('ef') || normalizedName.includes('rd') || normalizedName.includes('round') || normalizedName.includes('diamond'));

  // Search for matches in stone_master
  const matches = masterStones.filter(s => {
    const mName = (s.name || '').toLowerCase().trim();
    const mCat = (s.category || '').toLowerCase().trim();
    const mSubCat = (s.sub_category || '').toUpperCase().trim();

    const minW = num(s.min_wt);
    const maxW = num(s.max_wt) || 999;
    const inBracket = avgSize === 0 || (avgSize >= minW && avgSize <= maxW);

    if (!inBracket) return false;

    if (isRDQuery) {
      // Exclude SHAPE master items for RD queries
      if (mSubCat === 'SHAPE') return false;
      if (mSubCat === 'RD') return true;
      return mName.includes(normalizedName) || normalizedName.includes(mName);
    }

    if (isShapeQuery) {
      // Exclude RD master items for SHAPE queries
      if (mSubCat === 'RD') return false;
      if (mSubCat === 'SHAPE') return true;
      return mName.includes(normalizedName) || normalizedName.includes(mName);
    }

    // Generic match for other categories (e.g. Color Stones, Beads)
    return mName.includes(normalizedName) || normalizedName.includes(mName) || mCat === normalizedCat;
  });

  if (matches.length > 0) {
    // Sort by sub_category match first, then exact name match, then narrowest bracket range
    matches.sort((a, b) => {
      const aSubCat = (a.sub_category || '').toUpperCase().trim();
      const bSubCat = (b.sub_category || '').toUpperCase().trim();

      if (isRDQuery) {
        if (aSubCat === 'RD' && bSubCat !== 'RD') return -1;
        if (aSubCat !== 'RD' && bSubCat === 'RD') return 1;
      } else if (isShapeQuery) {
        if (aSubCat === 'SHAPE' && bSubCat !== 'SHAPE') return -1;
        if (aSubCat !== 'SHAPE' && bSubCat === 'SHAPE') return 1;
      }

      const aExact = (a.name || '').toLowerCase().trim() === normalizedName;
      const bExact = (b.name || '').toLowerCase().trim() === normalizedName;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const rangeA = (num(a.max_wt) || 999) - num(a.min_wt);
      const rangeB = (num(b.max_wt) || 999) - num(b.min_wt);
      return rangeA - rangeB;
    });

    return num(matches[0].rate) || defaultRate;
  }

  // Generic category fallback from masterStones
  const categoryMatch = masterStones.find(s => (s.category || '').toLowerCase().trim() === normalizedCat);
  if (categoryMatch) {
    return num(categoryMatch.rate) || defaultRate;
  }

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
