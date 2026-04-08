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
  if (n.includes('VVS') || n.includes('EF') || n.includes('RD') || n === 'DIAMOND') return 'Diamond';
  return name;
};

const getDynamicRate = (label: string, weight: number, pcs: number, master: any[]) => {
  const normalizedLabel = label.toLowerCase().trim();
  const w = num(weight);
  const p = num(pcs);
  if (w === 0 || p === 0 || !master || master.length === 0) return null;
  
  const avgSize = w / p;
  
  const matches = master.filter(s => {
    const masterName = s.name.toLowerCase().trim();
    const masterCat = s.category.toLowerCase().trim();
    const masterSubCat = (s.sub_category || '').toLowerCase().trim();
    
    const isNameMatch = masterName.includes(normalizedLabel) || normalizedLabel.includes(masterName);
    const isCatMatch = masterCat === normalizedLabel;
    
    return (isNameMatch || isCatMatch) &&
           avgSize >= num(s.min_wt) &&
           avgSize <= num(s.max_wt);
  });

  if (matches.length === 0) return null;

  // If label is "Diamond", prioritize sub_category "RD" (VVS-EF-RD)
  if (normalizedLabel === 'diamond') {
    const rdMatch = matches.find(m => (m.sub_category || '').toUpperCase().trim() === 'RD');
    if (rdMatch) return rdMatch.rate;
  }

  // Fallback: Sort by range width (most specific slab)
  matches.sort((a, b) => (num(a.max_wt) - num(a.min_wt)) - (num(b.max_wt) - num(b.min_wt)));
  
  let rate = matches[0].rate;
  
  // Apply ₹1000 discount for Emerald or Ruby varieties
  if (normalizedLabel.includes('emerald') || normalizedLabel.includes('ruby')) {
    rate = num(rate) - 1000;
  }
  
  return rate;
};

