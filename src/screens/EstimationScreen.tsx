import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, RefreshCw, ChevronDown, Plus, Trash2, Calculator as CalcIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { Theme } from '../theme';

interface MasterRate { key: string; value: number; }
interface StoneMaster { id: string; name: string; category: string; rate: number; }
interface DynamicStone { id: string; label: string; weight: string; pcs: string; rate: string; category: string; isManualRate?: boolean; }

const num = (val: string | number) => parseFloat(String(val)) || 0;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.sm, backgroundColor: Theme.colors.background, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  backBtn: { padding: 8, backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.sm },
  headerTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: Theme.typography.size.lg, fontWeight: '900', color: Theme.colors.primary, letterSpacing: -0.5 },
  refreshBtn: { padding: 8 },
  scrollContent: { padding: Theme.spacing.sm },
  infoWrapper: { marginBottom: Theme.spacing.sm },
  infoWrapperTablet: { flexDirection: 'row', alignItems: 'stretch' },
  infoCard: { backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  skuBadge: { backgroundColor: Theme.colors.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  skuText: { fontSize: Theme.typography.size.xs, fontWeight: '700', color: Theme.colors.text.secondary },
  purityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.muted, paddingHorizontal: 8, paddingVertical: 4, gap: 4, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 4 },
  purityText: { fontSize: Theme.typography.size.xs, fontWeight: '800', color: Theme.colors.primary },
  itemName: { fontSize: Theme.typography.size.lg, fontWeight: '900', color: Theme.colors.text.primary },
  grossSection: { backgroundColor: Theme.colors.muted, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderRadius: Theme.radius.sm },
  grossLabel: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, marginBottom: 2, letterSpacing: 1 },
  grossInput: { color: Theme.colors.text.primary, padding: 0, fontSize: Theme.typography.size.xl, fontWeight: '900' },
  tableContainer: { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border },
  ssRow: { flexDirection: 'row', alignItems: 'center' },
  ssCell: { height: '100%', justifyContent: 'center', paddingHorizontal: 8 },
  headerLabel: { fontSize: Theme.typography.size.xs, fontWeight: '900', color: Theme.colors.text.primary, letterSpacing: 0.5 },
  ssLabel: { fontSize: Theme.typography.size.xs, fontWeight: '800' },
  ssText: { fontSize: Theme.typography.size.md, color: Theme.colors.text.primary },
  ssInput: { color: Theme.colors.text.primary, padding: 0, height: '100%', fontSize: Theme.typography.size.md },
  tableDivider: { height: 1, backgroundColor: Theme.colors.border },
  summaryContainer: { backgroundColor: Theme.colors.muted, padding: Theme.spacing.md },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { color: Theme.colors.text.secondary, fontSize: Theme.typography.size.xs, fontWeight: '600' },
  summaryValue: { color: Theme.colors.text.primary, fontSize: Theme.typography.size.md, fontWeight: '700' },
  gstInput: { color: Theme.colors.primary, fontSize: Theme.typography.size.xs, backgroundColor: Theme.colors.surface, paddingHorizontal: 8, paddingVertical: 2, minWidth: 40, textAlign: 'center', borderRadius: 4 },
  finalTotalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 15, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  finalTotalLabel: { color: Theme.colors.primary, fontSize: Theme.typography.size.md, fontWeight: '900', letterSpacing: 1 },
  finalTotalValue: { color: Theme.colors.text.primary, fontSize: Theme.typography.size.xl, fontWeight: '900' },
  adminSection: {
    marginTop: 20,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  adminTitle: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '900',
    color: Theme.colors.text.primary,
    letterSpacing: 1,
  },
  adminGrid: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.muted,
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
  },
  adminStat: {
    flex: 1,
    padding: 12,
  },
  adminLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  adminValue: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  lossWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  lossWarningText: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '700',
    color: Theme.colors.status.error,
  }
});

const renameStone = (name: string) => {
  const n = name.toUpperCase().trim();
  if (n.includes('VVS') || n.includes('EF') || n.includes('RD') || n === 'DIAMOND') return 'Diamond (VVS-EF-RD)';
  if (n.includes('SHAPE')) return 'Shape Diamonds';
  return name;
};

