import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, SafeAreaView, ScrollView } from 'react-native';
import { X, IndianRupee, RefreshCw, ChevronDown, Plus, Trash2, Calculator as CalcIcon } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface MasterRate { key: string; value: number; }
interface StoneMaster { id: string; name: string; category: string; rate: number; }
interface DynamicStone { id: string; label: string; weight: string; pcs: string; rate: string; category: string; }

const num = (val: string | number) => parseFloat(String(val)) || 0;

const StonePickerModal = ({ isVisible, onClose, onSelect, stones, category }: any) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const [search, setSearch] = useState('');
  const filteredStones = stones.filter((s: any) => 
    (s.category.toLowerCase() === category?.toLowerCase() || !category) &&
    (s.name.toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerContent, { width: isTablet ? '60%' : '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Stone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <TextInput 
            style={styles.compactSearch} 
            placeholder="Search stone name..." 
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filteredStones}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => { onSelect(item); onClose(); }}>
                <View>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  <Text style={styles.pickerItemSub}>{item.category} • ₹{item.rate}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const SpreadsheetRow = ({ label, weight, pcs, rate, amount, onWeightChange, onPcsChange, onRateChange, onLabelPress, onRemove, editable = true, bg = '#fff', labelColor = '#1e293b', isHeader = false, isTablet }: any) => {
  const fontSize = isTablet ? 18 : 12;
  const headerFontSize = isTablet ? 14 : 10;
  const rowHeight = isHeader ? (isTablet ? 50 : 35) : (isTablet ? 65 : 45);

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
      <View style={[styles.ssCell, { flex: 1.8, flexDirection: 'row', alignItems: 'center' }]}>
        {onRemove && <TouchableOpacity onPress={onRemove} style={styles.removeBtn}><Trash2 size={isTablet ? 18 : 14} color="#ef4444" /></TouchableOpacity>}
        <TouchableOpacity style={{ flex: 1 }} onPress={onLabelPress} disabled={!onLabelPress}>
          <View style={styles.labelWrapper}>
            <Text style={[styles.ssLabel, { color: labelColor, fontSize: fontSize }]} numberOfLines={1}>{label}</Text>
            {onLabelPress && <ChevronDown size={isTablet ? 16 : 12} color="#94a3b8" />}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Weight (CT/WT) */}
      <View style={[styles.ssCell, { flex: 0.8, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center' }]} 
            value={String(weight || '')} 
            onChangeText={onWeightChange} 
            keyboardType="numeric" 
            placeholder="0.00"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center' }]}>{weight}</Text>
        )}
      </View>

      {/* PCS */}
      <View style={[styles.ssCell, { flex: 0.6, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onPcsChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', color: '#6366f1', fontWeight: '700', textAlign: 'center' }]} 
            value={String(pcs || '')} 
            onChangeText={onPcsChange} 
            keyboardType="numeric"
            placeholder="P"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center' }]}>{pcs || '-'}</Text>
        )}
      </View>

      {/* Rate */}
      <View style={[styles.ssCell, { flex: 1.1, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
        {editable && onRateChange ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center' }]} 
            value={String(rate || '')} 
            onChangeText={onRateChange} 
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#cbd5e1"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center' }]}>{rate ? rate.toLocaleString('en-IN') : '-'}</Text>
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
  const [showPicker, setShowPicker] = useState({ visible: false, category: '', targetId: '' });
  const [goldRate, setGoldRate] = useState(0);
  const [rateMap, setRateMap] = useState<any>({});
  
  const [calcData, setCalcData] = useState({
    gross_wt: String(item.gross_wt || 0),
    net_wt: String(item.net_wt || 0),
    making_gold_rate: '550',
    wastage_pct: String(item.wastage || '5.77'),
    tax_pct: '3',
    purity: item.purity || '18KT',
    name: item.name || 'Product',
  });

  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>(() => {
    try {
      if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
        const parsed = JSON.parse(item.stones_in_detail);
        return parsed.map((s: any) => ({
          id: s.id || Math.random().toString(36).substr(2, 9),
          label: s.name || 'Stone',
          weight: String(s.weight || 0),
          pcs: String(s.pcs || 0),
          rate: String(s.rate || 0),
          category: s.category || 'Stone'
        }));
      }
    } catch (e) {}
    return [
      { id: 'd1', label: 'Diamond', weight: String(item.dai_wt || 0), pcs: String(item.dai_pcs || 0), rate: '65000', category: 'Diamond' },
      { id: 's1', label: 'Color Stone', weight: String(item.clr_stone_wt || 0), pcs: String(item.clr_stone_pcs || 0), rate: '3500', category: 'Stone' }
    ];
  });

  useEffect(() => { fetchData(); }, []);

  // Update gold rate when purity or rateMap changes
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
      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*')
      ]);
      if (ratesRes.error || stonesRes.error) throw new Error('Fetch failed');
      setStoneMaster(stonesRes.data);
      
      const newRateMap: any = {};
      ratesRes.data?.forEach(r => { newRateMap[r.key] = r.value; });
      setRateMap(newRateMap);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const addStoneRow = () => {
    setDynamicStones([...dynamicStones, { id: Math.random().toString(36).substr(2, 9), label: 'New Stone', weight: '0', pcs: '0', rate: '0', category: 'Stone' }]);
  };

  const formatNum = (v: number) => v.toLocaleString('en-IN');

  const goldValue = num(calcData.net_wt) * goldRate;
  const makingGold = num(calcData.net_wt) * num(calcData.making_gold_rate);
  const wastageCharge = goldValue * (num(calcData.wastage_pct) / 100);
  const stonesTotal = dynamicStones.reduce((acc, s) => acc + (num(s.weight) === 0 ? num(s.pcs) * num(s.rate) : num(s.weight) * num(s.rate)), 0);
  const subTotal = goldValue + stonesTotal + makingGold + wastageCharge;
  const totalINR = subTotal + (subTotal * (num(calcData.tax_pct) / 100));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <X size={isTablet ? 32 : 24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <CalcIcon size={isTablet ? 28 : 20} color="#6366f1" />
          <Text style={[styles.headerTitle, { fontSize: isTablet ? 24 : 18 }]}>Bill Estimator</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
          <RefreshCw size={isTablet ? 28 : 20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Responsive Info Section */}
        <View style={[styles.infoWrapper, isTablet && styles.infoWrapperTablet]}>
          <View style={[styles.infoCard, isTablet && { flex: 1, marginBottom: 0 }]}>
            <View style={styles.infoRow}>
              <View style={styles.skuBadge}><Text style={styles.skuText}>SKU: {item.sku || 'NEW'}</Text></View>
              <TouchableOpacity 
                style={styles.purityBadge} 
                onPress={() => setCalcData({...calcData, purity: calcData.purity === '18KT' ? '22KT' : '18KT'})}
              >
                <Text style={styles.purityText}>{calcData.purity}</Text>
                <ChevronDown size={12} color="#7c3aed" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.itemName, { fontSize: isTablet ? 28 : 20 }]} numberOfLines={1}>{calcData.name}</Text>
          </View>

          <View style={[styles.grossSection, isTablet && { flex: 0.8, marginBottom: 0, marginLeft: 16 }]}>
            <Text style={styles.grossLabel}>GROSS WEIGHT (G)</Text>
            <TextInput 
              style={[styles.grossInput, { fontSize: isTablet ? 48 : 32 }]} 
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
            weight={calcData.net_wt} 
            rate={goldRate} 
            amount={formatNum(goldValue)} 
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
              onWeightChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, weight: v} : ds))} 
              onPcsChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, pcs: v} : ds))} 
              onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v} : ds))} 
              onLabelPress={() => setShowPicker({ visible: true, category: s.category, targetId: s.id })} 
              onRemove={idx > 1 ? () => setDynamicStones(dynamicStones.filter(ds => ds.id !== s.id)) : null}
              bg={idx % 2 === 0 ? "#fff" : "#f8fafc"} 
              isTablet={isTablet} 
            />
          ))}

          <TouchableOpacity style={styles.addRowBtn} onPress={addStoneRow}>
            <Plus size={isTablet ? 20 : 16} color="#6366f1" />
            <Text style={[styles.addRowText, { fontSize: isTablet ? 16 : 13 }]}>Add Particular Row</Text>
          </TouchableOpacity>
          
          <View style={styles.tableDivider} />

          <SpreadsheetRow label="Labour Charges" weight={calcData.net_wt} rate={calcData.making_gold_rate} amount={formatNum(makingGold)} onRateChange={(v: any) => setCalcData({...calcData, making_gold_rate: v})} bg="#fffbeb" isTablet={isTablet} />
          <SpreadsheetRow label="Wastage (%)" weight={calcData.wastage_pct} amount={formatNum(wastageCharge)} onWeightChange={(v: any) => setCalcData({...calcData, wastage_pct: v})} bg="#fffbeb" isTablet={isTablet} />
          
          {/* Detailed Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Sub-Total Value</Text>
              <Text style={styles.summaryValue}>₹{formatNum(subTotal)}</Text>
            </View>
            <View style={styles.summaryLine}>
              <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                <Text style={styles.summaryLabel}>GST (%)</Text>
                <TextInput 
                  style={styles.gstInput} 
                  value={calcData.tax_pct} 
                  onChangeText={(v) => setCalcData({...calcData, tax_pct: v})}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.summaryValue}>₹{formatNum(subTotal * (num(calcData.tax_pct) / 100))}</Text>
            </View>
            <View style={styles.finalTotalLine}>
              <Text style={styles.finalTotalLabel}>TOTAL ESTIMATE</Text>
              <Text style={styles.finalTotalValue}>₹{formatNum(totalINR)}</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <StonePickerModal 
        isVisible={showPicker.visible} 
        onClose={() => setShowPicker({ ...showPicker, visible: false })} 
        category={showPicker.category} 
        stones={stoneMaster} 
        onSelect={(s: any) => setDynamicStones(dynamicStones.map(ds => ds.id === showPicker.targetId ? { ...ds, label: s.name, rate: String(s.rate), category: s.category } : ds))} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 12 },
  headerTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  refreshBtn: { padding: 10 },
  scrollContent: { padding: 16 },
  infoWrapper: { marginBottom: 16 },
  infoWrapperTablet: { flexDirection: 'row', alignItems: 'stretch' },
  infoCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  skuBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  skuText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  purityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#ddd6fe' },
  purityText: { fontSize: 13, fontWeight: '800', color: '#7c3aed' },
  itemName: { fontWeight: '900', color: '#1e293b' },
  grossSection: { backgroundColor: '#064e3b', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 5 },
  grossLabel: { fontSize: 12, fontWeight: '800', color: '#34d399', marginBottom: 5, letterSpacing: 1.5 },
  grossInput: { fontWeight: '900', color: '#fff', padding: 0 },
  tableContainer: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  ssRow: { flexDirection: 'row', alignItems: 'center' },
  ssCell: { height: '100%', justifyContent: 'center', paddingHorizontal: 12 },
  headerLabel: { fontWeight: '900', color: '#f8fafc', letterSpacing: 1 },
  labelWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  ssLabel: { fontWeight: '700' },
  ssText: { fontWeight: '700', color: '#1e293b' },
  ssInput: { fontWeight: '800', color: '#1e293b', padding: 0, height: '100%' },
  inputCellGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, height: '100%' },
  cellDivider: { width: 1, height: '40%', backgroundColor: '#e2e8f0', marginHorizontal: 8 },
  removeBtn: { marginRight: 10, padding: 5 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  addRowText: { fontWeight: '800', color: '#6366f1' },
  tableDivider: { height: 2, backgroundColor: '#e2e8f0' },
  summaryContainer: { backgroundColor: '#0f172a', padding: 25 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  summaryLabel: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  gstInput: { color: '#6366f1', fontSize: 16, fontWeight: '900', backgroundColor: '#ffffff15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, minWidth: 50, textAlign: 'center' },
  finalTotalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#ffffff20' },
  finalTotalLabel: { color: '#f59e0b', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  finalTotalValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: 32, padding: 24, maxHeight: '85%', elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
  compactSearch: { backgroundColor: '#f8fafc', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 15, fontSize: 18, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerItem: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemText: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  pickerItemSub: { fontSize: 14, color: '#64748b', marginTop: 6 }
});