const SpreadsheetRow = ({ label, subLabel, weight, subWeight, pcs, rate, amount, onWeightChange, onPcsChange, onRateChange, editable = true, bg = '#fff', labelColor = '#1e293b', isHeader = false, isTablet, showSubInput, subValue, onSubValueChange }: any) => {
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
      {/* Particulars */}
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
      
      {/* Weight (CT/WT) */}
      <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(weight || '')} 
            onChangeText={onWeightChange} 
            keyboardType="numeric" 
            placeholder="0.00"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{weight}</Text>
        )}
        {subWeight && <Text style={{ fontSize: fontSize - 1, width: '100%', textAlign: 'center', fontWeight: '800', color: '#10b981', marginTop: 2 }}>+ {subWeight}</Text>}
      </View>

      {/* PCS */}
      <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onPcsChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', color: '#6366f1', fontWeight: '800', textAlign: 'center' }]} 
            value={String(pcs || '')} 
            onChangeText={onPcsChange} 
            keyboardType="numeric"
            placeholder="P"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{pcs || '-'}</Text>
        )}
      </View>

      {/* Rate */}
      <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onRateChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]} 
            value={String(rate || '')} 
            onChangeText={onRateChange} 
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800' }]}>{rate ? rate.toLocaleString('en-IN') : '-'}</Text>
        )}
      </View>
      
      {/* Amount */}
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
      net_wt: '0',
      labour_wt: '0',
      cert_wt: '0',
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
          { id: 'd1', name: 'Diamond', weight: String(item.dai_wt || 0), pcs: String(item.dai_pcs || 0), rate: '65000', category: 'Diamond' },
          { id: 's1', name: 'Color Stone', weight: String(item.clr_stone_wt || 0), pcs: String(item.clr_stone_pcs || 0), rate: '3500', category: 'Stone' }
        ];
      }
    } catch (e) {
      stones = [];
    }

    return stones.map((s: any) => {
      const renamedLabel = renameStone(s.name || s.label || 'Stone');
      return {
        id: s.id || Math.random().toString(36).substr(2, 9),
        label: renamedLabel,
        weight: String(s.weight || 0),
        pcs: String(s.pcs || 0),
        rate: String(s.rate || 0),
        category: s.category || 'Stone'
      };
    });
  };

  const [calcData, setCalcData] = useState(getInitialCalcData);
  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>(getInitialStones);

  // Smart Defaults: Update weights automatically when Gross or Stones change
  useEffect(() => {
    const totalStoneCarats = dynamicStones.reduce((acc, s) => acc + num(s.weight), 0);
    const diamondCarats = dynamicStones
      .filter(s => s.label.toLowerCase() === 'diamond')
      .reduce((acc, s) => acc + num(s.weight), 0);
    
    const newNetWt = num(calcData.gross_wt) - (totalStoneCarats / 5);

    setCalcData(prev => ({
      ...prev,
      net_wt: newNetWt.toFixed(3),
      labour_wt: newNetWt.toFixed(3),
      cert_wt: diamondCarats.toFixed(3)
    }));
  }, [calcData.gross_wt, dynamicStones, calcData.wastage_pct]);

  useEffect(() => { fetchData(); }, []);

  // Update rates once stoneMaster is loaded
  useEffect(() => {
    if (stoneMaster.length > 0) {
      setDynamicStones(prev => prev.map(s => {
        const dRate = getDynamicRate(s.label, num(s.weight), num(s.pcs), stoneMaster);
        return dRate ? { ...s, rate: String(dRate) } : s;
      }));
    }
  }, [stoneMaster]);

  useEffect(() => {
    if (Object.keys(rateMap).length > 0) {
      let currentRate = 0;
      const p = calcData.purity.toLowerCase();
      if (p.includes('24')) currentRate = rateMap.gold_24kt || 0;
      else if (p.includes('22')) currentRate = rateMap.gold_22kt || 0;
      else currentRate = rateMap.gold_18kt || 0;
      
      setGoldRate(currentRate);
    }
  }, [calcData.purity, rateMap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // RESET VALUES TO DEFAULT ON RELOAD
      setCalcData(getInitialCalcData());
      setDynamicStones(getInitialStones());

      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*')
      ]);
      if (ratesRes.error || stonesRes.error) throw new Error('Fetch failed');
      
      // Update state with fetched data
      setStoneMaster(stonesRes.data || []);
      
      const newRateMap: any = {};
      ratesRes.data?.forEach(r => { newRateMap[r.key] = r.value; });
      setRateMap(newRateMap);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const formatNum = (v: number) => {
    if (v === 0) return '0';
    // Match the user's precision from the example
    return v.toLocaleString('en-IN', { maximumFractionDigits: 3, minimumFractionDigits: 0 });
  };

  const totalStoneCarats = dynamicStones.reduce((acc, s) => acc + num(s.weight), 0);
  const totalDiamondCarats = dynamicStones
    .filter(s => s.label.toLowerCase() === 'diamond')
    .reduce((acc, s) => acc + num(s.weight), 0);
  const certCharges = totalDiamondCarats * 950;

  const calculatedNetWt = num(calcData.gross_wt) - (totalStoneCarats / 5);
  const billingWt = calculatedNetWt * (1 + (num(calcData.wastage_pct) / 100));
  
  const goldValueWithWastage = billingWt * goldRate;
  const stonesTotal = dynamicStones.reduce((acc, s) => acc + (num(s.weight) === 0 ? num(s.pcs) * num(s.rate) : num(s.weight) * num(s.rate)), 0);
  const makingGoldAmt = calculatedNetWt * num(calcData.making_gold_rate);
  
  const subTotal = goldValueWithWastage + stonesTotal + makingGoldAmt + certCharges;
  const totalINR = subTotal + (subTotal * (num(calcData.tax_pct) / 100));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <X size={isTablet ? 28 : 20} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <CalcIcon size={isTablet ? 24 : 18} color="#6366f1" />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 20 : 16 }]}>Bill Estimator</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <RefreshCw size={isTablet ? 24 : 18} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Info Section */}
        <View style={[styles.infoWrapper, isTablet && styles.infoWrapperTablet]}>
          <View style={[styles.infoCard, isTablet && { flex: 1, marginBottom: 0 }]}>
            <View style={styles.infoRow}>
              <View style={styles.skuBadge}><Text style={styles.skuText}>SKU: {item.sku || 'NEW'}</Text></View>
              <TouchableOpacity 
                style={styles.purityBadge} 
                onPress={() => setCalcData({...calcData, purity: calcData.purity === '18KT' ? '22KT' : '18KT'})}
              >
                <Text style={styles.purityText}>{calcData.purity}</Text>
                <ChevronDown size={10} color="#7c3aed" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.itemName, { fontSize: isTablet ? 22 : 16 }]} numberOfLines={1}>{calcData.name}</Text>
          </View>

          <View style={[styles.grossSection, isTablet && { flex: 0.8, marginBottom: 0, marginLeft: 16 }]}>
            <Text style={styles.grossLabel}>GROSS WEIGHT (G)</Text>
            <TextInput 
              style={[styles.grossInput, { fontSize: isTablet ? 32 : 24, fontWeight: '900' }]} 
              value={calcData.gross_wt} 
              onChangeText={(v) => setCalcData({...calcData, gross_wt: v})} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        {/* Spreadsheet Table */}
        <View style={styles.tableContainer}>
          <SpreadsheetRow isHeader isTablet={isTablet} />
          
          <SpreadsheetRow 
            label="GOLD (NET WT)" 
            subLabel="Wastage"
            showSubInput={true}
            subValue={calcData.wastage_pct}
            onSubValueChange={(v: any) => setCalcData({...calcData, wastage_pct: v})}
            weight={calcData.net_wt} 
            pcs=""
            rate={goldRate} 
            amount={formatNum(goldValueWithWastage)} 
            onWeightChange={(v: any) => setCalcData({...calcData, net_wt: v})}
            onRateChange={(v: any) => setGoldRate(num(v))}
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
                const newStones = dynamicStones.map(ds => {
                  if (ds.id === s.id) {
                    const dynamicRate = getDynamicRate(ds.label, num(v), num(ds.pcs), stoneMaster);
                    return {...ds, weight: v, rate: dynamicRate ? String(dynamicRate) : ds.rate};
                  }
                  return ds;
                });
                setDynamicStones(newStones);
              }} 
              onPcsChange={(v: any) => {
                const newStones = dynamicStones.map(ds => {
                  if (ds.id === s.id) {
                    const dynamicRate = getDynamicRate(ds.label, num(ds.weight), num(v), stoneMaster);
                    return {...ds, pcs: v, rate: dynamicRate ? String(dynamicRate) : ds.rate};
                  }
                  return ds;
                });
                setDynamicStones(newStones);
              }} 
              onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v} : ds))} 
              bg={idx % 2 === 0 ? "#fff" : "#f8fafc"} 
              isTablet={isTablet} 
            />
          ))}
          
          {num(calcData.cert_wt) > 0 && (
            <SpreadsheetRow 
              label="Certification Charges" 
              weight={calcData.cert_wt} 
              rate={calcData.cert_rate} 
              amount={formatNum(num(calcData.cert_wt) * num(calcData.cert_rate))} 
              onWeightChange={(v: any) => setCalcData({...calcData, cert_wt: v})}
              onRateChange={(v: any) => setCalcData({...calcData, cert_rate: v})}
              bg="#fdf2f8" 
              labelColor="#be185d"
              isTablet={isTablet} 
            />
          )}
          
          <View style={styles.tableDivider} />

          <SpreadsheetRow 
            label="Labour Charges" 
            weight={calcData.labour_wt} 
            rate={calcData.making_gold_rate} 
            amount={formatNum(num(calcData.labour_wt) * num(calcData.making_gold_rate))} 
            onWeightChange={(v: any) => setCalcData({...calcData, labour_wt: v})}
            onRateChange={(v: any) => setCalcData({...calcData, making_gold_rate: v})} 
            bg="#fffbeb" 
            isTablet={isTablet} 
          />
          
          {/* Detailed Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Sub-Total Value</Text>
              <Text style={[styles.summaryValue, { fontWeight: '800', fontSize: isTablet ? 18 : 14 }]}>₹{formatNum(subTotal)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                <Text style={styles.summaryLabel}>GST (%)</Text>
                <TextInput 
                  style={[styles.gstInput, { fontWeight: '800' }]} 
                  value={calcData.tax_pct} 
                  onChangeText={(v) => setCalcData({...calcData, tax_pct: v})}
                  keyboardType="numeric"
                />
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
  labelWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
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
