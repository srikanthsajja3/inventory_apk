import * as React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput, Modal, FlatList, useWindowDimensions, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, RefreshCw, ChevronDown, Plus, Trash2, Calculator as CalcIcon, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Printer, Share2, CheckCircle2, User, Lock, Unlock, EyeOff, ChevronUp } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { Theme } from '../theme';
import { getDynamicStoneRate, calculateStoneAmount } from '../utils/diamondCalc';

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
  },
  
  // Billing & ERP styles
  footerContainer: {
    padding: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  sellBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sellBtnText: {
    color: Theme.colors.text.black,
    fontSize: 15,
    fontWeight: '800',
  },
  sellModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  sellModalContent: { 
    backgroundColor: Theme.colors.background, 
    borderRadius: Theme.radius.xl, 
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden'
  },
  sellHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Theme.spacing.md,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  sellBody: { 
    padding: Theme.spacing.md, 
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.muted,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
    marginBottom: 6,
  },
  staffSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 4,
  },
  staffSelectBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  staffSelectText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  staffSelectTextActive: {
    color: Theme.colors.text.black,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  saveButtonText: {
    color: Theme.colors.text.black,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Receipt Styles
  receiptScroll: {
    padding: 15,
    backgroundColor: Theme.colors.muted,
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  receiptStoreName: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptStoreSub: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 11,
    color: Theme.colors.text.primary,
    fontWeight: '700',
  },
  receiptHeader: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: '800',
    marginVertical: 4,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  receiptTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: Theme.colors.text.primary,
  },
});

const renameStone = (name: string) => {
  const n = name.toUpperCase().trim();
  if (n.includes('VVS') || n.includes('EF') || n.includes('RD') || n === 'DIAMOND') return 'Diamond';
  if (n.includes('SHAPE')) return 'Shape Diamonds';
  return name;
};

const calculateDynamicStoneRate = (
  stoneLabel: string,
  category: string,
  weight: number | string,
  pcs: number | string,
  masterStones: any[],
  rateMap: any = {},
  productName: string = ''
): number => {
  const labelLower = (stoneLabel || '').toLowerCase().trim();
  let defaultRate = 69000;
  if (labelLower.includes('color stone') || labelLower.includes('stone')) {
    defaultRate = num(rateMap.stone_rate || 3500);
  } else if (labelLower.includes('beads')) {
    defaultRate = num(rateMap.default_beads_rate || 850);
  }

  let calculatedRate = getDynamicStoneRate(
    stoneLabel,
    category || 'Diamond',
    weight,
    pcs,
    masterStones,
    defaultRate
  );

  // Apply Emerald / Ruby discount for non-diamond items
  const normalizedProductName = (productName || '').toLowerCase().trim();
  const discount = num(rateMap.emerald_ruby_discount || 1000);
  if ((labelLower.includes('emerald') || labelLower.includes('ruby')) && !normalizedProductName.startsWith('d')) {
    calculatedRate = Math.max(0, calculatedRate - discount);
  }

  return calculatedRate;
};


