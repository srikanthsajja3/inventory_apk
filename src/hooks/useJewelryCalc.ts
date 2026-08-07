import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { getDynamicStoneRate, calculateStoneAmount } from '../utils/diamondCalc';

export interface JewelryItem {
  name?: string | null;
  gross_wt?: number | string | null;
  net_wt?: number | string | null;
  dai_wt?: number | string | null;
  clr_stone_wt?: number | string | null;
  clr_stone_pcs?: number | string | null;
  wastage?: number | string | null;
  labour_amt?: number | string | null;
  labour_rate?: number | string | null;
  other_charges?: number | string | null;
  stones_in_detail?: string | null;
}

export interface MasterRates {
  gold_18kt?: number;
  gold_22kt?: number;
  gold_24kt?: number;
  diamond_rd_rate?: number;
  stone_rate?: number;
  cert_rate_per_ct?: number;
  tax_gst_pct?: number;
  default_wastage_pct?: number;
  special_d_tier1_weight?: number;
  special_d_tier1_labor?: number;
  special_d_tier2_weight?: number;
  special_d_tier2_labor?: number;
  default_labor_diamond?: number;
  default_labor_regular?: number;
  [key: string]: number | undefined;
}

export function useJewelryCalc() {
  const [rates, setRates] = useState<MasterRates>({});
  const [masterStones, setMasterStones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('key, value'),
        supabase.from('stone_master').select('*')
      ]);

      if (ratesRes.error) throw ratesRes.error;
      if (ratesRes.data) {
        const rateMap: MasterRates = {};
        ratesRes.data.forEach(r => {
          if (r.key) rateMap[r.key] = r.value;
        });
        setRates(rateMap);
      }

      if (stonesRes.data) {
        setMasterStones(stonesRes.data);
      }
    } catch (e) {
      console.error('Error fetching master rates or stone master:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const calculateEstimation = useCallback((item: JewelryItem, customRates?: MasterRates) => {
    const activeRates = customRates || rates;
    if (Object.keys(activeRates).length === 0) return 0;

    const num = (v: any) => parseFloat(String(v)) || 0;
    
    const goldRate = activeRates.gold_18kt || 0;
    const defaultDiamondRate = activeRates.diamond_rd_rate || 65000;
    const defaultStoneRate = activeRates.stone_rate || 3500;
    const certRate = activeRates.cert_rate_per_ct || 950;
    const taxPct = activeRates.tax_gst_pct || 3;

    const grossWt = num(item.gross_wt);
    const wastagePct = num(item.wastage || activeRates.default_wastage_pct || 22);
    const netWt = num(item.net_wt) || (grossWt * 0.8);
    const billingWt = netWt * (1 + (wastagePct / 100));
    const goldValue = billingWt * goldRate;
    
    const isDiamond = item.name?.trim().toUpperCase().startsWith('D');
    const isGold = item.name?.trim().toUpperCase().startsWith('G');
    
    // Tiered Special D Rule
    const t1Limit = num(activeRates.special_d_tier1_weight || 5.2);
    const t1Labor = num(activeRates.special_d_tier1_labor || 10000);
    const t2Limit = num(activeRates.special_d_tier2_weight || 8.0);
    const t2Labor = num(activeRates.special_d_tier2_labor || 12000);
    const defaultLaborDiamond = num(activeRates.default_labor_diamond || 1200);
    const defaultLaborRegular = num(activeRates.default_labor_regular || 550);

    let makingValue = netWt * (isDiamond ? defaultLaborDiamond : defaultLaborRegular);

    if (isDiamond) {
      if (netWt <= t1Limit && netWt > 0) {
        makingValue = t1Labor;
      } else if (netWt < t2Limit && netWt > t1Limit) {
        makingValue = t2Labor;
      }
    } else if (isGold) {
      if (netWt < 5 && netWt > 0) {
        makingValue = 4000;
      } else if (netWt >= 5 && netWt <= 8) {
        makingValue = 8000;
      }
    }
    
    // Fallback to item's own labour_amt if provided and greater
    if (num(item.labour_amt) > 0) {
      makingValue = num(item.labour_amt);
    }

    let stonesValue = 0;
    try {
      if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
        const stones = JSON.parse(item.stones_in_detail);
        stonesValue = stones.reduce((acc: number, s: any) => {
          const sWt = num(s.weight);
          const sPcs = num(s.pcs);
          let sRate = num(s.rate);
          if (sRate === 0) {
            sRate = getDynamicStoneRate(s.name || s.label || 'Diamond', s.category || 'Diamond', sWt, sPcs, masterStones, defaultDiamondRate);
          }
          return acc + calculateStoneAmount(sWt, sPcs, sRate);
        }, 0);
      } else {
        const daiWt = num(item.dai_wt);
        const daiRate = getDynamicStoneRate('Diamond', 'Diamond', daiWt, 1, masterStones, defaultDiamondRate);
        stonesValue = calculateStoneAmount(daiWt, 1, daiRate) + calculateStoneAmount(num(item.clr_stone_wt), num(item.clr_stone_pcs), defaultStoneRate);
      }
    } catch (e) {
      const daiWt = num(item.dai_wt);
      stonesValue = calculateStoneAmount(daiWt, 1, defaultDiamondRate) + calculateStoneAmount(num(item.clr_stone_wt), num(item.clr_stone_pcs), defaultStoneRate);
    }

    const certCharges = isDiamond ? (num(item.dai_wt) > 0 ? Math.max(num(item.dai_wt) * certRate, certRate) : 0) : 0;
    const otherCharges = num(item.other_charges);
    
    const totalBeforeTax = goldValue + stonesValue + makingValue + certCharges + otherCharges;
    const totalWithTax = totalBeforeTax * (1 + (taxPct / 100));

    return totalWithTax;
  }, [rates, masterStones]);

  return { rates, masterStones, loading, calculateEstimation, refreshRates: fetchRates };
}