const getDynamicRate = (name: string, weight: number, pcs: number, master: any[], productName: string = '') => {
  const normalizedName = name.toLowerCase().trim();
  const w = num(weight);
  const p = num(pcs);
  if (w === 0 || p === 0 || !master || master.length === 0) return null;

  const avgSize = w / p;

  const matches = master.filter(s => {
    const mName = s.name.toLowerCase().trim();
    const mCat = s.category.toLowerCase().trim();
    const mSubCat = (s.sub_category || '').toUpperCase().trim();

    const isRD = (normalizedName.includes('vvs') || normalizedName.includes('ef') || normalizedName === 'diamond') && mSubCat === 'RD';
    const isShape = normalizedName.includes('shape') && mSubCat === 'SHAPE';
    const isGenericMatch = mName.includes(normalizedName) || normalizedName.includes(mName) || mCat === normalizedName;

    return (isRD || isShape || isGenericMatch) &&
           avgSize >= num(s.min_wt) &&
           avgSize <= num(s.max_wt);
  });

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    const aExact = a.name.toLowerCase().trim() === normalizedName;
    const bExact = b.name.toLowerCase().trim() === normalizedName;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return (num(a.max_wt) - num(a.min_wt)) - (num(b.max_wt) - num(b.min_wt));
  });

  return matches[0].rate;
};

const SpreadsheetRow = ({ label, subLabel, weight, pcs, rate, amount, onWeightChange, onPcsChange, onRateChange, editable = true, bg, labelColor, isHeader = false, isTablet, showSubInput, subValue, onSubValueChange }: any) => {
  const fontSize = isTablet ? 15 : 10;
  const headerFontSize = isTablet ? 12 : 9;
  const rowHeight = isHeader ? (isTablet ? 45 : 30) : (subLabel ? (isTablet ? 90 : 65) : (isTablet ? 60 : 40));
  const rowBg = bg || Theme.colors.surface;
  const textColor = labelColor || Theme.colors.text.primary;

  if (isHeader) {
    return (
      <View style={[styles.ssRow, { backgroundColor: Theme.colors.muted, height: rowHeight }]}>
        <View style={[styles.ssCell, { flex: 1.8 }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize }]}>PARTICULARS</Text></View>
        <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>CT/WT</Text></View>
        <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>PCS</Text></View>
        <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>RATE</Text></View>
        <View style={[styles.ssCell, { flex: 1.5, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'right' }]}>AMOUNT (₹)</Text></View>
      </View>
    );
  }

  return (
    <View style={[styles.ssRow, { backgroundColor: rowBg, height: rowHeight }]}>
      <View style={[styles.ssCell, { flex: 1.8, overflow: 'hidden' }]}>
        <Text style={[styles.ssLabel, { color: textColor, fontSize: fontSize, fontWeight: '800' }]} numberOfLines={1}>{label}</Text>
        {subLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: fontSize - 2, color: Theme.colors.text.secondary, fontWeight: '800' }}>+ </Text>
            {showSubInput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={{ fontSize: fontSize - 2, fontWeight: '900', color: Theme.colors.primary, padding: 0, minWidth: 20, textAlign: 'center' }} 
                  value={String(subValue || '')} 
                  onChangeText={onSubValueChange}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={{ fontSize: fontSize - 3, color: Theme.colors.text.muted, fontWeight: '800' }}>% </Text>
              </View>
            ) : null}
            <Text style={{ fontSize: fontSize - 2, color: Theme.colors.text.secondary, fontWeight: '700' }}> {subLabel}</Text>
          </View>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
        {editable ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(weight || '')} 
            onChangeText={onWeightChange} 
            keyboardType="numeric" 
            placeholder="0.00"
            placeholderTextColor={Theme.colors.text.muted}
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{weight}</Text>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
        {editable && onPcsChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', color: Theme.colors.primary, fontWeight: '800', textAlign: 'center' }]} 
            value={String(pcs || '')} 
            onChangeText={onPcsChange} 
            keyboardType="numeric" 
            placeholder="P"
            placeholderTextColor={Theme.colors.text.muted}
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{pcs || '-'}</Text>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
        {editable && onRateChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(rate || '')} 
            onChangeText={onRateChange} 
            keyboardType="numeric" 
            placeholder="0"
            placeholderTextColor={Theme.colors.text.muted}
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{rate ? num(rate).toLocaleString('en-IN') : '-'}</Text>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 1.5, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
        <Text style={[styles.ssText, { textAlign: 'right', fontWeight: '800', fontSize: fontSize, color: Theme.colors.text.primary }]} numberOfLines={1}>
          {amount}
        </Text>
      </View>
    </View>
  );
};

