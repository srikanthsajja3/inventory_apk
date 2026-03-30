import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { X, IndianRupee, RefreshCw, ChevronDown, TrendingUp, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';

interface MasterRate {
  key: string;
  value: number;
}

interface StoneMaster {
  id: string;
  name: string;
  category: string;
  rate: number;
}

interface DynamicStone {
  id: string;
  label: string;
  weight: string;
  rate: string;
  category: 'Stone' | 'Beads' | 'Diamond';
}

const num = (val: string | number) => parseFloat(String(val)) || 0;

const StonePickerModal = ({ isVisible, onClose, onSelect, stones, category }: any) => {
  const [search, setSearch] = useState('');
  const filteredStones = stones.filter((s: any) => 
    (s.category.toLowerCase() === category.toLowerCase() || !category) &&
    (s.name.toLowerCase().includes(search.toLowerCase()))
  );
  const uniqueStones = Array.from(new Set(filteredStones.map((s: any) => s.name)))
    .map(name => filteredStones.find((s: any) => s.name === name));

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {category}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="#64748b" /></TouchableOpacity>
          </View>
          <TextInput 
            style={styles.compactSearch} 
            placeholder="Search..." 
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={uniqueStones}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.pickerItemText}>{item.name} <Text style={{fontWeight:'400', fontSize:10}}>₹{item.rate}</Text></Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const SpreadsheetRow = ({ label, weight, rate, amount, onWeightChange, onRateChange, onLabelPress, onRemove, editable = true, bg = '#fff', labelColor = '#1e293b', isTablet, unit = "" }: any) => {
  const fontSize = isTablet ? 13 : 10;
  const rowHeight = isTablet ? 40 : 28;

  return (
    <View style={[styles.ssRow, { backgroundColor: bg, height: rowHeight }]}>
      <View style={[styles.ssCell, { flex: 1.4, borderRightWidth: 1, flexDirection: 'row', alignItems: 'center' }]}>
        {onRemove && <TouchableOpacity onPress={onRemove} style={{ marginRight: 2 }}><Trash2 size={10} color="#ef4444" /></TouchableOpacity>}
        <TouchableOpacity style={{ flex: 1 }} onPress={onLabelPress} disabled={!onLabelPress}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.ssLabel, { color: labelColor, fontSize: fontSize }]} numberOfLines={1}>{label}</Text>
            {onLabelPress && <ChevronDown size={8} color={labelColor} opacity={0.5} />}
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.ssCell, { flex: 1, borderRightWidth: 1, flexDirection: 'row' }]}>
        {editable ? (
          <TextInput style={[styles.ssInput, { fontSize: fontSize, flex: 1 }]} value={String(weight)} onChangeText={onWeightChange} keyboardType="numeric" selectTextOnFocus />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize }]}>{weight}</Text>
        )}
        {unit ? <Text style={{fontSize: fontSize - 2, color: '#94a3b8'}}>{unit}</Text> : null}
      </View>
      <View style={[styles.ssCell, { flex: 1.2, borderRightWidth: 1 }]}>
        {editable && onRateChange ? (
          <TextInput style={[styles.ssInput, { fontSize: fontSize }]} value={String(rate)} onChangeText={onRateChange} keyboardType="numeric" selectTextOnFocus />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize }]}>{rate}</Text>
        )}
      </View>
      <View style={[styles.ssCell, { flex: 1.6 }]}>
        <Text style={[styles.ssText, { textAlign: 'right', fontWeight: '900', fontSize: fontSize }]} numberOfLines={1}>{amount}</Text>
      </View>
    </View>
  );
};