const SpreadsheetRow = ({ label, subLabel, weight, rate, amount, onWeightChange, onRateChange, editable = true, bg, labelColor, isHeader = false, isTablet, showSubInput, subValue, onSubValueChange, showPcsColumn = false, onTogglePcsColumn, pcs, onPcsChange }: any) => {
  const fontSize = isTablet ? 15 : 10;
  const headerFontSize = isTablet ? 12 : 9;
  const rowHeight = isHeader 
    ? (isTablet ? 45 : 30) 
    : (subLabel ? (isTablet ? 90 : 65) : (isTablet ? 60 : 40));
  const rowBg = bg || Theme.colors.surface;
  const textColor = labelColor || Theme.colors.text.primary;

  if (isHeader) {
    return (
      <View style={[styles.ssRow, { backgroundColor: Theme.colors.muted, height: rowHeight }]}>
        <View style={[styles.ssCell, { flex: showPcsColumn ? 1.8 : 2.0 }]}>
          <Text style={[styles.headerLabel, { fontSize: headerFontSize }]}>PARTICULARS</Text>
        </View>

        <View style={[styles.ssCell, { flex: showPcsColumn ? 0.9 : 1.0, borderLeftWidth: 1, borderLeftColor: Theme.colors.border, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center', flex: 1 }]}>CT/WT</Text>
          {!showPcsColumn && (
            <TouchableOpacity 
              onPress={onTogglePcsColumn}
              style={{ width: 20, height: '100%' }}
              activeOpacity={1}
            />
          )}
        </View>

        {showPcsColumn && (
          <TouchableOpacity 
            onPress={onTogglePcsColumn}
            style={[styles.ssCell, { flex: 0.9, borderLeftWidth: 1, borderLeftColor: Theme.colors.border, backgroundColor: Theme.colors.primary + '20', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 }]}
          >
            <Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center', color: Theme.colors.primary }]}>PCS</Text>
            <X size={10} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}

        <View style={[styles.ssCell, { flex: showPcsColumn ? 1.2 : 1.2, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
          <Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'center' }]}>RATE</Text>
        </View>

        <View style={[styles.ssCell, { flex: showPcsColumn ? 1.4 : 1.5, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
          <Text style={[styles.headerLabel, { fontSize: headerFontSize, textAlign: 'right' }]}>AMOUNT (₹)</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ssRow, { backgroundColor: rowBg, height: rowHeight }]}>
      <View style={[styles.ssCell, { flex: showPcsColumn ? 1.8 : 2.0, overflow: 'hidden' }]}>
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

      <View style={[styles.ssCell, { flex: showPcsColumn ? 0.9 : 1.0, borderLeftWidth: 1, borderLeftColor: Theme.colors.border, flexDirection: 'row', alignItems: 'center' }]}>
        {editable ? (
          <TextInput 
            style={[styles.ssInput, { fontSize: fontSize, flex: 1, textAlign: 'center', fontWeight: '800' }]} 
            value={String(weight || '')} 
            onChangeText={onWeightChange} 
            keyboardType="numeric" 
            placeholder="0.00"
            placeholderTextColor={Theme.colors.text.muted}
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.ssText, { fontSize: fontSize, flex: 1, textAlign: 'center', fontWeight: '800' }]}>{weight}</Text>
        )}
        {!showPcsColumn && (
          <TouchableOpacity 
            onPress={onTogglePcsColumn}
            style={{ width: 16, height: '100%' }} 
            activeOpacity={1}
          />
        )}
      </View>

      {showPcsColumn && (
        <View style={[styles.ssCell, { flex: 0.9, borderLeftWidth: 1, borderLeftColor: Theme.colors.border, backgroundColor: Theme.colors.primary + '08' }]}>
          {editable && onPcsChange ? (
            <TextInput 
              style={[styles.ssInput, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800', color: Theme.colors.primary }]} 
              value={String(pcs !== undefined ? pcs : '')} 
              onChangeText={onPcsChange} 
              keyboardType="numeric" 
              placeholder="0"
              placeholderTextColor={Theme.colors.text.muted}
              selectTextOnFocus
            />
          ) : (
            <Text style={[styles.ssText, { fontSize: fontSize, width: '100%', textAlign: 'center', fontWeight: '800', color: Theme.colors.primary }]}>
              {pcs !== undefined ? pcs : '-'}
            </Text>
          )}
        </View>
      )}

      <View style={[styles.ssCell, { flex: showPcsColumn ? 1.2 : 1.2, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
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

      <View style={[styles.ssCell, { flex: showPcsColumn ? 1.4 : 1.5, borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
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
  const [showPcsColumn, setShowPcsColumn] = useState(false);

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
      prc_amount: num(item.cost_price || item.prc_amount || 0),
    };
  };

  const getInitialStones = (currentRateMap: any) => {
    let stones: any[] = [];
    try {
      if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
        stones = JSON.parse(item.stones_in_detail);
      } else {
        stones = [
          { id: 'd1', label: 'Diamond', weight: String(item.dai_wt || 0), pcs: String(item.dai_pcs || 0), rate: String('69000'), category: 'Diamond' },
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

  // Instagram Vanish Mode State & Touch/Mouse Swipe Tracking
  const [showAdminInsights, setShowAdminInsights] = useState(false);
  const startYRef = React.useRef<number | null>(null);

  const toggleVanishMode = () => {
    setShowAdminInsights(prev => !prev);
  };

  const handleTouchStart = (e: any) => {
    if (role !== 'admin') return;
    const y = e.nativeEvent.pageY || e.nativeEvent.clientY || (e.nativeEvent.touches && e.nativeEvent.touches[0]?.clientY) || 0;
    startYRef.current = y;
  };

  const handleTouchEnd = (e: any) => {
    if (role !== 'admin' || startYRef.current === null) return;
    const endY = e.nativeEvent.pageY || e.nativeEvent.clientY || (e.nativeEvent.changedTouches && e.nativeEvent.changedTouches[0]?.clientY) || 0;
    const dragDistance = startYRef.current - endY;
    if (dragDistance > 80) {
      toggleVanishMode();
    }
    startYRef.current = null;
  };

  // Billing & Invoicing State
  const [showSellModal, setShowSellModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI/Bank' | 'Card' | 'Gold Exchange'>('Cash');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selling, setSelling] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [soldInvoiceData, setSoldInvoiceData] = useState<any>(null);

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
        const autoRate = calculateDynamicStoneRate(
          s.label,
          s.category,
          s.weight,
          s.pcs,
          stoneMaster,
          rateMap,
          calcData.name
        );
        return { ...s, rate: String(autoRate) };
      });
      const hasChanges = updated.some((s, idx) => s.rate !== dynamicStones[idx].rate);
      if (hasChanges) { setDynamicStones(updated); }
    }
  }, [stoneMaster, rateMap, calcData.name]);


  useEffect(() => {
    if (Object.keys(rateMap).length > 0) {
      const p = calcData.purity.toLowerCase();
      setGoldRate(p.includes('24') ? rateMap.gold_24kt : p.includes('22') ? rateMap.gold_22kt : rateMap.gold_18kt);
    }
  }, [calcData.purity, rateMap]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ratesRes, stonesRes, employeesRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        supabase.from('stone_master').select('*'),
        supabase.from('employees').select('name').eq('is_active', true).order('name')
      ]);
      setStoneMaster(stonesRes.data || []);
      setEmployees(employeesRes.data || []);
      const newRateMap: any = {};
      ratesRes.data?.forEach(r => { newRateMap[r.key] = r.value; });
      setRateMap(newRateMap);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSell = async () => {
    const cleanAmount = saleAmount.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid sale amount');
      return;
    }
    if (selectedEmployees.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }

    try {
      setSelling(true);
      const staffNames = selectedEmployees.join(', ');
      const profitLoss = amount - purchaseAmount;
      const invoiceNo = 'MJ-' + Math.floor(100000 + Math.random() * 900000);
      const saleDate = new Date().toISOString();

      // 1. Record Sale in Supabase
      const { error: saleError } = await (supabase as any)
        .from('sales')
        .insert([{
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          prc_amount: purchaseAmount,
          sale_amount: amount,
          profit_loss: profitLoss,
          payment_mode: paymentMode,
          customer_name: customerName.trim() || 'Walk-in Customer',
          customer_phone: customerPhone.trim() || 'N/A',
          sold_by: staffNames,
          sold_at: saleDate
        }]);

      if (saleError) throw saleError;

      // 2. Decrement item quantity to 0
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ quantity: 0 })
        .eq('id', item.id);

      if (itemUpdateError) throw itemUpdateError;

      // 3. Log stock out in transactions
      await supabase.from('transactions').insert([{
        item_id: item.id,
        type: 'OUT',
        quantity_changed: 1,
        reason: `Billed for ₹${amount.toLocaleString()} by ${staffNames} (Inv: ${invoiceNo})`
      }]);

      // 4. Log cash inflow in accounts_ledger (Sales category)
      await (supabase as any).from('accounts_ledger').insert([{
        entry_date: saleDate.split('T')[0],
        description: `Billed: ${item.name} (SKU: ${item.sku || 'N/A'}, Inv: ${invoiceNo})`,
        type: 'INFLOW',
        category: 'Sale',
        payment_mode: paymentMode,
        amount: amount,
        gold_weight_g: 0,
        recorded_by: staffNames
      }]);

      const invoiceRecord = {
        invoiceNo,
        date: saleDate,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || 'N/A',
        itemName: item.name,
        sku: item.sku || 'N/A',
        purity: calcData.purity,
        grossWt: calcData.gross_wt,
        netWt: calcData.net_wt,
        goldRate: goldRate,
        wastage: calcData.wastage_pct,
        goldValue: goldValue,
        stonesTotal: stonesTotal,
        makingGoldAmt: makingGoldAmt,
        certCharges: certCharges,
        subTotal: subTotal,
        gstPct: calcData.tax_pct,
        gstAmt: subTotal * (num(calcData.tax_pct) / 100),
        total: amount,
        paymentMode: paymentMode,
        soldBy: staffNames,
      };

      setSoldInvoiceData(invoiceRecord);
      setShowSellModal(false);
      setShowReceiptModal(true);
    } catch (e: any) {
      Alert.alert('Billing Failed', e.message);
    } finally {
      setSelling(false);
    }
  };

  const shareReceipt = async () => {
    if (!soldInvoiceData) return;
    try {
      const { invoiceNo, date, customerName, customerPhone, itemName, sku, purity, grossWt, netWt, goldRate, wastage, goldValue, stonesTotal, makingGoldAmt, certCharges, subTotal, gstPct, gstAmt, total, paymentMode, soldBy } = soldInvoiceData;
      
      const formattedDate = new Date(date).toLocaleString();
      const text = `
-----------------------------------------
         MOKSHA JEWELS VJA
-----------------------------------------
INVOICE NO: ${invoiceNo}
DATE: ${formattedDate}
CUSTOMER: ${customerName}
PHONE: ${customerPhone}
-----------------------------------------
ITEM PARTICULARS:
Item: ${itemName}
SKU: ${sku}
Purity: ${purity}
Gross Wt: ${grossWt}g
Net Wt: ${netWt}g
Gold Rate: ₹${goldRate.toLocaleString()}/g
Wastage: ${wastage}%
-----------------------------------------
BILL DETAILS:
Gold Value: ₹${Math.round(goldValue).toLocaleString()}
Stones Total: ₹${Math.round(stonesTotal).toLocaleString()}
Making Charges: ₹${Math.round(makingGoldAmt).toLocaleString()}
Certification: ₹${Math.round(certCharges).toLocaleString()}
-----------------------------------------
Sub-Total: ₹${Math.round(subTotal).toLocaleString()}
GST (${gstPct}%): ₹${Math.round(gstAmt).toLocaleString()}
TOTAL AMOUNT: ₹${Math.round(total).toLocaleString()}
-----------------------------------------
Payment Mode: ${paymentMode}
Billed By: ${soldBy}
-----------------------------------------
        Thank you for shopping!
-----------------------------------------
`;

      if (Platform.OS === 'web') {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${invoiceNo}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const filename = `${FileSystem.documentDirectory}Invoice_${invoiceNo}.txt`;
        await FileSystem.writeAsStringAsync(filename, text, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  const printInvoiceReceiptHelper = async (data: any) => {
    if (!data) return;
    try {
      const { invoiceNo, date, customerName, customerPhone, items, subTotal, gstPct, gstAmt, discount, total, paymentMode, soldBy } = data;
      const formattedDate = new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      const numberToWords = (n: number): string => {
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const g = (val: number): string => {
          if (val < 20) return a[val];
          return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
        };
        const h = (val: number): string => {
          if (val === 0) return '';
          let str = '';
          if (val >= 100) {
            str += a[Math.floor(val / 100)] + ' Hundred ';
            val %= 100;
          }
          if (val > 0) {
            str += g(val);
          }
          return str.trim();
        };
        if (n === 0) return 'Zero';
        let result = '';
        const crores = Math.floor(n / 10000000);
        n %= 10000000;
        if (crores > 0) result += h(crores) + ' Crore ';
        const lakhs = Math.floor(n / 100000);
        n %= 100000;
        if (lakhs > 0) result += h(lakhs) + ' Lakh ';
        const thousands = Math.floor(n / 1000);
        n %= 1000;
        if (thousands > 0) result += h(thousands) + ' Thousand ';
        if (n > 0) result += h(n);
        return result.trim() + ' Rupees Only';
      };

      let itemsHtml = '';
      let totalBeforeTax = 0;

      items.forEach((item: any) => {
        const gWt = num(item.grossWt);
        const nWt = num(item.netWt);
        const wastageCost = nWt * (num(item.wastage) / 100) * num(item.goldRate);
        const itemAmt = num(item.total);
        totalBeforeTax += itemAmt;

        itemsHtml += `
          <div class="bold" style="font-size: 13px;">${item.name} (${item.purity})</div>
          <div class="row"><span>SKU:</span> <span>${item.sku || 'N/A'}</span></div>
          <div class="row"><span>Gross Wt:</span> <span>${gWt.toFixed(3)} g</span></div>
          <div class="row"><span>Net Wt:</span> <span>${nWt.toFixed(3)} g</span></div>
          <div class="row"><span>Gold Rate:</span> <span>₹${Math.round(item.goldRate)}/g</span></div>
          <div class="row"><span>Wastage (${item.wastage}%):</span> <span>₹${Math.round(wastageCost).toLocaleString('en-IN')}</span></div>
          <div class="row"><span>Labor:</span> <span>₹${Math.round(item.makingCharges).toLocaleString('en-IN')}</span></div>
          ${num(item.certCharges) > 0 ? `<div class="row"><span>Certification:</span> <span>₹${Math.round(item.certCharges).toLocaleString('en-IN')}</span></div>` : ''}
          ${num(item.otherCharges) > 0 ? `<div class="row"><span>Other Charges:</span> <span>₹${Math.round(item.otherCharges).toLocaleString('en-IN')}</span></div>` : ''}
          
          ${item.stones && item.stones.length > 0 ? `
            <div class="bold" style="margin-top: 4px; font-size: 11px;">Stones Breakdown:</div>
            ${item.stones.map((s: any) => {
              const sWt = num(s.weight);
              const sPcs = num(s.pcs);
              const sRate = num(s.rate);
              const sAmt = sWt === 0 ? sPcs * sRate : sWt * sRate;
              return `
                <div class="row stone-detail">
                  <span>- ${s.label || s.name} (${sPcs} pcs / ${sWt} ct)</span>
                  <span>₹${Math.round(sAmt).toLocaleString('en-IN')}</span>
                </div>
              `;
            }).join('')}
          ` : ''}
          
          <div class="row bold" style="margin-top: 6px; font-size: 13px; border-top: 1px dotted #000; padding-top: 3px;">
            <span>Item Total:</span>
            <span>₹${Math.round(itemAmt).toLocaleString('en-IN')}</span>
          </div>
          <div class="divider"></div>
        `;
      });

      const totalPayable = Math.round(total);
      const cgstAmt = totalBeforeTax * (num(gstPct) / 200);
      const sgstAmt = totalBeforeTax * (num(gstPct) / 200);
      const netAmountTotal = totalBeforeTax + cgstAmt + sgstAmt;
      const roundOff = totalPayable - netAmountTotal;
      const roundOffStr = roundOff >= 0 ? `+${roundOff.toFixed(2)}` : `-${Math.abs(roundOff).toFixed(2)}`;
      const payableWords = numberToWords(totalPayable);

      const htmlContent = `
        <html>
          <head>
            <title>Receipt - ${invoiceNo}</title>
            <style>
              * {
                font-weight: bold !important;
              }
              @page {
                margin: 0;
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 72mm;
                margin: 0;
                padding: 4mm 4mm 8mm 4mm;
                font-size: 11px;
                line-height: 1.25;
                color: #000;
                background-color: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              
              .store-name {
                font-size: 15px;
                font-weight: bold;
                margin-bottom: 2px;
              }
              .store-info {
                font-size: 9px;
                margin-bottom: 8px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 6px 0;
              }
              .double-divider {
                border-top: 2px double #000;
                margin: 6px 0;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              .stone-detail {
                font-size: 9.5px;
                padding-left: 8px;
                color: #333;
              }
              .total-section {
                font-size: 13px;
                font-weight: bold;
              }
              .footer-msg {
                font-size: 9.5px;
                text-align: center;
                margin-top: 15px;
              }
              
              @media print {
                body {
                  width: 72mm;
                  padding: 2mm 2mm 6mm 2mm;
                }
              }
            </style>
          </head>
          <body>
            
            <div class="text-center">
              <div class="store-name">MOKSHA JEWELS</div>
              <div class="store-info">
                PINNAMANENI POLYCLINIC ROAD,<br/>
                SIDDHARTHA NAGAR, VIJAYAWADA
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="row"><strong>TYPE:</strong> <span>${invoiceNo.startsWith('EST') ? 'ESTIMATE (NO TAX)' : 'TAX INVOICE'}</span></div>
            <div class="row"><strong>NUMBER:</strong> <span>${invoiceNo}</span></div>
            <div class="row"><strong>DATE:</strong> <span>${formattedDate.split(',')[0]}</span></div>
            <div class="row"><strong>TIME:</strong> <span>${formattedDate.split(',')[1] || ''}</span></div>
            <div class="row"><strong>CUSTOMER:</strong> <span>${customerName}</span></div>
            ${customerPhone !== 'N/A' ? `<div class="row"><strong>PHONE:</strong> <span>${customerPhone}</span></div>` : ''}
            
            <div class="divider"></div>
            
            ${itemsHtml}
            
            <div class="row"><span>Sub-Total:</span> <span>₹${Math.round(totalBeforeTax).toLocaleString('en-IN')}</span></div>
            <div class="row"><span>CGST@ ${(num(gstPct)/2).toFixed(2)}%:</span> <span>₹${Math.round(cgstAmt).toLocaleString('en-IN')}</span></div>
            <div class="row"><span>SGST@ ${(num(gstPct)/2).toFixed(2)}%:</span> <span>₹${Math.round(sgstAmt).toLocaleString('en-IN')}</span></div>
            <div class="row"><span>Round Off:</span> <span>${roundOffStr}</span></div>
            
            <div class="double-divider"></div>
            
            <div class="row total-section">
              <span>GRAND TOTAL:</span>
              <span>₹${totalPayable.toLocaleString('en-IN')}</span>
            </div>
            
            <div class="double-divider"></div>
            
            <div style="font-size: 9.5px; margin-bottom: 6px; line-height: 1.3;">
              <strong>In Words:</strong> ${payableWords}
            </div>
            <div class="row" style="font-size: 9.5px;"><strong>Pay Mode:</strong> <span>${paymentMode}</span></div>
            <div class="row" style="font-size: 9.5px;"><strong>Salesman:</strong> <span>${soldBy}</span></div>
            
            <div class="divider"></div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 9.5px;">
              <div style="border-top: 1px dashed #000; width: 100px; text-align: center; padding-top: 4px;">Customer Sign</div>
              <div style="border-top: 1px dashed #000; width: 100px; text-align: center; padding-top: 4px;">Authorized Sign</div>
            </div>
            
            <div class="footer-msg">
              Thank you for shopping with us!<br/>
              Moksha Jewels Gold & Diamonds LLP
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        }
      } else {
        const filename = `${FileSystem.documentDirectory}Invoice_${invoiceNo}.html`;
        await FileSystem.writeAsStringAsync(filename, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
    } catch (e: any) {
      Alert.alert('Print Failed', e.message);
    }
  };

  const printInvoiceReceipt = async () => {
    if (!soldInvoiceData) return;
    const record = {
      ...soldInvoiceData,
      items: [{
        name: soldInvoiceData.itemName,
        sku: soldInvoiceData.sku,
        purity: soldInvoiceData.purity,
        grossWt: soldInvoiceData.grossWt,
        netWt: soldInvoiceData.netWt,
        goldRate: soldInvoiceData.goldRate,
        wastage: soldInvoiceData.wastage,
        goldValue: soldInvoiceData.goldValue,
        stonesTotal: soldInvoiceData.stonesTotal,
        makingCharges: soldInvoiceData.makingGoldAmt,
        certCharges: soldInvoiceData.certCharges,
        otherCharges: 0,
        discount: 0,
        subTotal: soldInvoiceData.subTotal,
        total: soldInvoiceData.total,
        stones: dynamicStones.map(s => ({
          label: s.label,
          weight: num(s.weight),
          pcs: num(s.pcs),
          rate: num(s.rate),
          category: s.category
        }))
      }]
    };
    await printInvoiceReceiptHelper(record);
  };

  const printEstimateWithoutSaving = async () => {
    try {
      const record = {
        invoiceNo: 'EST-' + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toISOString(),
        customerName: 'Estimate Customer',
        customerPhone: 'N/A',
        items: [{
          name: calcData.name,
          sku: item.sku || 'N/A',
          purity: calcData.purity,
          grossWt: num(calcData.gross_wt),
          netWt: num(calcData.net_wt),
          goldRate: goldRate,
          wastage: num(calcData.wastage_pct),
          goldValue: goldValue,
          stonesTotal: stonesTotal,
          makingCharges: makingGoldAmt,
          certCharges: certCharges,
          otherCharges: 0,
          discount: 0,
          subTotal: subTotal,
          total: totalINR,
          stones: dynamicStones.map(s => ({
            label: s.label,
            weight: num(s.weight),
            pcs: num(s.pcs),
            rate: num(s.rate),
            category: s.category
          }))
        }],
        subTotal: subTotal,
        gstPct: num(calcData.tax_pct),
        gstAmt: subTotal * (num(calcData.tax_pct) / 100),
        discount: 0,
        total: totalINR,
        paymentMode: 'Estimate',
        soldBy: 'N/A'
      };

      await printInvoiceReceiptHelper(record);
    } catch (e: any) {
      Alert.alert('Print Error', e.message);
    }
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
  const stonesTotal = dynamicStones.reduce((acc, s) => acc + calculateStoneAmount(s.weight, s.pcs, s.rate), 0);
  const certCharges = diamondCarats > 0 ? Math.max(diamondCarats * num(calcData.cert_rate), num(calcData.cert_rate)) : 0;
  const subTotal = goldValue + stonesTotal + makingGoldAmt + certCharges;
  const totalINR = subTotal * (1 + (num(calcData.tax_pct) / 100));
  const purchaseAmount = num(calcData.prc_amount);
  const profitAmt = totalINR - purchaseAmount;
  const profitPct = purchaseAmount > 0 ? (profitAmt / purchaseAmount) * 100 : 0;
  const isLoss = profitAmt < 0;
  
  const handleWastageChange = (v: string) => {
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

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        {...Platform.select({
          web: {
            onMouseDown: (e: any) => handleTouchStart(e),
            onMouseUp: (e: any) => handleTouchEnd(e),
            onTouchStart: (e: any) => handleTouchStart(e),
            onTouchEnd: (e: any) => handleTouchEnd(e),
          },
          default: {
            onTouchStart: (e: any) => handleTouchStart(e),
            onTouchEnd: (e: any) => handleTouchEnd(e),
          }
        })}
      >
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
          <SpreadsheetRow isHeader isTablet={isTablet} showPcsColumn={showPcsColumn} onTogglePcsColumn={() => setShowPcsColumn(!showPcsColumn)} />
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
            showPcsColumn={showPcsColumn}
          />
          {dynamicStones.map((s, idx) => (
            <SpreadsheetRow 
              key={s.id} 
              label={s.label} 
              weight={s.weight} 
              pcs={s.pcs}
              rate={s.rate} 
              amount={formatNum(calculateStoneAmount(s.weight, s.pcs, s.rate))} 
              onWeightChange={(v: any) => {
                const autoRate = calculateDynamicStoneRate(s.label, s.category, v, s.pcs, stoneMaster, rateMap, calcData.name);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, weight: v, rate: ds.isManualRate ? ds.rate : String(autoRate)} : ds));
              }} 
              onPcsChange={(v: any) => {
                const newRate = calculateDynamicStoneRate(s.label, s.category, num(s.weight), num(v), stoneMaster, rateMap, calcData.name);
                setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, pcs: v, rate: newRate ? String(newRate) : ds.rate, isManualRate: false} : ds));
              }}
              onRateChange={(v: any) => setDynamicStones(dynamicStones.map(ds => ds.id === s.id ? {...ds, rate: v, isManualRate: true} : ds))} 
              bg={idx % 2 === 0 ? Theme.colors.surface : Theme.colors.background} 
              isTablet={isTablet} 
              showPcsColumn={showPcsColumn}
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
              showPcsColumn={showPcsColumn}
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
            showPcsColumn={showPcsColumn}
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

        {role === 'admin' && showAdminInsights && (
          <View style={[styles.adminSection, { width: '100%', marginTop: 20, borderColor: '#ca2c92', borderWidth: 2 }]}>
                <View style={styles.adminHeader}>
                  <TrendingUp size={20} color="#ca2c92" />
                  <Text style={[styles.adminTitle, { color: '#ca2c92' }]}>ADMIN INSIGHTS (CONFIDENTIAL COST PRICE)</Text>
                </View>
                <View style={styles.adminGrid}>
                  <View style={styles.adminStat}>
                    <Text style={styles.adminLabel}>Purchase Cost Price</Text>
                    <Text style={styles.adminValue}>{purchaseAmount > 0 ? `₹${formatNum(purchaseAmount)}` : 'Not Recorded'}</Text>
                  </View>
                  {purchaseAmount > 0 && (
                    <View style={[styles.adminStat, { borderLeftWidth: 1, borderLeftColor: Theme.colors.border }]}>
                      <Text style={styles.adminLabel}>Est. Profit</Text>
                      <Text style={[styles.adminValue, { color: isLoss ? Theme.colors.status.error : Theme.colors.status.success }]}>
                        ₹{formatNum(profitAmt)} ({profitPct.toFixed(1)}%)
                      </Text>
                    </View>
                  )}
                </View>
                {purchaseAmount > 0 && isLoss && (
                  <View style={styles.lossWarning}>
                    <TrendingDown size={14} color={Theme.colors.status.error} />
                    <Text style={styles.lossWarningText}>Currently selling at a loss</Text>
                  </View>
                )}
              </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Print Estimate sticky footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[styles.sellBtn, { width: '100%', backgroundColor: Theme.colors.primary }]} 
          onPress={printEstimateWithoutSaving}
        >
          <Printer size={18} color={Theme.colors.text.black} />
          <Text style={[styles.sellBtnText, { color: Theme.colors.text.black }]}>Print Estimate</Text>
        </TouchableOpacity>
      </View>

      {/* Billing Sell Modal */}
      <Modal visible={showSellModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.sellModalOverlay}>
            <View style={styles.sellModalContent}>
              <View style={styles.sellHeader}>
                <Text style={styles.modalTitle}>Confirm ERP Billing</Text>
                <TouchableOpacity onPress={() => setShowSellModal(false)}>
                  <X size={24} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.sellBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.formLabel, { color: Theme.colors.primary }]}>ITEM: {calcData.name}</Text>
                
                <Text style={styles.formLabel}>Customer Name</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Walk-in Customer" 
                    placeholderTextColor={Theme.colors.text.muted}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <Text style={styles.formLabel}>Customer Phone</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="N/A" 
                    placeholderTextColor={Theme.colors.text.muted}
                    keyboardType="numeric"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>

                <Text style={styles.formLabel}>Sale Amount (₹)</Text>
                <View style={[styles.inputWrapper, { borderWidth: 2, borderColor: Theme.colors.primary }]}>
                  <IndianRupee size={16} color={Theme.colors.primary} style={{ marginRight: 6 }} />
                  <TextInput 
                    style={[styles.input, { fontSize: 18, fontWeight: '800', color: Theme.colors.text.primary }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Theme.colors.text.muted}
                    value={saleAmount}
                    onChangeText={setSaleAmount}
                  />
                </View>

                <Text style={styles.formLabel}>Payment Mode</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {['Cash', 'UPI/Bank', 'Card', 'Gold Exchange'].map((mode) => (
                    <TouchableOpacity 
                      key={mode} 
                      style={[
                        styles.staffSelectBtn, 
                        paymentMode === mode && styles.staffSelectBtnActive,
                        { flex: 1, justifyContent: 'center', marginRight: 0, paddingVertical: 6 }
                      ]}
                      onPress={() => setPaymentMode(mode as any)}
                    >
                      <Text style={[
                        styles.staffSelectText,
                        paymentMode === mode && styles.staffSelectTextActive,
                        { fontSize: 9 }
                      ]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Select Staff</Text>
                <View style={{ minHeight: 45, marginBottom: 12 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {employees.map((emp) => (
                      <TouchableOpacity 
                        key={emp.name}
                        style={[
                          styles.staffSelectBtn, 
                          selectedEmployees.includes(emp.name) && styles.staffSelectBtnActive,
                          { paddingVertical: 6 }
                        ]}
                        onPress={() => {
                          setSelectedEmployees(prev => 
                            prev.includes(emp.name) 
                              ? prev.filter(n => n !== emp.name) 
                              : [...prev, emp.name]
                          );
                        }}
                      >
                        <User size={12} color={selectedEmployees.includes(emp.name) ? Theme.colors.text.black : Theme.colors.text.secondary} />
                        <Text style={[
                          styles.staffSelectText,
                          selectedEmployees.includes(emp.name) && styles.staffSelectTextActive,
                        ]}>{emp.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, (selling || selectedEmployees.length === 0) && { opacity: 0.7 }]}
                  onPress={handleSell}
                  disabled={selling || selectedEmployees.length === 0}
                >
                  {selling ? <ActivityIndicator color={Theme.colors.text.black} /> : <ShoppingBag size={18} color={Theme.colors.text.black} />}
                  <Text style={styles.saveButtonText}>Confirm & Generate Receipt</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.sellModalOverlay}>
          <View style={styles.sellModalContent}>
            <View style={styles.sellHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={20} color={Theme.colors.status.success} />
                <Text style={[styles.modalTitle, { color: Theme.colors.status.success }]}>Billed Successfully!</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowReceiptModal(false); navigation.goBack(); }}>
                <X size={24} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.receiptScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.receiptStoreName}>MOKSHA JEWELS VJA</Text>
              <Text style={styles.receiptStoreSub}>TAX INVOICE / RECEIPT</Text>

              {soldInvoiceData && (
                <>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Invoice No:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.invoiceNo}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date:</Text>
                    <Text style={styles.receiptValue}>{new Date(soldInvoiceData.date).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Customer:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.customerName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Phone:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.customerPhone}</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptHeader}>ITEM PARTICULARS</Text>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Item Name:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.itemName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>SKU:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.sku}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Purity:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.purity}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Gross Wt:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.grossWt}g</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Net Wt:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.netWt}g</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Gold Rate:</Text>
                    <Text style={styles.receiptValue}>₹{soldInvoiceData.goldRate.toLocaleString()}/g</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptHeader}>BILL SUMMARY</Text>
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Gold Value (incl Wst):</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.goldValue).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Stones Total:</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.stonesTotal).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Making charges:</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.makingGoldAmt).toLocaleString()}</Text>
                  </View>
                  {soldInvoiceData.certCharges > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Certification:</Text>
                      <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.certCharges).toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Sub-Total:</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.subTotal).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>GST ({soldInvoiceData.gstPct}%):</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(soldInvoiceData.gstAmt).toLocaleString()}</Text>
                  </View>

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>GRAND TOTAL</Text>
                    <Text style={styles.receiptTotalValue}>₹{Math.round(soldInvoiceData.total).toLocaleString()}</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payment Mode:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.paymentMode}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Billed By:</Text>
                    <Text style={styles.receiptValue}>{soldInvoiceData.soldBy}</Text>
                  </View>
                </>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={{ padding: 15, borderTopWidth: 1, borderTopColor: Theme.colors.border, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, minWidth: 100 }]} onPress={printInvoiceReceipt}>
                <Printer size={16} color="black" />
                <Text style={styles.saveButtonText}>Print Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, minWidth: 100, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border }]} onPress={shareReceipt}>
                <Share2 size={16} color={Theme.colors.text.primary} />
                <Text style={[styles.saveButtonText, { color: Theme.colors.text.primary }]}>Share Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, minWidth: 100, backgroundColor: Theme.colors.status.success }]} onPress={() => { setShowReceiptModal(false); navigation.goBack(); }}>
                <Text style={styles.saveButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
