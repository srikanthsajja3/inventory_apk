import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, RefreshCw, ChevronDown, Plus, Trash2, Calculator as CalcIcon } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface MasterRate { key: string; value: number; }
interface StoneMaster { id: string; name: string; category: string; rate: number; }
interface DynamicStone { id: string; label: string; weight: string; pcs: string; rate: string; category: string; }

const num = (val: string | number) => parseFloat(String(val)) || 0;

const renameStone = (name: string) => {
  const n = name.toUpperCase().trim();
  // Match "Diamond (VVS-EF-RD)" or individual markers
  if (n.includes('VVS') || n.includes('EF') || n.includes('RD') || n === 'DIAMOND') return 'Diamond (VVS-EF-RD)';
  if (n.includes('SHAPE')) return 'Shape Diamonds';
  return name;
};

const getDynamicRate = (name: string, weight: number, pcs: number, master: any[]) => {
  const normalizedName = name.toLowerCase().trim();
  const w = num(weight);
  const p = num(pcs);
  if (w === 0 || p === 0 || !master || master.length === 0) return null;
  
  const avgSize = w / p;
  
  const matches = master.filter(s => {
    const mName = s.name.toLowerCase().trim();
    const mCat = s.category.toLowerCase().trim();
    const mSubCat = (s.sub_category || '').toUpperCase().trim();
    
    // Logic must match StoneEntryModal exactly
    const isRD = (normalizedName.includes('vvs') || normalizedName.includes('ef') || normalizedName === 'diamond') && mSubCat === 'RD';
    const isShape = normalizedName.includes('shape') && mSubCat === 'SHAPE';
    
    const isGenericMatch = mName.includes(normalizedName) || normalizedName.includes(mName) || mCat === normalizedName;
    
    return (isRD || isShape || isGenericMatch) &&
           avgSize >= num(s.min_wt) &&
           avgSize <= num(s.max_wt);
  });

  if (matches.length === 0) return null;

  // Sort by range width to get most specific slab
  matches.sort((a, b) => (num(a.max_wt) - num(a.min_wt)) - (num(b.max_wt) - num(b.min_wt)));
  
  let rate = matches[0].rate;
  if (normalizedName.includes('emerald') || normalizedName.includes('ruby')) {
    rate = num(rate) - 1000;
  }
  
  return rate;
};