export default function EstimationScreen({ route, navigation }: any) {
  const { item } = route.params;
  const { width } = useWindowDimensions();
  const { role } = useRole();
  const isTablet = width > 768;
  const [loading, setLoading] = useState(true);
  const [stoneMaster, setStoneMaster] = useState<StoneMaster[]>([]);
  const [goldRate, setGoldRate] = useState(0);
  const [rateMap, setRateMap] = useState<any>({});

  const getInitialCalcData = (currentRateMap: any) => {
    const isDiamond = item.name && item.name.trim().toUpperCase().startsWith('D');
    const defaultLabor = isDiamond 
      ? (currentRateMap.default_labor_diamond || '1200') 
      : (currentRateMap.default_labor_regular || '550');
      
    return {
      gross_wt: String(item.gross_wt || 0),
      net_wt: String(item.net_wt || 0), 
      cert_rate: String(currentRateMap.cert_rate_per_ct || '950'),
      making_gold_rate: String(defaultLabor),
      wastage_pct: String(item.wastage || currentRateMap.default_wastage_pct || '22'),
      tax_pct: String(currentRateMap.tax_gst_pct || '3'),
      purity: item.purity || '18KT',
      name: item.name || 'Product',
      prc_amount: num(item.prc_amount || 0),
    };
  };

  const getInitialStones = (currentRateMap: any) => {
    let stones: any[] = [];
    try {
      if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
        stones = JSON.parse(item.stones_in_detail);
      } else {
        stones = [
          { id: 'd1', label: 'Diamond (VVS-EF-RD)', weight: String(item.dai_wt || 0), pcs: String(item.dai_pcs || 0), rate: String(currentRateMap.diamond_rd_rate || '65000'), category: 'Diamond' },
          { id: 's1', label: 'Color Stone', weight: String(item.clr_stone_wt || 0), pcs: String(item.clr_stone_pcs || 0), rate: String(currentRateMap.stone_rate || '3500'), category: 'Stone' },
          { id: 'b1', label: 'Beads', weight: '0', pcs: '0', rate: String(currentRateMap.default_beads_rate || '850'), category: 'Beads' }
        ];
      }
    } catch (e) { stones = []; }
    return stones.map((s: any) => ({
      id: s.id || Math.random().toString(36).substr(2, 9),
      label: renameStone(s.name || s.label || 'Stone'),
      weight: String(s.weight || 0),
      pcs: String(s.pcs || 0),
      rate: String(s.rate || 0),
      category: s.category || 'Stone'
    }));
  };

  const [calcData, setCalcData] = useState(() => getInitialCalcData({}));
  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>([]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (Object.keys(rateMap).length > 0) {
      setCalcData(getInitialCalcData(rateMap));
      setDynamicStones(getInitialStones(rateMap));
    }
  }, [rateMap]);

  useEffect(() => {
    if ((stoneMaster.length > 0 || Object.keys(rateMap).length > 0) && dynamicStones.length > 0) {
      const updated = dynamicStones.map(s => {
        if (s.isManualRate) return s;
        const dRate = getDynamicRate(s.label, num(s.weight), num(s.pcs), stoneMaster, calcData.name);
        let finalRate = dRate ? String(dRate) : s.rate;
        if (!dRate) {
            const exactMaster = stoneMaster.find(m => m.name.toLowerCase().trim() === s.label.toLowerCase().trim());
            if (exactMaster) finalRate = String(exactMaster.rate);
        }
        if (!dRate && finalRate === '0') {
            const label = s.label.toLowerCase();
            if (label.includes('diamond') || label.includes('vvs') || label.includes('ef')) {
                if (rateMap.diamond_rd_rate) finalRate = String(rateMap.diamond_rd_rate);
            }
            if (label.includes('color stone') || label.includes('stone')) {
                if (rateMap.stone_rate) finalRate = String(rateMap.stone_rate);
            }
            if (label.includes('beads')) {
                if (rateMap.default_beads_rate) finalRate = String(rateMap.default_beads_rate);
            }
        }
        const normalizedName = s.label.toLowerCase().trim();
        const normalizedProductName = calcData.name.toLowerCase().trim();
        const discount = num(rateMap.emerald_ruby_discount || 1000);
        if ((normalizedName.includes('emerald') || normalizedName.includes('ruby')) && !normalizedProductName.startsWith('d')) {
            finalRate = String(num(finalRate) - discount);
        }
        return { ...s, rate: finalRate };
      });
      const hasChanges = updated.some((s, idx) => s.rate !== dynamicStones[idx].rate);
      if (hasChanges) { setDynamicStones(updated); }
    }
  }, [stoneMaster, dynamicStones, rateMap, calcData.name]);

  useEffect(() => {
    if (Object.keys(rateMap).length > 0) {
      const p = calcData.purity.toLowerCase();
      setGoldRate(p.includes('24') ? rateMap.gold_24kt : p.includes('22') ? rateMap.gold_22kt : rateMap.gold_18kt);
    }
  }, [calcData.purity, rateMap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*')
      ]);
      setStoneMaster(stonesRes.data || []);
      const newRateMap: any = {};
      ratesRes.data?.forEach(r => { newRateMap[r.key] = r.value; });
      setRateMap(newRateMap);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const formatNum = (v: number) => v === 0 ? '0' : v.toLocaleString('en-IN', { maximumFractionDigits: 3, minimumFractionDigits: 0 });

  const diamondCarats = dynamicStones
    .filter(s => {
      const label = s.label.toLowerCase();
      return label.includes('diamond') || label.includes('vvs') || label.includes('ef') || label.includes('rd') || label.includes('shape');
    })
    .reduce((acc, s) => acc + num(s.weight), 0);

  const netWtFromDb = num(calcData.net_wt);
  const isDProduct = calcData.name.trim().toUpperCase().startsWith('D');
  const isGProduct = calcData.name.trim().toUpperCase().startsWith('G');
  const t1Limit = num(rateMap.special_d_tier1_weight || 5.2);
  const t1Labor = num(rateMap.special_d_tier1_labor || 10000);
  const t2Limit = num(rateMap.special_d_tier2_weight || 8.0);
  const t2Labor = num(rateMap.special_d_tier2_labor || 12000);

  let makingGoldAmt = netWtFromDb * num(calcData.making_gold_rate);
  let isSpecialD = false;
  let isSpecialG = false;

  if (isDProduct) {
    if (netWtFromDb <= t1Limit && netWtFromDb > 0) {
      makingGoldAmt = t1Labor;
      isSpecialD = true;
    } else if (netWtFromDb < t2Limit && netWtFromDb > t1Limit) {
      makingGoldAmt = t2Labor;
      isSpecialD = true;
    }
  } else if (isGProduct) {
    if (netWtFromDb < 5 && netWtFromDb > 0) {
      makingGoldAmt = 4000;
      isSpecialG = true;
    } else if (netWtFromDb >= 5 && netWtFromDb <= 8) {
      makingGoldAmt = 8000;
      isSpecialG = true;
    }
  }

  const billingWt = netWtFromDb * (1 + (num(calcData.wastage_pct) / 100));
  const goldValue = billingWt * goldRate;
  const stonesTotal = dynamicStones.reduce((acc, s) => acc + (num(s.weight) === 0 ? num(s.pcs) * num(s.rate) : num(s.weight) * num(s.rate)), 0);
  const certCharges = diamondCarats * num(calcData.cert_rate);
  const subTotal = goldValue + stonesTotal + makingGoldAmt + certCharges;
  const totalINR = subTotal * (1 + (num(calcData.tax_pct) / 100));
  const purchaseAmount = num(calcData.prc_amount);
  const profitAmt = totalINR - purchaseAmount;
  const profitPct = purchaseAmount > 0 ? (profitAmt / purchaseAmount) * 100 : 0;
  const isLoss = profitAmt < 0;
  
  const handleWastageChange = (v: string) => {
    const newWastage = num(v);
    const wastageFloor = num(rateMap.admin_wastage_limit || 18);
    if (role === 'admin') {
      if (newWastage < wastageFloor) {
        setCalcData({...calcData, wastage_pct: String(wastageFloor)});
        return;
      }
      const testBillingWt = netWtFromDb * (1 + (newWastage / 100));
      const testGoldVal = testBillingWt * goldRate;
      let testLabor = netWtFromDb * num(calcData.making_gold_rate);
      if (isDProduct) {
        if (netWtFromDb <= t1Limit && netWtFromDb > 0) testLabor = t1Labor;
        else if (netWtFromDb < t2Limit && netWtFromDb > t1Limit) testLabor = t2Labor;
      }
      const testSubTotal = testGoldVal + stonesTotal + testLabor + certCharges;
      const testTotalINR = testSubTotal * (1 + (num(calcData.tax_pct) / 100));
      const testProfit = testTotalINR - purchaseAmount;
      if (testProfit < 0 && newWastage < num(calcData.wastage_pct)) {
        Alert.alert('Limit Reached', 'Further decrease in wastage will result in a loss.');
        return;
      }
    }
    setCalcData({...calcData, wastage_pct: v});
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><X size={isTablet ? 28 : 20} color={Theme.colors.text.primary} /></TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <CalcIcon size={isTablet ? 24 : 18} color={Theme.colors.primary} />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 20 : 16 }]}>Bill Estimator</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}><RefreshCw size={isTablet ? 24 : 18} color={Theme.colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoWrapper, isTablet && styles.infoWrapperTablet]}>
          <View style={[styles.infoCard, isTablet && { flex: 1, marginBottom: 0 }]}>
            <View style={styles.infoRow}>
              <View style={styles.skuBadge}><Text style={styles.skuText}>SKU: {item.sku || 'NEW'}</Text></View>
              <TouchableOpacity style={styles.purityBadge} onPress={() => setCalcData({...calcData, purity: calcData.purity === '18KT' ? '22KT' : '18KT'})}>
                <Text style={styles.purityText}>{calcData.purity}</Text>
                <ChevronDown size={10} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.itemName, { fontSize: isTablet ? 22 : 16 }]} numberOfLines={1}>{calcData.name}</Text>
          </View>

          <View style={[styles.grossSection, isTablet && { flex: 0.8, marginBottom: 0, marginLeft: 16 }]}>
            <Text style={styles.grossLabel}>GROSS WEIGHT (G)</Text>
            <TextInput style={[styles.grossInput, { fontSize: isTablet ? 32 : 24, fontWeight: '900' }]} value={calcData.gross_wt} onChangeText={(v) => setCalcData({...calcData, gross_wt: v})} keyboardType="numeric" />
          </View>
        </View>

        <View style={styles.tableContainer}>
          <SpreadsheetRow isHeader isTablet={isTablet} />
          <SpreadsheetRow 
            label="GOLD (NET WT)" 
            subLabel="Wastage"
            showSubInput={true}
            subValue={calcData.wastage_pct}
            onSubValueChange={handleWastageChange}
            weight={calcData.net_wt} 
            rate={goldRate} 
            amount={formatNum(goldValue)} 
            onWeightChange={(v: any) => setCalcData({...calcData, net_wt: v})}
            bg={Theme.colors.surface} 
            labelColor={Theme.colors.primary}
            isTablet={isTablet} 
          />
          {dynamicStones.map((s, idx) => (
            <SpreadsheetRow 
              key={s.id} 
              label={s.label} 
              weight={s.weight} 
              pcs={s.pcs}
              rate={s.rate} 
              amount={formatNum(num(s.weight) === 0 ? num(s.pcs) * num(s.rate) : num(s.weight) * num(s.rate))} 
              onWeightChange={(v: any) => {
                const newRate = getDynamicRate(s.label, num(v), num(s.pcs), stoneMaster, calcData.name);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, weight: v, rate: newRate ? String(newRate) : ds.rate, isManualRate: false} : ds));
              }} 
              onPcsChange={(v: any) => {
                const newRate = getDynamicRate(s.label, num(s.weight), num(v), stoneMaster, calcData.name);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, pcs: v, rate: newRate ? String(newRate) : ds.rate, isManualRate: false} : ds));
              }} 
              onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v, isManualRate: true} : ds))} 
              bg={idx % 2 === 0 ? Theme.colors.surface : Theme.colors.background} 
              isTablet={isTablet} 
            />
          ))}
          {diamondCarats > 0 && (
            <SpreadsheetRow 
              label="Certification" 
              weight={formatNum(diamondCarats)} 
              rate={calcData.cert_rate} 
              amount={formatNum(certCharges)} 
              onRateChange={(v: any) => setCalcData({...calcData, cert_rate: v})}
              bg={Theme.colors.surface} 
              labelColor={Theme.colors.primary}
              isTablet={isTablet} 
            />
          )}
          <View style={styles.tableDivider} />
          <SpreadsheetRow 
            label="Labour Charges" 
            weight={formatNum(netWtFromDb)} 
            rate={(isSpecialD || isSpecialG) ? "-" : calcData.making_gold_rate} 
            amount={formatNum(makingGoldAmt)} 
            onRateChange={(isSpecialD || isSpecialG) ? null : (v: any) => setCalcData({...calcData, making_gold_rate: v})} 
            bg={Theme.colors.surface} 
            isTablet={isTablet} 
          />
          <View style={styles.summaryContainer}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Sub-Total Value</Text>
              <Text style={[styles.summaryValue, { fontWeight: '800', fontSize: isTablet ? 18 : 14 }]}>₹{formatNum(subTotal)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                <Text style={styles.summaryLabel}>GST (%)</Text>
                <TextInput style={[styles.gstInput, { fontWeight: '800' }]} value={calcData.tax_pct} onChangeText={(v) => setCalcData({...calcData, tax_pct: v})} keyboardType="numeric" />
              </View>
              <Text style={[styles.summaryValue, { fontWeight: '800', fontSize: isTablet ? 18 : 14 }]}>₹{formatNum(subTotal * (num(calcData.tax_pct) / 100))}</Text>
            </View>
            <View style={styles.finalTotalLine}>
              <Text style={styles.finalTotalLabel}>TOTAL ESTIMATE</Text>
              <Text style={[styles.finalTotalValue, { fontSize: isTablet ? 32 : 24, fontWeight: '900' }]}>₹{formatNum(totalINR)}</Text>
            </View>
          </View>
        </View>

        {role === 'admin' && purchaseAmount > 0 && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <TrendingUp size={20} color={Theme.colors.status.success} />
              <Text style={styles.adminTitle}>ADMIN INSIGHTS</Text>
            </View>
            <View style={styles.adminGrid}>
              <View style={styles.adminStat}>
                <Text style={styles.adminLabel}>Purchase Cost</Text>
                <Text style={styles.adminValue}>₹{formatNum(purchaseAmount)}</Text>
              </View>
              <View style={[styles.adminStat, { borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
                <Text style={styles.adminLabel}>Est. Profit</Text>
                <Text style={[styles.adminValue, { color: isLoss ? Theme.colors.status.error : Theme.colors.status.success }]}>
                  ₹{formatNum(profitAmt)} ({profitPct.toFixed(1)}%)
                </Text>
              </View>
            </View>
            {isLoss && (
              <View style={styles.lossWarning}>
                <TrendingDown size={14} color={Theme.colors.status.error} />
                <Text style={styles.lossWarningText}>Currently selling at a loss</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
