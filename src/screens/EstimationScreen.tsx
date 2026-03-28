import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList } from 'react-native';
import { X, Scale, Tag, IndianRupee, Calculator, DollarSign, Info, RefreshCw, Repeat, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';

interface MasterRate {
  key: string;
  value: number;
  label: string;
  category: string;
}

interface StoneMaster {
  id: string;
  name: string;
  category: string;
  sub_category: string;
  min_wt: number;
  max_wt: number;
  rate: number;
}

interface CalculatedStone {
  id: string;
  type: string;
  weight: string;
  pcs: string;
  rate: string;
  category: string;
}

const num = (val: string | number) => parseFloat(String(val)) || 0;

const EditableRow = ({ label, value, onChange, unit, rate, onRateChange, showPcs, pcsValue, onPcsChange, slabValue }: any) => (
  <View style={styles.calcRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.editableInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>

    {showPcs && (
      <View style={{ flex: 0.6, marginLeft: 10 }}>
        <Text style={styles.label}>Pcs</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.editableInput}
            value={pcsValue}
            onChangeText={onPcsChange}
            keyboardType="numeric"
          />
        </View>
      </View>
    )}

    {slabValue !== undefined && (
      <View style={{ flex: 0.7, marginLeft: 10 }}>
        <Text style={styles.label}>Slab</Text>
        <View style={[styles.inputContainer, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
          <Text style={[styles.editableInput, { color: '#64748b' }]} numberOfLines={1}>{slabValue}</Text>
        </View>
      </View>
    )}
    
    {onRateChange !== undefined && (
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.rateLabelSmall}>Rate</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.editableInput}
            value={String(rate)}
            onChangeText={onRateChange}
            keyboardType="numeric"
          />
        </View>
      </View>
    )}
  </View>
);

const StonePickerModal = ({ isVisible, onClose, onSelect, stones, category }: any) => {
  const filteredStones = stones.filter((s: any) => s.category === category || !category);
  const uniqueNames = Array.from(new Set(filteredStones.map((s: any) => s.name)));

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {category}</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <FlatList
            data={uniqueNames}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.pickerItem} 
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={styles.pickerItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function EstimationScreen({ route, navigation }: any) {
  const { item } = route.params;
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [stoneMaster, setStoneMaster] = useState<StoneMaster[]>([]);
  const [showPicker, setShowPicker] = useState<{ visible: boolean, category: string, index: number | null }>({ visible: false, category: '', index: null });
  
  const [calcData, setCalcData] = useState({
    net_wt: String(item.net_wt || 0),
    labour_rate: String(item.labour_rate || 0),
    wastage: String(item.wastage || 0),
    igi_fee: String(item.igi_fee || 0),
    purity: item.purity || '18KT',
  });

  const [calcRates, setCalcRates] = useState({
    gold_22kt: 0,
    gold_18kt: 0,
    tax_gst: 10.5,
    usd_to_inr: 83.5,
  });

  const [dynamicDiamonds, setDynamicDiamonds] = useState<CalculatedStone[]>([
    { id: '1', type: 'VVS-EF-RD', weight: String(item.dai_rd || 0), pcs: '1', rate: '0', category: 'Diamond' },
    { id: '2', type: 'Shape Diamonds', weight: String(item.dai_pear || 0), pcs: '1', rate: '0', category: 'Diamond' }
  ]);

  const [dynamicStones, setDynamicStones] = useState<CalculatedStone[]>([
    { id: 's1', type: 'C. S. (COLOR STONE)', weight: String(item.clr_stone_wt || 0), pcs: '1', rate: '0', category: 'Stone' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ratesRes, stonesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*')
      ]);

      if (ratesRes.error) throw ratesRes.error;
      if (stonesRes.error) throw stonesRes.error;

      const ratesMap: any = { ...calcRates };
      ratesRes.data.forEach((r: MasterRate) => {
        ratesMap[r.key] = r.value;
      });
      setCalcRates(ratesMap);
      setStoneMaster(stonesRes.data);

      // Auto-calculate rates for initial items
      setDynamicDiamonds(prev => prev.map(d => ({ ...d, rate: String(lookupRate(d.type, num(d.weight), num(d.pcs), stonesRes.data)) })));
      setDynamicStones(prev => prev.map(s => ({ ...s, rate: String(lookupRate(s.type, num(s.weight), num(s.pcs), stonesRes.data)) })));

    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch master data');
    } finally {
      setLoading(false);
    }
  };

  const lookupRate = (name: string, weight: number, pcs: number, master: StoneMaster[]) => {
    if (!master || master.length === 0) return 0;
    const matches = master.filter(m => m.name === name);
    if (matches.length === 0) return 0;
    
    // Slab logic: weight / pcs
    const slab = pcs > 0 ? weight / pcs : weight;
    
    // Range-based lookup (Diamond)
    const rangeMatch = matches.find(m => slab >= m.min_wt && slab <= m.max_wt);
    if (rangeMatch) return rangeMatch.rate;
    
    // Fallback to first fixed rate
    return matches[0].rate;
  };

  const addRow = (category: 'Diamond' | 'Stone') => {
    const newRow = { id: Math.random().toString(), type: category === 'Diamond' ? 'VVS-EF-RD' : 'AQUAMARINE', weight: '0', pcs: '1', rate: '0', category };
    if (category === 'Diamond') setDynamicDiamonds([...dynamicDiamonds, newRow]);
    else setDynamicStones([...dynamicStones, newRow]);
  };

  const updateRow = (id: string, field: string, value: string, category: string) => {
    const updateFn = category === 'Diamond' ? setDynamicDiamonds : setDynamicStones;
    updateFn(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        if (field === 'type' || field === 'weight' || field === 'pcs') {
          updated.rate = String(lookupRate(updated.type, num(updated.weight), num(updated.pcs), stoneMaster));
        }
        return updated;
      }
      return row;
    }));
  };

  const removeRow = (id: string, category: string) => {
    const updateFn = category === 'Diamond' ? setDynamicDiamonds : setDynamicStones;
    updateFn(prev => prev.filter(r => r.id !== id));
  };

  // Calculations
  const currentGoldRate = calcData.purity.includes('22') ? calcRates.gold_22kt : calcRates.gold_18kt;
  const metalValue = num(calcData.net_wt) * currentGoldRate;
  const diamondValue = dynamicDiamonds.reduce((acc, d) => acc + (num(d.weight) * num(d.rate)), 0);
  const stoneValue = dynamicStones.reduce((acc, s) => acc + (num(s.weight) * num(s.rate)), 0);
  const makingCharge = num(calcData.net_wt) * num(calcData.labour_rate);
  const wastageCharge = metalValue * (num(calcData.wastage) / 100);
  const igiFee = num(calcData.igi_fee);

  const subTotal = metalValue + diamondValue + stoneValue + makingCharge + wastageCharge + igiFee;
  const taxAmount = subTotal * (calcRates.tax_gst / 100);
  const totalINR = subTotal + taxAmount;

  const formatValue = (val: number) => {
    if (currency === 'USD') {
      const usdVal = val / calcRates.usd_to_inr;
      return `$${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><X size={24} color="#1e293b" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Live Calculator</Text>
          {role === 'admin' && (
            <TouchableOpacity style={styles.currencyToggle} onPress={() => setCurrency(currency === 'INR' ? 'USD' : 'INR')}>
              <Repeat size={12} color="#6366f1" /><Text style={styles.currencyToggleText}>{currency} MODE</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}><RefreshCw size={20} color="#6366f1" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.purityToggle}>
            {['18KT', '22KT'].map(p => (
              <TouchableOpacity key={p} style={[styles.purityBtn, calcData.purity === p && styles.purityBtnActive]} onPress={() => setCalcData({...calcData, purity: p})}>
                <Text style={[styles.purityText, calcData.purity === p && styles.purityTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Metal" icon={Scale} />
          <EditableRow 
            label="Net weight" value={calcData.net_wt} onChange={(v: string) => setCalcData({...calcData, net_wt: v})} unit="g"
            rate={currentGoldRate} onRateChange={(v: string) => setCalcRates({...calcRates, [calcData.purity.includes('22') ? 'gold_22kt' : 'gold_18kt']: num(v)})}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.dynamicHeader}>
            <SectionHeader title="Diamonds" icon={Tag} />
            <TouchableOpacity style={styles.addSmallBtn} onPress={() => addRow('Diamond')}>
              <Plus size={14} color="white" /><Text style={styles.addSmallText}>Add</Text>
            </TouchableOpacity>
          </View>
          {dynamicDiamonds.map((d, index) => {
            const slab = num(d.pcs) > 0 ? (num(d.weight) / num(d.pcs)).toFixed(3) : d.weight;
            return (
              <View key={d.id} style={styles.dynamicRow}>
                <View style={styles.dynamicTop}>
                  <TouchableOpacity 
                    style={styles.typeSelector} 
                    onPress={() => setShowPicker({ visible: true, category: 'Diamond', index: index })}
                  >
                    <Text style={styles.typeText} numberOfLines={1}>{d.type}</Text>
                    <ChevronDown size={14} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeRow(d.id, 'Diamond')}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                </View>
                <EditableRow 
                  label="Weight" value={d.weight} onChange={(v: string) => updateRow(d.id, 'weight', v, 'Diamond')} unit="ct"
                  showPcs={true} pcsValue={d.pcs} onPcsChange={(v: string) => updateRow(d.id, 'pcs', v, 'Diamond')}
                  slabValue={slab}
                  rate={d.rate} onRateChange={(v: string) => updateRow(d.id, 'rate', v, 'Diamond')}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.dynamicHeader}>
            <SectionHeader title="Other Stones" icon={Info} />
            <TouchableOpacity style={styles.addSmallBtn} onPress={() => addRow('Stone')}>
              <Plus size={14} color="white" /><Text style={styles.addSmallText}>Add</Text>
            </TouchableOpacity>
          </View>
          {dynamicStones.map((s, index) => {
            const slab = num(s.pcs) > 0 ? (num(s.weight) / num(s.pcs)).toFixed(3) : s.weight;
            return (
              <View key={s.id} style={styles.dynamicRow}>
                <View style={styles.dynamicTop}>
                  <TouchableOpacity 
                    style={styles.typeSelector} 
                    onPress={() => setShowPicker({ visible: true, category: 'Stone', index: index })}
                  >
                    <Text style={styles.typeText} numberOfLines={1}>{s.type}</Text>
                    <ChevronDown size={14} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeRow(s.id, 'Stone')}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                </View>
                <EditableRow 
                  label="Weight" value={s.weight} onChange={(v: string) => updateRow(s.id, 'weight', v, 'Stone')} unit="ct"
                  showPcs={true} pcsValue={s.pcs} onPcsChange={(v: string) => updateRow(s.id, 'pcs', v, 'Stone')}
                  slabValue={slab}
                  rate={s.rate} onRateChange={(v: string) => updateRow(s.id, 'rate', v, 'Stone')}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Labor & Tax" icon={Calculator} />
          <EditableRow label="Making /g" value={calcData.labour_rate} onChange={(v: string) => setCalcData({...calcData, labour_rate: v})} unit="₹" />
          <EditableRow label="Wastage %" value={calcData.wastage} onChange={(v: string) => setCalcData({...calcData, wastage: v})} unit="%" />
          <EditableRow label="IGI / Cert" value={calcData.igi_fee} onChange={(v: string) => setCalcData({...calcData, igi_fee: v})} unit="₹" />
          <EditableRow label="GST Tax %" value={String(calcRates.tax_gst)} onChange={(v: string) => setCalcRates({...calcRates, tax_gst: num(v)})} unit="%" />
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Sub-Total</Text><Text style={styles.summaryValue}>{formatValue(subTotal)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tax Amount</Text><Text style={styles.summaryValue}>{formatValue(taxAmount)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>{formatValue(totalINR)}</Text>
          </View>
          {currency === 'USD' && <Text style={styles.exchangeRateText}>Conversion Rate: 1 USD = ₹{calcRates.usd_to_inr}</Text>}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <StonePickerModal 
        isVisible={showPicker.visible} 
        onClose={() => setShowPicker({ ...showPicker, visible: false })}
        category={showPicker.category}
        stones={stoneMaster}
        onSelect={(name: string) => {
          if (showPicker.index !== null) {
            const list = showPicker.category === 'Diamond' ? dynamicDiamonds : dynamicStones;
            updateRow(list[showPicker.index].id, 'type', name, showPicker.category);
          }
        }}
      />
    </View>
  );
}

const SectionHeader = ({ title, icon: Icon }: any) => (
  <View style={styles.sectionHeader}>
    <Icon size={18} color="#6366f1" />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 8 },
  refreshBtn: { padding: 8, backgroundColor: '#eef2ff', borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  body: { flex: 1, padding: 20 },
  itemCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  itemName: { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  purityToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginTop: 16 },
  purityBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  purityBtnActive: { backgroundColor: '#fff', elevation: 1 },
  purityText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  purityTextActive: { color: '#6366f1' },
  section: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  dynamicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addSmallBtn: { backgroundColor: '#6366f1', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addSmallText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dynamicRow: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 15, paddingBottom: 10 },
  dynamicTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeSelector: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginRight: 15, justifyContent: 'space-between' },
  typeText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  calcRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 },
  rateLabelSmall: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12 },
  editableInput: { flex: 1, paddingVertical: 10, fontSize: 16, color: '#1e293b', fontWeight: '700' },
  unitText: { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginLeft: 4 },
  summarySection: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  totalValue: { color: '#6366f1', fontSize: 24, fontWeight: '900' },
  exchangeRateText: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  currencyToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 6, marginTop: 4 },
  currencyToggleText: { fontSize: 10, fontWeight: '700', color: '#6366f1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemText: { fontSize: 16, color: '#1e293b', fontWeight: '600' }
});