export default function EstimationScreen({ route, navigation }: any) {
  const { item } = route.params;
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const [loading, setLoading] = useState(true);
  const [stoneMaster, setStoneMaster] = useState<StoneMaster[]>([]);
  const [showPicker, setShowPicker] = useState({ visible: false, category: '', targetId: '' });
  
  const [calcData, setCalcData] = useState({
    gross_wt: String(item.gross_wt || 0),
    net_wt: String(item.net_wt || 0),
    making_gold_rate: '550',
    making_diamond_rate: '1200',
    wastage_pct: String(item.wastage || '5.77'),
    igi_wt: String(item.igi_wt || '0'),
    igi_fee: String(item.igi_fee || '0'),
    tax_pct: '3',
    purity: item.purity || '18KT',
    name: item.name || 'Product',
    category_id: '33',
  });

  const [goldRate, setGoldRate] = useState(7201.76);
  const [dynamicStones, setDynamicStones] = useState<DynamicStone[]>([
    { id: 'd1', label: 'D.Rd', weight: String(item.dai_rd || 0), rate: '65000', category: 'Diamond' },
    { id: 'd2', label: 'D.PEAR', weight: String(item.dai_pear || 0), rate: '125000', category: 'Diamond' },
    { id: 's1', label: 'Stone', weight: String(item.clr_stone_wt || 0), rate: '2500', category: 'Stone' }
  ]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*')
      ]);
      if (ratesRes.error || stonesRes.error) throw new Error('Fetch failed');
      setStoneMaster(stonesRes.data);
      const goldRateKey = calcData.purity.includes('22') ? 'gold_22kt' : 'gold_18kt';
      setGoldRate(ratesRes.data.find((r: MasterRate) => r.key === goldRateKey)?.value || 7201.76);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const addStoneRow = () => {
    setDynamicStones([...dynamicStones, { id: Math.random().toString(36).substr(2, 9), label: 'New', weight: '0', rate: '0', category: 'Stone' }]);
  };

  const goldValue = num(calcData.net_wt) * goldRate;
  const diamondWeightGrams = dynamicStones.filter(s => s.category === 'Diamond').reduce((acc, s) => acc + num(s.weight), 0) * 0.2; 
  const makingGold = num(calcData.net_wt) * num(calcData.making_gold_rate);
  const makingDiamond = diamondWeightGrams * num(calcData.making_diamond_rate);
  const wastageCharge = goldValue * (num(calcData.wastage_pct) / 100);
  const igiFee = num(calcData.igi_fee);
  const componentsTotal = goldValue + dynamicStones.reduce((acc, s) => acc + (num(s.weight) * num(s.rate)), 0);
  const subTotal = componentsTotal + makingGold + makingDiamond + wastageCharge + igiFee;
  const totalINR = subTotal + (subTotal * (num(calcData.tax_pct) / 100));

  const format = (val: number) => val.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  if (loading) return <View style={styles.center}><ActivityIndicator color="#6366f1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}><X size={20} color="#1e293b" /></TouchableOpacity>
        <Text style={styles.compactTitle}>Estimator</Text>
        <TouchableOpacity onPress={fetchData}><RefreshCw size={18} color="#6366f1" /></TouchableOpacity>
      </View>

      <View style={styles.compactInfoRow}>
        <View style={styles.infoBadge}><Text style={styles.badgeText}>CAT {calcData.category_id}</Text></View>
        <TouchableOpacity style={styles.puritySmall} onPress={() => setCalcData({...calcData, purity: calcData.purity === '18KT' ? '22KT' : '18KT'})}>
          <Text style={styles.puritySmallText}>{calcData.purity}</Text>
        </TouchableOpacity>
        <Text style={styles.itemNameSmall} numberOfLines={1}>{calcData.name}</Text>
        <View style={styles.totalBadge}><Text style={styles.totalBadgeText}>₹{format(totalINR)}</Text></View>
      </View>

      <View style={styles.grossCompact}>
        <Text style={styles.grossLabel}>GROSS WT</Text>
        <TextInput style={styles.grossInput} value={calcData.gross_wt} onChangeText={(v) => setCalcData({...calcData, gross_wt: v})} keyboardType="numeric" />
      </View>

      <View style={styles.spreadsheetContainer}>
        <SpreadsheetRow label="N.WT (GOLD)" weight={calcData.net_wt} rate={goldRate} amount={format(goldValue)} onWeightChange={(v: any) => setCalcData({...calcData, net_wt: v})} onRateChange={(v: any) => setGoldRate(num(v))} bg="#eff6ff" isTablet={isTablet} />
        
        {dynamicStones.map((s, idx) => (
          <SpreadsheetRow 
            key={s.id} label={s.label} weight={s.weight} rate={s.rate} amount={format(num(s.weight) * num(s.rate))} 
            onWeightChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, weight: v} : ds))} 
            onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v} : ds))} 
            onLabelPress={() => setShowPicker({ visible: true, category: s.category, targetId: s.id })} 
            onRemove={idx > 2 ? () => setDynamicStones(dynamicStones.filter(ds => ds.id !== s.id)) : null}
            bg={idx % 2 === 0 ? "#fff" : "#f8fafc"} isTablet={isTablet} 
          />
        ))}

        <TouchableOpacity style={styles.miniAddBtn} onPress={addStoneRow}><Plus size={12} color="#6366f1" /><Text style={styles.miniAddText}>Add Stone</Text></TouchableOpacity>
        
        <SpreadsheetRow label="Make(Gold)" weight={calcData.net_wt} unit="g" rate={calcData.making_gold_rate} amount={format(makingGold)} onRateChange={(v: any) => setCalcData({...calcData, making_gold_rate: v})} bg="#fff7ed" />
        <SpreadsheetRow label="Make(Diam)" weight={(diamondWeightGrams).toFixed(2)} unit="g" rate={calcData.making_diamond_rate} amount={format(makingDiamond)} onRateChange={(v: any) => setCalcData({...calcData, making_diamond_rate: v})} bg="#fff7ed" />
        <SpreadsheetRow label="Wastage" weight={calcData.wastage_pct} unit="%" rate="" amount={format(wastageCharge)} onWeightChange={(v: any) => setCalcData({...calcData, wastage_pct: v})} bg="#fff7ed" />
        <SpreadsheetRow label="IGI" weight={calcData.igi_wt} rate="" amount={format(igiFee)} onWeightChange={(v: any) => setCalcData({...calcData, igi_wt: v})} bg="#fff7ed" />
        
        <SpreadsheetRow label="Subtotal" weight="" rate="" amount={format(subTotal)} editable={false} bg="#2563eb" labelColor="#fff" isTablet={isTablet} />
        <SpreadsheetRow label="TAX" weight={calcData.tax_pct} unit="%" rate="" amount={format(subTotal * (num(calcData.tax_pct) / 100))} onWeightChange={(v: any) => setCalcData({...calcData, tax_pct: v})} bg="#dbeafe" isTablet={isTablet} />
        <SpreadsheetRow label="FINAL TOTAL" weight="" rate="" amount={format(totalINR)} editable={false} bg="#f59e0b" labelColor="#fff" isTablet={isTablet} />
      </View>

      <StonePickerModal isVisible={showPicker.visible} onClose={() => setShowPicker({ ...showPicker, visible: false })} category={showPicker.category} stones={stoneMaster} onSelect={(s: any) => setDynamicStones(dynamicStones.map(ds => ds.id === showPicker.targetId ? { ...ds, label: s.name, rate: String(s.rate), category: s.category } : ds))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  compactHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  compactTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  compactInfoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  infoBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  puritySmall: { backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#ddd6fe' },
  puritySmallText: { fontSize: 10, fontWeight: '900', color: '#7c3aed' },
  itemNameSmall: { flex: 1, fontSize: 11, fontWeight: '700', color: '#334155', marginLeft: 4 },
  totalBadge: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  totalBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  grossCompact: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', marginHorizontal: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 6 },
  grossLabel: { fontSize: 9, fontWeight: '900', color: '#059669', marginRight: 10 },
  grossInput: { fontSize: 16, fontWeight: '900', color: '#064e3b', flex: 1, padding: 0 },
  spreadsheetContainer: { backgroundColor: '#fff', marginHorizontal: 6, borderRadius: 12, elevation: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  ssRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  ssCell: { justifyContent: 'center', paddingHorizontal: 6, borderColor: '#f1f5f9' },
  ssLabel: { fontWeight: '800' },
  ssText: { color: '#0f172a', fontWeight: '700' },
  ssInput: { color: '#1e293b', fontWeight: '900', padding: 0 },
  miniAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  miniAddText: { fontSize: 10, fontWeight: '800', color: '#6366f1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { backgroundColor: '#fff', borderRadius: 16, padding: 12, width: '85%', maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 14, fontWeight: '900' },
  compactSearch: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, marginBottom: 10 },
  pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemText: { fontSize: 13, fontWeight: '700' }
});