const SpreadsheetRow = ({ label, subLabel, weight, pcs, rate, amount, onWeightChange, onPcsChange, onRateChange, editable = true, bg = '#fff', labelColor = '#1e293b', isHeader = false, isTablet, showSubInput, subValue, onSubValueChange }: any) => {
  const fontSize = isTablet ? 15 : 10;
  const headerFontSize = isTablet ? 12 : 9;
  const rowHeight = isHeader ? (isTablet ? 45 : 30) : (subLabel ? (isTablet ? 90 : 65) : (isTablet ? 60 : 40));

  if (isHeader) {
    return (
      <View style={[styles.ssRow, { backgroundColor: '#475569', height: rowHeight }]}>
        <View style={[styles.ssCell, { flex: 1.8 }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize }]}>PARTICULARS</Text></View>
        <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: '#64748b' }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>CT/WT</Text></View>
        <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: '#64748b' }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>PCS</Text></View>
        <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: '#64748b' }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>RATE</Text></View>
        <View style={[styles.ssCell, { flex: 1.5, borderLeftWidth: 1, borderLeftColor: '#64748b' }]}><Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'right' }]}>AMOUNT (₹)</Text></View>
      </View>
    );
  }

  return (
    <View style={[styles.ssRow, { backgroundColor: bg, height: rowHeight }]}>
      <View style={[styles.ssCell, { flex: 1.8 }]}>
        <Text style={[styles.ssLabel, { color: labelColor, fontSize: fontSize, fontWeight: '800' }]} numberOfLines={1}>{label}</Text>
        {subLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: fontSize - 2, color: '#64748b', fontWeight: '800' }}>+ </Text>
            {showSubInput ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={{ fontSize: fontSize - 2, fontWeight: '900', color: '#6366f1', padding: 0, minWidth: 20, textAlign: 'center' }} 
                  value={String(subValue || '')} 
                  onChangeText={onSubValueChange}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={{ fontSize: fontSize - 3, color: '#94a3b8', fontWeight: '800' }}>% </Text>
              </View>
            ) : null}
            <Text style={{ fontSize: fontSize - 2, color: '#64748b', fontWeight: '700' }}> {subLabel}</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(weight || '')} 
            onChangeText={onWeightChange} 
            keyboardType="numeric" 
            placeholder="0.00"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{weight}</Text>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onPcsChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', color: '#6366f1', fontWeight: '800', textAlign: 'center' }]} 
            value={String(pcs || '')} 
            onChangeText={onPcsChange} 
            keyboardType="numeric" 
            placeholder="P"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{pcs || '-'}</Text>
        )}
      </View>

      <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onRateChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(rate || '')} 
            onChangeText={onRateChange} 
            keyboardType="numeric" 
            placeholder="0"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{rate ? num(rate).toLocaleString('en-IN') : '-'}</Text>
        )}
      </View>
      
      <View style={[styles.ssCell, { flex: 1.5, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        <Text style={[styles.ssText, { textAlign: 'right', fontWeight: '800', fontSize: fontSize, color: '#0f172a' }]} numberOfLines={1}>
          {amount}
        </Text>
      </View>
    </View>
  );
};

export default function EstimationScreen({ route, navigation }: any) {
  const { item } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [loading, setLoading] = useState(true);
  const [stoneMaster, setStoneMaster] = useState<StoneMaster[]>([]);
  const [goldRate, setGoldRate] = useState(0);
  const [rateMap, setRateMap] = useState<any>({});
  
  const getInitialCalcData = () => {
    const isDiamond = item.name && item.name.trim().toUpperCase().startsWith('D');
    const defaultLabor = isDiamond ? '1200' : '550';
    return {
      gross_wt: String(item.gross_wt || 0),
      net_wt: String(item.net_wt || 0), 
      cert_rate: '950',
      making_gold_rate: defaultLabor,
      wastage_pct: String(item.wastage || '22'),
      tax_pct: '3',
      purity: item.purity || '18KT',
      name: item.name || 'Product',
    };
  };

  const getInitialStones = () => {
    let stones: any[] = [];
    try {
      if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
        stones = JSON.parse(item.stones_in_detail);
      } else {
        stones = [
          { id: 'd1', label: 'Diamond (VVS-EF-RD)', weight: String(item.dai_wt || 0), pcs: String(item.dai_pcs || 0), rate: '65000', category: 'Diamond' },
          { id: 's1', label: 'Color Stone', weight: String(item.clr_stone_wt || 0), pcs: String(item.clr_stone_pcs || 0), rate: '3500', category: 'Stone' }
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

  const [calcData, setCalcData] = useState(getInitialCalcData);
  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>(getInitialStones);

  useEffect(() => { fetchData(); }, []);

  // Update rates when stones or master list changes
  useEffect(() => {
    if (stoneMaster.length > 0 && dynamicStones.length > 0) {
      const updated = dynamicStones.map(s => {
        const dRate = getDynamicRate(s.label, num(s.weight), num(s.pcs), stoneMaster);
        return dRate ? { ...s, rate: String(dRate) } : s;
      });
      // Check for actual changes to prevent render loop
      const hasChanges = updated.some((s, idx) => s.rate !== dynamicStones[idx].rate);
      if (hasChanges) {
        setDynamicStones(updated);
      }
    }
  }, [stoneMaster, dynamicStones]);

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

  // CALCULATIONS
  const totalStoneCarats = dynamicStones.reduce((acc, s) => acc + num(s.weight), 0);
  const diamondCarats = dynamicStones
    .filter(s => {
      const label = s.label.toLowerCase();
      // Combine BOTH RD and SHAPE for certification charges
      return label.includes('diamond') || label.includes('vvs') || label.includes('ef') || label.includes('rd') || label.includes('shape');
    })
    .reduce((acc, s) => acc + num(s.weight), 0);

  const netWtFromDb = num(calcData.net_wt);
  const billingWt = netWtFromDb * (1 + (num(calcData.wastage_pct) / 100));
  const goldValue = billingWt * goldRate;
  
  const stonesTotal = dynamicStones.reduce((acc, s) => acc + (num(s.weight) === 0 ? num(s.pcs) * num(s.rate) : num(s.weight) * num(s.rate)), 0);
  const certCharges = diamondCarats * num(calcData.cert_rate);
  const makingGoldAmt = netWtFromDb * num(calcData.making_gold_rate);
  
  const subTotal = goldValue + stonesTotal + makingGoldAmt + certCharges;
  const totalINR = subTotal * (1 + (num(calcData.tax_pct) / 100));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><X size={isTablet ? 28 : 20} color="#1e293b" /></TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <CalcIcon size={isTablet ? 24 : 18} color="#6366f1" />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 20 : 16 }]}>Bill Estimator</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}><RefreshCw size={isTablet ? 24 : 18} color="#6366f1" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoWrapper, isTablet && styles.infoWrapperTablet]}>
          <View style={[styles.infoCard, isTablet && { flex: 1, marginBottom: 0 }]}>
            <View style={styles.infoRow}>
              <View style={styles.skuBadge}><Text style={styles.skuText}>SKU: {item.sku || 'NEW'}</Text></View>
              <TouchableOpacity style={styles.purityBadge} onPress={() => setCalcData({...calcData, purity: calcData.purity === '18KT' ? '22KT' : '18KT'})}>
                <Text style={styles.purityText}>{calcData.purity}</Text>
                <ChevronDown size={10} color="#7c3aed" />
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
            onSubValueChange={(v: any) => setCalcData({...calcData, wastage_pct: v})}
            weight={formatNum(netWtFromDb)} 
            subWeight={`+ ${formatNum(billingWt - netWtFromDb)}g`}
            rate={goldRate} 
            amount={formatNum(goldValue)} 
            onWeightChange={(v: any) => setCalcData({...calcData, net_wt: v})}
            bg="#f0f9ff" 
            labelColor="#0369a1"
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
                const newRate = getDynamicRate(s.label, num(v), num(s.pcs), stoneMaster);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, weight: v, rate: newRate ? String(newRate) : ds.rate} : ds));
              }} 
              onPcsChange={(v: any) => {
                const newRate = getDynamicRate(s.label, num(s.weight), num(v), stoneMaster);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, pcs: v, rate: newRate ? String(newRate) : ds.rate} : ds));
              }} 
              onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v} : ds))} 
              bg={idx % 2 === 0 ? "#fff" : "#f8fafc"} 
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
              bg="#fdf2f8" 
              labelColor="#be185d"
              isTablet={isTablet} 
            />
          )}
          
          <View style={styles.tableDivider} />

          <SpreadsheetRow 
            label="Labour Charges" 
            weight={formatNum(netWtFromDb)} 
            rate={calcData.making_gold_rate} 
            amount={formatNum(makingGoldAmt)} 
            onRateChange={(v: any) => setCalcData({...calcData, making_gold_rate: v})} 
            bg="#fffbeb" 
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
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 8, backgroundColor: '#f8fafc' },
  headerTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  refreshBtn: { padding: 8 },
  scrollContent: { padding: 12 },
  infoWrapper: { marginBottom: 12 },
  infoWrapperTablet: { flexDirection: 'row', alignItems: 'stretch' },
  infoCard: { backgroundColor: '#fff', padding: 15, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  skuBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4 },
  skuText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  purityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 4, gap: 4, borderWidth: 1, borderColor: '#ddd6fe' },
  purityText: { fontSize: 11, fontWeight: '800', color: '#7c3aed' },
  itemName: { fontWeight: '900', color: '#1e293b' },
  grossSection: { backgroundColor: '#064e3b', padding: 15, marginBottom: 12 },
  grossLabel: { fontSize: 10, fontWeight: '800', color: '#34d399', marginBottom: 2, letterSpacing: 1 },
  grossInput: { color: '#fff', padding: 0 },
  tableContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  ssRow: { flexDirection: 'row', alignItems: 'center' },
  ssCell: { height: '100%', justifyContent: 'center', paddingHorizontal: 8 },
  headerLabel: { fontWeight: '900', color: '#f8fafc', letterSpacing: 0.5 },
  ssLabel: { fontWeight: '800' },
  ssText: { color: '#1e293b' },
  ssInput: { color: '#1e293b', padding: 0, height: '100%' },
  tableDivider: { height: 1, backgroundColor: '#e2e8f0' },
  summaryContainer: { backgroundColor: '#0f172a', padding: 20 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  summaryValue: { color: '#fff' },
  gstInput: { color: '#6366f1', fontSize: 13, backgroundColor: '#ffffff15', paddingHorizontal: 8, paddingVertical: 2, minWidth: 40, textAlign: 'center' },
  finalTotalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#ffffff20' },
  finalTotalLabel: { color: '#f59e0b', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  finalTotalValue: { color: '#fff' }
});
