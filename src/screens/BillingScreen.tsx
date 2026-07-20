import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, QrCode, User, Phone, ShoppingBag, Plus, Trash2, IndianRupee, Printer, Share2, CheckCircle2, ChevronRight, Calculator, FileText, Scale, X } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '900', color: Theme.colors.primary, letterSpacing: -0.5 },
  scrollContent: { padding: 10 },
  
  card: { backgroundColor: Theme.colors.surface, borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  inputGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 6, paddingHorizontal: 8, height: 32, borderWidth: 1, borderColor: Theme.colors.border },
  inputIcon: { marginRight: 6 },
  textInput: { flex: 1, color: Theme.colors.text.primary, fontSize: 11, fontWeight: '600', paddingVertical: 2 },
  
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBtn: { backgroundColor: Theme.colors.primary, width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  
  itemDetailGrid: { marginTop: 8 },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary },
  itemSku: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700' },
  
  tableContainer: { borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 8, overflow: 'hidden', backgroundColor: Theme.colors.background, marginBottom: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 28, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  tableRowHeader: { backgroundColor: Theme.colors.muted },
  tableCell: { flex: 1, paddingHorizontal: 6, justifyContent: 'center' },
  tableCellText: { fontSize: 10, color: Theme.colors.text.primary, fontWeight: '700' },
  tableCellLabel: { fontSize: 8, color: Theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase' },
  tableInput: { color: Theme.colors.primary, fontSize: 10, fontWeight: '700', padding: 0, width: '100%', height: '100%' },
  
  stoneDetailsTitle: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, marginTop: 8, marginBottom: 6, textTransform: 'uppercase' },
  
  billSummary: { backgroundColor: Theme.colors.muted, borderRadius: 8, padding: 10, marginTop: 8 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryLabel: { fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '600' },
  summaryValue: { fontSize: 11, color: Theme.colors.text.primary, fontWeight: '700' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  totalLabel: { fontSize: 12, fontWeight: '900', color: Theme.colors.primary, letterSpacing: 0.5 },
  totalValue: { fontSize: 15, fontWeight: '900', color: Theme.colors.text.primary },
  
  staffBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: Theme.colors.border, gap: 4, marginRight: 6 },
  staffBtnActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  staffBtnText: { fontSize: 10, fontWeight: '700', color: Theme.colors.text.secondary },
  staffBtnTextActive: { color: Theme.colors.text.black },
  
  actionBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8, marginTop: 8 },
  actionBtnText: { color: Theme.colors.text.black, fontSize: 13, fontWeight: '800' },
  
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  cameraOverlay: { position: 'absolute', top: 20, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
  cameraOverlayText: { color: 'white', fontWeight: '700', fontSize: 12 },
  
  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  receiptContent: { backgroundColor: Theme.colors.background, borderRadius: 20, width: '100%', maxWidth: 380, maxHeight: '85%', borderWidth: 1, borderColor: Theme.colors.border, overflow: 'hidden' },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  receiptTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.status.success },
  receiptScroll: { padding: 15, backgroundColor: Theme.colors.muted, margin: 15, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border },
  receiptStoreName: { fontSize: 18, fontWeight: '900', color: Theme.colors.primary, textAlign: 'center', marginBottom: 2 },
  receiptStoreSub: { fontSize: 9, color: Theme.colors.text.secondary, textAlign: 'center', marginBottom: 10 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  receiptLabel: { fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '600' },
  receiptValue: { fontSize: 10, color: Theme.colors.text.primary, fontWeight: '700' },
  receiptDivider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 6 },
  receiptSectionHeader: { fontSize: 10, color: Theme.colors.primary, fontWeight: '800', marginVertical: 4 },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  receiptFooterBtnRow: { padding: 15, borderTopWidth: 1, borderTopColor: Theme.colors.border, flexDirection: 'row', gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Theme.colors.text.secondary, marginTop: 10, fontSize: 14, fontWeight: '600' },
  topRowContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  billingBar: { flexDirection: 'row', backgroundColor: Theme.colors.surface, borderRadius: 8, height: 38, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 4, marginBottom: 12 },
  billingBarSection: { flexDirection: 'row', alignItems: 'center', flex: 1, height: '100%', paddingHorizontal: 6 },
  billingBarIcon: { marginRight: 6 },
  billingBarInput: { flex: 1, color: Theme.colors.text.primary, fontSize: 11, fontWeight: '600', paddingVertical: 4 },
  billingBarSearchBtn: { backgroundColor: Theme.colors.primary, width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  billingBarDivider: { width: 1, height: 18, backgroundColor: Theme.colors.border },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90%', borderWidth: 1, borderColor: Theme.colors.border, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 13, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  modalScroll: { padding: 12 },
});

const num = (v: any) => parseFloat(String(v)) || 0;

interface StoneDetail { id: string; name: string; weight: number; pcs: number; rate: number; category: string; }

export default function BillingScreen() {
  const [skuInput, setSkuInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const lastPressRef = React.useRef<number>(0);
  const [rateMap, setRateMap] = useState<any>({});
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Camera scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Billing form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI/Bank' | 'Card' | 'Gold Exchange'>('Cash');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Adjustable global billing states
  const [gstPct, setGstPct] = useState(3);
  
  // Receipt Preview
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [billingInProgress, setBillingInProgress] = useState(false);

  useEffect(() => {
    fetchMasterRates();
    fetchEmployees();
  }, []);

  const fetchMasterRates = async () => {
    try {
      const { data, error } = await supabase.from('master_rates').select('*');
      if (error) throw error;
      const rateMapLocal: any = {};
      data?.forEach(r => { rateMapLocal[r.key] = r.value; });
      setRateMap(rateMapLocal);
    } catch (e) {
      console.error('Error fetching master rates:', e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('name').eq('is_active', true).order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (e) {
      console.error('Error fetching employees:', e);
    }
  };

  const handleSearchSku = async (targetSku: string) => {
    if (!targetSku.trim()) return;
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('sku', targetSku.trim().toUpperCase())
        .gt('quantity', 0)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        Alert.alert('Not Found', 'No active item found with this SKU in stock.');
        return;
      }

      if (cartItems.some(i => i.id === data.id)) {
        Alert.alert('Duplicate Item', 'This item is already added to the bill.');
        return;
      }
      
      // Determine purity-based gold rate
      const purity = (data.purity || '18KT').toUpperCase();
      const currentGoldRate = purity.includes('24') 
        ? num(rateMap.gold_24kt) 
        : purity.includes('22') 
          ? num(rateMap.gold_22kt) 
          : num(rateMap.gold_18kt);

      // Determine making charge
      const isDiamond = data.name && data.name.trim().toUpperCase().startsWith('D');
      const defaultLabor = isDiamond 
        ? num(rateMap.default_labor_diamond || 1200) 
        : num(rateMap.default_labor_regular || 550);

      // Load stones
      let stonesList: StoneDetail[] = [];
      try {
        if (data.stones_in_detail && data.stones_in_detail.startsWith('[')) {
          const parsed = JSON.parse(data.stones_in_detail);
          stonesList = parsed.map((s: any) => ({
            id: s.id || Math.random().toString(36).substring(2, 10),
            name: s.name || s.label || 'Stone',
            weight: num(s.weight),
            pcs: num(s.pcs),
            rate: num(s.rate),
            category: s.category || 'Stone'
          }));
        } else {
          stonesList = [
            { id: 'd1', name: 'Diamond', weight: num(data.dai_wt), pcs: num(data.dai_pcs), rate: num(rateMap.diamond_rd_rate || 65000), category: 'Diamond' },
            { id: 's1', name: 'Color Stone', weight: num(data.clr_stone_wt), pcs: num(data.clr_stone_pcs), rate: num(rateMap.stone_rate || 3500), category: 'Stone' }
          ];
        }
      } catch (e) {
        console.error('Error parsing stones:', e);
      }
      
      // Certification and other charges
      const diamondCarats = stonesList
        .filter(s => s.category.toLowerCase() === 'diamond' || s.name.toLowerCase().includes('diamond'))
        .reduce((sum, s) => sum + s.weight, 0);
      const certificationPerCt = num(rateMap.cert_rate_per_ct || 950);
      const certCharges = diamondCarats > 0 ? Math.max(diamondCarats * certificationPerCt, certificationPerCt) : 0;

      const newCartItem = {
        id: data.id,
        sku: data.sku,
        name: data.name,
        gross_wt: num(data.gross_wt),
        net_wt: num(data.net_wt),
        purity,
        wastage: num(data.wastage || rateMap.default_wastage_pct || 22),
        gold_rate: currentGoldRate,
        making_rate: defaultLabor,
        cert_charges: certCharges,
        other_charges: num(data.other_charges),
        prc_amount: num(data.prc_amount),
        discount: 0,
        huid: data.huid || '',
        stones: stonesList,
      };

      setCartItems(prev => [...prev, newCartItem]);
      setActiveCartItemId(data.id);
      setSkuInput('');

    } catch (e: any) {
      Alert.alert('Search Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: any) => {
    if (data) {
      setCameraActive(false);
      setSkuInput(data);
      handleSearchSku(data);
    }
  };

  const toggleStaff = (name: string) => {
    setSelectedEmployees(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const updateCartItemField = (id: string, field: string, value: any) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const updateCartItemStone = (itemId: string, stoneId: string, field: 'weight' | 'pcs' | 'rate', value: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedStones = item.stones.map((s: any) => {
          if (s.id === stoneId) {
            return { ...s, [field]: num(value) };
          }
          return s;
        });
        return { ...item, stones: updatedStones };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    if (activeCartItemId === id) {
      setActiveCartItemId(null);
    }
  };

  const handleRowPress = (itemId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastPressRef.current < DOUBLE_PRESS_DELAY) {
      setEditItemId(itemId);
    }
    lastPressRef.current = now;
  };

  const calculateCartItemTotals = useCallback((cartItem: any) => {
    const goldValue = cartItem.net_wt * (1 + (cartItem.wastage / 100)) * cartItem.gold_rate;
    
    const stonesValue = cartItem.stones.reduce((sum: number, s: any) => {
      const isPerPc = s.weight === 0;
      return sum + (isPerPc ? s.pcs * s.rate : s.weight * s.rate);
    }, 0);

    // Tiered labor logic
    let makingCharges = cartItem.net_wt * cartItem.making_rate;
    const isDiamondProduct = cartItem.name && cartItem.name.trim().toUpperCase().startsWith('D');
    const isGoldProduct = cartItem.name && cartItem.name.trim().toUpperCase().startsWith('G');
    if (isDiamondProduct) {
      const t1Limit = num(rateMap.special_d_tier1_weight || 5.2);
      const t1Labor = num(rateMap.special_d_tier1_labor || 10000);
      const t2Limit = num(rateMap.special_d_tier2_weight || 8.0);
      const t2Labor = num(rateMap.special_d_tier2_labor || 12000);
      if (cartItem.net_wt <= t1Limit && cartItem.net_wt > 0) makingCharges = t1Labor;
      else if (cartItem.net_wt < t2Limit && cartItem.net_wt > t1Limit) makingCharges = t2Labor;
    } else if (isGoldProduct) {
      if (cartItem.net_wt < 5 && cartItem.net_wt > 0) makingCharges = 4000;
      else if (cartItem.net_wt >= 5 && cartItem.net_wt <= 8) makingCharges = 8000;
    }

    const subTotal = goldValue + stonesValue + makingCharges + cartItem.cert_charges + cartItem.other_charges;
    const total = subTotal - cartItem.discount;

    return {
      goldValue,
      stonesValue,
      makingCharges,
      subTotal,
      total
    };
  }, [rateMap]);

  const cartTotals = useMemo(() => {
    let goldValueTotal = 0;
    let stonesValueTotal = 0;
    let makingChargesTotal = 0;
    let certChargesTotal = 0;
    let otherChargesTotal = 0;
    let subTotalTotal = 0;
    let discountTotal = 0;
    let itemTotalSum = 0;

    cartItems.forEach(cartItem => {
      const computed = calculateCartItemTotals(cartItem);
      goldValueTotal += computed.goldValue;
      stonesValueTotal += computed.stonesValue;
      makingChargesTotal += computed.makingCharges;
      certChargesTotal += cartItem.cert_charges;
      otherChargesTotal += cartItem.other_charges;
      subTotalTotal += computed.subTotal;
      discountTotal += cartItem.discount;
      itemTotalSum += computed.total;
    });

    const gstValue = itemTotalSum * (gstPct / 100);
    const grandTotal = itemTotalSum + gstValue;

    return {
      goldValue: goldValueTotal,
      stonesValue: stonesValueTotal,
      makingCharges: makingChargesTotal,
      certCharges: certChargesTotal,
      otherCharges: otherChargesTotal,
      subTotal: subTotalTotal,
      discount: discountTotal,
      gstValue,
      grandTotal
    };
  }, [cartItems, gstPct, calculateCartItemTotals]);

  const handleCreateBill = async (shouldPrintImmediate: boolean) => {
    if (cartItems.length === 0) return;
    if (selectedEmployees.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }

    try {
      setBillingInProgress(true);
      const staffNames = selectedEmployees.join(', ');
      const invoiceNo = 'MJ-' + Math.floor(100000 + Math.random() * 900000);
      const saleDate = new Date().toISOString();
      
      // Write sale records for all items in cart
      const salesInserts = cartItems.map(cartItem => {
        const computed = calculateCartItemTotals(cartItem);
        return {
          item_id: cartItem.id,
          sku: cartItem.sku,
          item_name: cartItem.name,
          prc_amount: cartItem.prc_amount,
          sale_amount: computed.total + (computed.total * (gstPct / 100)), // item share of bill
          profit_loss: (computed.total + (computed.total * (gstPct / 100))) - cartItem.prc_amount,
          payment_mode: paymentMode,
          customer_name: customerName.trim() || 'Walk-in Customer',
          customer_phone: customerPhone.trim() || 'N/A',
          sold_by: staffNames,
          sold_at: saleDate
        };
      });

      const { error: saleError } = await (supabase as any)
        .from('sales')
        .insert(salesInserts);

      if (saleError) throw saleError;

      // Decrement items quantity to 0
      const itemIds = cartItems.map(i => i.id);
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ quantity: 0 })
        .in('id', itemIds);

      if (itemUpdateError) throw itemUpdateError;

      // Insert transaction OUT audit logs for each item
      const txLogs = cartItems.map(cartItem => {
        const computed = calculateCartItemTotals(cartItem);
        const itemTotalWithGst = computed.total + (computed.total * (gstPct / 100));
        return {
          item_id: cartItem.id,
          type: 'OUT',
          quantity_changed: 1,
          reason: `Sold via billing screen for ₹${Math.round(itemTotalWithGst).toLocaleString()} by ${staffNames} (Inv: ${invoiceNo})`
        };
      });
      await supabase.from('transactions').insert(txLogs);

      // Log cash inflow in accounts ledger (single entry for entire bill)
      const itemSummaryText = cartItems.map(i => `${i.name} (SKU: ${i.sku || 'N/A'})`).join(', ');
      await (supabase as any).from('accounts_ledger').insert([{
        entry_date: saleDate.split('T')[0],
        description: `Sale: ${itemSummaryText} (Inv: ${invoiceNo})`,
        type: 'INFLOW',
        category: 'Sale',
        payment_mode: paymentMode,
        amount: cartTotals.grandTotal,
        gold_weight_g: 0,
        recorded_by: staffNames
      }]);

      // Prepare receipt data
      const record = {
        invoiceNo,
        date: saleDate,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || 'N/A',
        items: cartItems.map(cartItem => {
          const computed = calculateCartItemTotals(cartItem);
          return {
            name: cartItem.name,
            sku: cartItem.sku || 'N/A',
            purity: cartItem.purity,
            grossWt: cartItem.gross_wt,
            netWt: cartItem.net_wt,
            goldRate: cartItem.gold_rate,
            wastage: cartItem.wastage,
            goldValue: computed.goldValue,
            stonesTotal: computed.stonesValue,
            makingCharges: computed.makingCharges,
            certCharges: cartItem.cert_charges,
            otherCharges: cartItem.other_charges,
            discount: cartItem.discount,
            subTotal: computed.subTotal,
            total: computed.total,
            stones: cartItem.stones
          };
        }),
        subTotal: cartTotals.subTotal,
        gstPct: gstPct,
        gstAmt: cartTotals.gstValue,
        discount: cartTotals.discount,
        total: cartTotals.grandTotal,
        paymentMode: paymentMode,
        soldBy: staffNames,
      };

      setReceiptData(record);
      setShowReceiptModal(true);

      if (shouldPrintImmediate) {
        await printInvoiceReceiptHelper(record);
      }

    } catch (e: any) {
      Alert.alert('Billing Failure', e.message);
    } finally {
      setBillingInProgress(false);
    }
  };

  const handlePrintWithoutSaving = async () => {
    if (cartItems.length === 0) return;
    try {
      const staffNames = selectedEmployees.length > 0 ? selectedEmployees.join(', ') : 'N/A';
      const invoiceNo = 'EST-' + Math.floor(100000 + Math.random() * 900000);
      const saleDate = new Date().toISOString();

      const record = {
        invoiceNo,
        date: saleDate,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || 'N/A',
        items: cartItems.map(cartItem => {
          const computed = calculateCartItemTotals(cartItem);
          return {
            name: cartItem.name,
            sku: cartItem.sku || 'N/A',
            purity: cartItem.purity,
            grossWt: cartItem.gross_wt,
            netWt: cartItem.net_wt,
            goldRate: cartItem.gold_rate,
            wastage: cartItem.wastage,
            goldValue: computed.goldValue,
            stonesTotal: computed.stonesValue,
            makingCharges: computed.makingCharges,
            certCharges: cartItem.cert_charges,
            otherCharges: cartItem.other_charges,
            discount: cartItem.discount,
            subTotal: computed.subTotal,
            total: computed.total,
            stones: cartItem.stones
          };
        }),
        subTotal: cartTotals.subTotal,
        gstPct: gstPct,
        gstAmt: cartTotals.gstValue,
        discount: cartTotals.discount,
        total: cartTotals.grandTotal,
        paymentMode: paymentMode,
        soldBy: staffNames,
      };

      await printInvoiceReceiptHelper(record);
    } catch (e: any) {
      Alert.alert('Print Error', e.message);
    }
  };

  async function printInvoiceReceiptHelper(data: any) {
    if (!data) return;
    try {
      const { invoiceNo, date, customerName, customerPhone, items, subTotal, gstPct, gstAmt, discount, total, paymentMode, soldBy } = data;
      
      const formattedDate = new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      // Spell numbers in words
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
        if (crores > 0) {
          result += h(crores) + ' Crore ';
        }

        const lakhs = Math.floor(n / 100000);
        n %= 100000;
        if (lakhs > 0) {
          result += h(lakhs) + ' Lakh ';
        }

        const thousands = Math.floor(n / 1000);
        n %= 1000;
        if (thousands > 0) {
          result += h(thousands) + ' Thousand ';
        }

        if (n > 0) {
          result += h(n);
        }

        return result.trim() + ' Rupees Only';
      };

      let itemsHtml = '';
      let totalGrossWt = 0;
      let totalNetWt = 0;
      let totalDiaWt = 0;
      let totalStoneWt = 0;
      let totalVA = 0;
      let totalBeforeTax = 0;

      items.forEach((item: any) => {
        const gWt = num(item.grossWt);
        const nWt = num(item.netWt);
        
        const purityVal = item.purity ? parseFloat(item.purity.replace(/[^\d.]/g, '')) || 0 : 0;
        
        const diaWt = item.stones
          ? item.stones.filter((s: any) => s.category?.toLowerCase() === 'diamond' || s.name?.toLowerCase().includes('diamond')).reduce((sum: number, s: any) => sum + num(s.weight), 0)
          : 0;
        const stoneWt = item.stones
          ? item.stones.filter((s: any) => s.category?.toLowerCase() !== 'diamond' && !s.name?.toLowerCase().includes('diamond')).reduce((sum: number, s: any) => sum + num(s.weight), 0)
          : 0;
          
        const wastageCost = nWt * (num(item.wastage) / 100) * num(item.goldRate);
        const va = wastageCost + num(item.makingCharges) + num(item.certCharges || 0) + num(item.otherCharges || 0);
        
        const itemAmt = num(item.total);

        totalGrossWt += gWt;
        totalNetWt += nWt;
        totalDiaWt += diaWt;
        totalStoneWt += stoneWt;
        totalVA += va;
        totalBeforeTax += itemAmt;

        itemsHtml += `
          <tr>
            <td>${item.name}</td>
            <td class="text-center">711319</td>
            <td class="text-center">${purityVal.toFixed(2)}</td>
            <td class="text-right">${gWt.toFixed(3)} Gm</td>
            <td class="text-right">${nWt.toFixed(3)} Gm</td>
            <td class="text-right">${diaWt.toFixed(3)}</td>
            <td class="text-right">${stoneWt.toFixed(3)}</td>
            <td class="text-right">${Math.round(item.goldRate)}</td>
            <td class="text-right">${Math.round(va).toLocaleString('en-IN')}</td>
            <td class="text-right">${Math.round(itemAmt).toLocaleString('en-IN')}</td>
          </tr>
        `;
      });

      const totalPayable = Math.round(total);
      const cgstAmt = totalBeforeTax * 0.015;
      const sgstAmt = totalBeforeTax * 0.015;
      const netAmountTotal = totalBeforeTax + cgstAmt + sgstAmt;
      const roundOff = totalPayable - netAmountTotal;
      const roundOffStr = roundOff >= 0 ? `+${roundOff.toFixed(2)}` : `-${Math.abs(roundOff).toFixed(2)}`;
      const payableWords = numberToWords(totalPayable);

      const htmlContent = `
        <html>
          <head>
            <title>Invoice - ${invoiceNo}</title>
            <style>
              html, body {
                height: 100%;
                margin: 0;
                padding: 0;
              }
              body {
                font-family: Arial, sans-serif;
                margin: 20px auto;
                padding: 10mm 10mm 10mm 15mm;
                color: black;
                background-color: white;
                font-size: 11px;
                width: 210mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
              }
              .invoice-container {
                border: 1px solid black;
                padding: 180px 15px 30px 15px;
                box-sizing: border-box;
                width: 100%;
                height: calc(297mm - 20mm);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .content-wrapper {
                flex: 1;
              }
              .footer-wrapper {
                margin-top: auto;
                width: 100%;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              
              .header-title {
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 0.5px;
                margin: 5px 0;
              }
              .header-meta {
                font-size: 10px;
                font-weight: bold;
                border-top: 1px solid black;
                border-bottom: 1px solid black;
                padding: 4px 10px;
                display: flex;
                justify-content: space-between;
              }
              
              .info-box {
                width: 100%;
                border: 1px solid black;
                border-collapse: collapse;
                margin-top: 8px;
                margin-bottom: 8px;
              }
              .info-box td {
                border: 1px solid black;
                padding: 5px 8px;
                vertical-align: top;
                width: 50%;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
              }
              
              .items-table {
                width: 100%;
                border: 1px solid black;
                border-collapse: collapse;
                margin-bottom: 8px;
              }
              .items-table th, .items-table td {
                border: 1px solid black;
                padding: 6px 8px;
              }
              .items-table th {
                font-weight: bold;
                background-color: #ffffff;
                font-size: 10px;
                text-transform: uppercase;
                text-align: center;
              }
              
              .summary-box {
                width: 100%;
                border: 1px solid black;
                border-collapse: collapse;
              }
              .summary-box td {
                border: 1px solid black;
                padding: 6px 8px;
                vertical-align: top;
              }
              
              .inner-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
              }
              .inner-table th, .inner-table td {
                border: 1px solid #ccc;
                padding: 4px 6px;
              }
              
              .footer-address {
                text-align: center;
                font-weight: bold;
                font-size: 9px;
                margin-top: 20px;
                border-top: 1px solid black;
                padding-top: 4px;
              }
              
              @media print {
                html, body {
                  height: 100%;
                  min-height: 100%;
                  margin: 0;
                  padding: 0;
                }
                body {
                  padding: 0;
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  box-sizing: border-box;
                }
                .invoice-container {
                  border: 1px solid black;
                  height: calc(297mm - 20mm);
                  box-sizing: border-box;
                  padding: 180px 15px 30px 15px;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                }
                @page {
                  margin: 10mm 10mm 10mm 15mm;
                  size: A4;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="content-wrapper">
                <!-- Crown Logo & Store Header (Logo and Company Name removed) -->
                <div class="text-center">
                  <div class="header-meta" style="justify-content: center;">
                    <span style="font-size: 13px; font-weight: 900; letter-spacing: 2px;">INVOICE</span>
                  </div>
                </div>
  
                <!-- Customer & Invoice Metadata Box -->
                <table class="info-box">
                  <tr>
                    <td>
                      <div class="row"><strong>Name</strong><span>: ${customerName}</span></div>
                      <div class="row"><strong>Address</strong><span>: Vijayawada, AP</span></div>
                      <div class="row"><strong>Mobile</strong><span>: ${customerPhone}</span></div>
                      <div class="row"><strong>City & Pin No.</strong><span>: VIJAYAWADA - 520012</span></div>
                      <div class="row"><strong>State & Code</strong><span>: 37 - ANDHRA PRADESH</span></div>
                      <div class="row"><strong>C.PAN No</strong><span>: </span></div>
                    </td>
                    <td>
                      <div class="row"><strong>Invoice No.</strong><span>: ${invoiceNo}</span></div>
                      <div class="row"><strong>Date</strong><span>: ${formattedDate.split(',')[0]}</span></div>
                      <div class="row"><strong>Time</strong><span>: ${formattedDate.split(',')[1] || ''}</span></div>
                      <div class="row"><strong>C.GSTN No.</strong><span>: NA</span></div>
                      <div class="row"><strong>Salesman</strong><span>: ${soldBy}</span></div>
                    </td>
                  </tr>
                </table>
  
                <!-- Items Table -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Item Description</th>
                      <th style="width: 10%;">HSN Code</th>
                      <th style="width: 7%;">Purity</th>
                      <th style="width: 10%;">Gross Wt</th>
                      <th style="width: 10%;">Net Wt</th>
                      <th style="width: 8%;">Dia Wt</th>
                      <th style="width: 8%;">Stone Wt</th>
                      <th style="width: 8%;">G Rate</th>
                      <th style="width: 8%;">VA</th>
                      <th style="width: 11%;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                    <!-- Totals Row -->
                    <tr style="font-weight: bold;">
                      <td>Total</td>
                      <td></td>
                      <td></td>
                      <td class="text-right">${totalGrossWt.toFixed(3)} Gm</td>
                      <td class="text-right">${totalNetWt.toFixed(3)} Gm</td>
                      <td class="text-right">${totalDiaWt.toFixed(3)}</td>
                      <td class="text-right">${totalStoneWt.toFixed(3)}</td>
                      <td></td>
                      <td class="text-right">₹${Math.round(totalVA).toLocaleString('en-IN')}</td>
                      <td class="text-right">₹${Math.round(totalBeforeTax).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="footer-wrapper">
                <!-- Totals Summary & Words -->
                <table class="summary-box">
                  <tr>
                    <!-- Left Section: Words, Payment Splits, Narration -->
                    <td style="width: 60%;">
                      <div style="margin-bottom: 10px; line-height: 1.4;">
                        <strong>In Words Rs. :</strong> ${payableWords}
                      </div>
                      
                      <table class="inner-table">
                        <thead>
                          <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <th>Payment Type</th>
                            <th>Instrument No</th>
                            <th style="text-align: right;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>${paymentMode}</td>
                            <td>A.No:${Math.floor(100000 + Math.random()*900000)}</td>
                            <td style="text-align: right;">₹${totalPayable.toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div style="margin-top: 12px;"><strong>Total Balance :</strong> NIL</div>
                      <div style="margin-top: 8px;"><strong>Narration :</strong> </div>
                    </td>
                    
                    <!-- Right Section: Taxes, Discounts, Totals -->
                    <td style="width: 40%; font-size: 10.5px;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 2px 0;">Less Disc</td><td class="text-right" style="padding: 2px 0;">₹${Math.round(discount).toLocaleString('en-IN')}</td></tr>
                        <tr><td style="padding: 2px 0;">CGST@ 1.50%</td><td class="text-right" style="padding: 2px 0;">₹${Math.round(cgstAmt).toLocaleString('en-IN')}</td></tr>
                        <tr><td style="padding: 2px 0;">SGST@ 1.50%</td><td class="text-right" style="padding: 2px 0;">₹${Math.round(sgstAmt).toLocaleString('en-IN')}</td></tr>
                        <tr><td style="padding: 2px 0;">IGST @ 3%</td><td class="text-right" style="padding: 2px 0;">₹0.00</td></tr>
                        <tr class="bold" style="border-top: 1px solid black; border-bottom: 1px solid black; height: 22px;">
                          <td>Net Amount</td><td class="text-right">₹${Math.round(netAmountTotal).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr><td style="padding: 2px 0;">Less URD[MOD]</td><td class="text-right" style="padding: 2px 0;">₹${paymentMode === 'Gold Exchange' ? totalPayable.toLocaleString('en-IN') : '0.00'}</td></tr>
                        <tr><td style="padding: 2px 0;">Less Advance</td><td class="text-right" style="padding: 2px 0;">₹0.00</td></tr>
                        <tr><td style="padding: 2px 0;">Scheme Disc</td><td class="text-right" style="padding: 2px 0;">₹0.00</td></tr>
                        <tr><td style="padding: 2px 0;">Round Off</td><td class="text-right" style="padding: 2px 0;">${roundOffStr}</td></tr>
                        <tr class="bold" style="font-size: 13px; border-top: 1px dashed black; border-bottom: 1px dashed black; height: 24px;">
                          <td>Net Payable</td><td class="text-right">₹${totalPayable.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr><td style="padding: 2px 0;">Current Balance</td><td class="text-right" style="padding: 2px 0;">₹0.00</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
  
                <!-- Signatures Grid -->
                <div style="display: flex; justify-content: space-between; margin-top: 30px; font-weight: bold;">
                  <div style="border-top: 1px solid black; width: 140px; text-align: center; padding-top: 4px;">Customer Signature</div>
                  <div style="text-align: right;">
                    <div style="margin-top: 35px; border-top: 1px solid black; display: inline-block; width: 180px; text-align: center; padding-top: 4px;">Authorized Signatory</div>
                  </div>
                </div>
  
                <!-- Bottom Address Footer -->
                <div class="footer-address">
                  D 60-9-1/A, PINNAMANENI POLYCLINIC ROAD, SIDDHARTHA NAGAR, VIJAYAWADA, ANDHRA PRADESH 520010
                </div>
              </div>
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
  }

  const printInvoiceReceipt = async () => {
    if (!receiptData) return;
    await printInvoiceReceiptHelper(receiptData);
  };

  const shareInvoiceReceipt = async () => {
    if (!receiptData) return;
    try {
      const { invoiceNo, date, customerName, customerPhone, items, subTotal, gstPct, gstAmt, discount, total, paymentMode, soldBy } = receiptData;
      
      const formattedDate = new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      let itemsText = '';
      items.forEach((item: any, idx: number) => {
        itemsText += `
${idx + 1}. ${item.name} (${item.sku})
   Purity: ${item.purity} | Wt: G: ${item.grossWt}g, N: ${item.netWt}g
   Gold: ₹${Math.round(item.goldValue).toLocaleString()} | Stones: ₹${Math.round(item.stonesTotal).toLocaleString()}
   Making: ₹${Math.round(item.makingCharges).toLocaleString()} | Cert/Other: ₹${Math.round(item.certCharges + item.otherCharges).toLocaleString()}
   Discount: -₹${Math.round(item.discount).toLocaleString()} | Total: ₹${Math.round(item.total).toLocaleString()}
`;
      });

      const text = `
-----------------------------------------
         MOKSHA JEWELS VJA
-----------------------------------------
TAX INVOICE: ${invoiceNo}
DATE: ${formattedDate}
CUSTOMER: ${customerName}
PHONE: ${customerPhone}
-----------------------------------------
ITEM DESCRIPTION:${itemsText}
-----------------------------------------
BILL DETAILS:
Sub-Total: ₹${Math.round(subTotal).toLocaleString()}
GST (${gstPct}%): ₹${Math.round(gstAmt).toLocaleString()}
Discount: -₹${Math.round(discount).toLocaleString()}
TOTAL BILL: ₹${Math.round(total).toLocaleString()}
-----------------------------------------
Payment Mode: ${paymentMode}
Billed By: ${soldBy}
-----------------------------------------
      Thank you for your business!
-----------------------------------------
`;

      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          Alert.alert('Copied to Clipboard', 'Invoice text copied to clipboard!');
        } else {
          Alert.alert('Invoice Text', text);
        }
      } else {
        await Share.share({
          message: text,
        });
      }
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  const handleDone = () => {
    setShowReceiptModal(false);
    setCartItems([]);
    setActiveCartItemId(null);
    setSkuInput('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedEmployees([]);
  };

  const editItem = editItemId ? cartItems.find(item => item.id === editItemId) : null;
  const editComputed = editItem ? calculateCartItemTotals(editItem) : null;

  if (cameraActive) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <TouchableOpacity style={styles.cameraOverlay} onPress={() => setCameraActive(false)}>
          <Text style={styles.cameraOverlayText}>✕ Cancel Scan</Text>
        </TouchableOpacity>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'code128'] }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>ERP Cash Counter Billing</Text>
        <TouchableOpacity onPress={() => setCameraActive(true)} style={[styles.searchBtn, { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border }]}>
          <QrCode size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Unified Utility Bar: Item Lookup & Customer Info on a Single Line */}
          <View style={styles.billingBar}>
            
            {/* 1. Item SKU Lookup */}
            <View style={[styles.billingBarSection, { flex: 1.3, paddingRight: 2 }]}>
              <Search size={14} color={Theme.colors.text.secondary} style={styles.billingBarIcon} />
              <TextInput
                style={styles.billingBarInput}
                placeholder="SKU (e.g. D1024)"
                placeholderTextColor={Theme.colors.text.muted}
                value={skuInput}
                onChangeText={setSkuInput}
                onSubmitEditing={() => handleSearchSku(skuInput)}
                autoCapitalize="characters"
              />
              <TouchableOpacity onPress={() => handleSearchSku(skuInput)} style={styles.billingBarSearchBtn}>
                {loading ? <ActivityIndicator size="small" color="black" /> : <Search size={14} color="black" />}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.billingBarDivider} />

            {/* 2. Customer Name */}
            <View style={[styles.billingBarSection, { flex: 1.5 }]}>
              <User size={14} color={Theme.colors.text.secondary} style={styles.billingBarIcon} />
              <TextInput
                style={styles.billingBarInput}
                placeholder="Customer Name"
                placeholderTextColor={Theme.colors.text.muted}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            {/* Divider */}
            <View style={styles.billingBarDivider} />

            {/* 3. Mobile Number */}
            <View style={[styles.billingBarSection, { flex: 1.1 }]}>
              <Phone size={14} color={Theme.colors.text.secondary} style={styles.billingBarIcon} />
              <TextInput
                style={styles.billingBarInput}
                placeholder="Mobile Number"
                placeholderTextColor={Theme.colors.text.muted}
                keyboardType="numeric"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />
            </View>

          </View>

          {/* 3. Unified Billed Items Table (Only shown if cart is not empty) */}
          {cartItems.length > 0 ? (
            <View>
              <Text style={styles.cardTitle}>Billed Items</Text>
              
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{ marginBottom: 15 }}>
                <View style={[styles.tableContainer, { minWidth: 1360, marginBottom: 0 }]}>
                  {/* Table Header */}
                  <View style={[styles.tableRow, styles.tableRowHeader, { height: 32 }]}>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Label No.</Text></View>
                    <View style={{ width: 120, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Item Name</Text></View>
                    <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Gross Wt</Text></View>
                    <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Net Wt</Text></View>
                    <View style={{ width: 40, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Pcs</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Metal Rate</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Metal Amt</Text></View>
                    <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Lab. Rate</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Lab. Amt</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Di/St Amt</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Ot. Charge</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>Disc. Amt</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>HUID</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>CGST (1.5%)</Text></View>
                    <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>SGST (1.5%)</Text></View>
                    <View style={{ width: 60, paddingHorizontal: 6, justifyContent: 'center' }}><Text style={styles.tableCellLabel}>IGST</Text></View>
                    <View style={{ width: 90, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'flex-end' }}><Text style={styles.tableCellLabel}>Total Amt</Text></View>
                    <View style={{ width: 50, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' }}><Text style={styles.tableCellLabel}>Action</Text></View>
                  </View>

                  {/* Table Body */}
                  {cartItems.map((cartItem) => {
                    const computed = calculateCartItemTotals(cartItem);
                    const stonesValue = cartItem.stones.reduce((sum: number, s: any) => {
                      const isPerPc = s.weight === 0;
                      return sum + (isPerPc ? s.pcs * s.rate : s.weight * s.rate);
                    }, 0);
                    
                    return (
                      <TouchableOpacity
                        key={cartItem.id}
                        activeOpacity={0.8}
                        onPress={() => handleRowPress(cartItem.id)}
                        style={[styles.tableRow, { height: 38, backgroundColor: Theme.colors.surface }]}
                      >
                        {/* Label No. */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText} numberOfLines={1}>{cartItem.sku}</Text>
                        </View>

                        {/* Item Name */}
                        <View style={{ width: 120, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText} numberOfLines={1}>{cartItem.name}</Text>
                        </View>

                        {/* Gross Wt */}
                        <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>{cartItem.gross_wt}g</Text>
                        </View>

                        {/* Net Wt */}
                        <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>{cartItem.net_wt}g</Text>
                        </View>

                        {/* Pcs */}
                        <View style={{ width: 40, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>1</Text>
                        </View>

                        {/* Metal Rate */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(cartItem.gold_rate).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Metal Amt */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(cartItem.net_wt * cartItem.gold_rate).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Lab. Rate */}
                        <View style={{ width: 70, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{cartItem.making_rate}/g</Text>
                        </View>

                        {/* Lab. Amt */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(computed.makingCharges).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Di/St Amt */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(stonesValue).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Ot. Charge */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(cartItem.cert_charges + cartItem.other_charges).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Disc. Amt */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={[styles.tableCellText, { color: Theme.colors.status.error }]}>₹{Math.round(cartItem.discount).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* HUID */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText} numberOfLines={1}>{cartItem.huid || '-'}</Text>
                        </View>

                        {/* CGST */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(computed.total * 0.015).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* SGST */}
                        <View style={{ width: 80, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹{Math.round(computed.total * 0.015).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* IGST */}
                        <View style={{ width: 60, paddingHorizontal: 6, justifyContent: 'center' }}>
                          <Text style={styles.tableCellText}>₹0</Text>
                        </View>

                        {/* Total Amt */}
                        <View style={{ width: 90, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'flex-end' }}>
                          <Text style={[styles.tableCellText, { color: Theme.colors.primary }]}>₹{Math.round(computed.total).toLocaleString('en-IN')}</Text>
                        </View>

                        {/* Action */}
                        <View style={{ width: 50, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => handleRemoveFromCart(cartItem.id)} style={{ padding: 4 }}>
                            <Trash2 size={14} color={Theme.colors.status.error} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              
              <Text style={{ fontSize: 9, color: Theme.colors.text.secondary, marginBottom: 12, fontStyle: 'italic' }}>
                * Double tap any item row to edit its gold rate, labor, stones, and discount parameters.
              </Text>

              {/* Global Billing Configuration (GST, Payment, Staff, Summary) */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Global Billing Configuration</Text>
                
                {/* GST Row */}
                <View style={[styles.inputGroup, { width: '100%', marginBottom: 15 }]}>
                  <Text style={styles.inputLabel}>GST (%)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.textInput} 
                      keyboardType="numeric" 
                      value={String(gstPct)} 
                      onChangeText={(v) => setGstPct(num(v))} 
                    />
                  </View>
                </View>

                {/* Payment Mode & Sales Staff */}
                <Text style={styles.inputLabel}>Payment Mode</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 15 }}>
                  {['Cash', 'UPI/Bank', 'Card', 'Gold Exchange'].map(mode => (
                    <TouchableOpacity 
                      key={mode} 
                      style={[styles.staffBtn, paymentMode === mode && styles.staffBtnActive, { flex: 1, marginRight: 0, justifyContent: 'center' }]}
                      onPress={() => setPaymentMode(mode as any)}
                    >
                      <Text style={[styles.staffBtnText, paymentMode === mode && styles.staffBtnTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Sales staff</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                  {employees.map(emp => (
                    <TouchableOpacity 
                      key={emp.name} 
                      style={[styles.staffBtn, selectedEmployees.includes(emp.name) && styles.staffBtnActive]}
                      onPress={() => toggleStaff(emp.name)}
                    >
                      <User size={12} color={selectedEmployees.includes(emp.name) ? 'black' : Theme.colors.text.secondary} />
                      <Text style={[styles.staffBtnText, selectedEmployees.includes(emp.name) && styles.staffBtnTextActive]}>{emp.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Bill summary card */}
                <View style={styles.billSummary}>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>Sub-Total Value:</Text>
                    <Text style={styles.summaryValue}>₹{Math.round(cartTotals.subTotal).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryLabel}>GST ({gstPct}%):</Text>
                    <Text style={styles.summaryValue}>₹{Math.round(cartTotals.gstValue).toLocaleString('en-IN')}</Text>
                  </View>
                  {cartTotals.discount > 0 && (
                    <View style={styles.summaryLine}>
                      <Text style={[styles.summaryLabel, { color: Theme.colors.status.error }]}>Item Discounts:</Text>
                      <Text style={[styles.summaryValue, { color: Theme.colors.status.error }]}>-₹{Math.round(cartTotals.discount).toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLabel}>NET BILL AMOUNT</Text>
                    <Text style={styles.totalValue}>₹{Math.round(cartTotals.grandTotal).toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Submit Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <TouchableOpacity 
                    style={[
                      styles.actionBtn, 
                      { flex: 1, backgroundColor: Theme.colors.status.success, marginTop: 0 },
                      (billingInProgress || selectedEmployees.length === 0) && { opacity: 0.7 }
                    ]} 
                    onPress={() => handleCreateBill(false)}
                    disabled={billingInProgress || selectedEmployees.length === 0}
                  >
                    {billingInProgress ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <FileText size={16} color="black" />
                    )}
                    <Text style={styles.actionBtnText}>Save Sale</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.actionBtn, 
                      { flex: 1, backgroundColor: Theme.colors.primary, marginTop: 0 },
                      (billingInProgress || selectedEmployees.length === 0) && { opacity: 0.7 }
                    ]} 
                    onPress={() => handleCreateBill(true)}
                    disabled={billingInProgress || selectedEmployees.length === 0}
                  >
                    {billingInProgress ? (
                      <ActivityIndicator size="small" color="black" />
                    ) : (
                      <Printer size={16} color="black" />
                    )}
                    <Text style={styles.actionBtnText}>Save & Print</Text>
                  </TouchableOpacity>
                </View>

                {/* Print Estimate (No Save) Button */}
                <TouchableOpacity 
                  style={[
                    styles.actionBtn, 
                    { 
                      backgroundColor: 'transparent', 
                      borderWidth: 1, 
                      borderColor: Theme.colors.primary, 
                      marginTop: 10 
                    }
                  ]} 
                  onPress={handlePrintWithoutSaving}
                >
                  <Printer size={16} color={Theme.colors.primary} />
                  <Text style={[styles.actionBtnText, { color: Theme.colors.primary }]}>Print Estimate (Without Saving)</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.center, { marginTop: 60 }]}>
              <ShoppingBag size={64} color={Theme.colors.border} />
              <Text style={styles.emptyText}>Scan or Search an item to start billing</Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Tax Invoice Digital Receipt Overlay */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} color={Theme.colors.status.success} />
                <Text style={styles.receiptTitle}>Invoice Generated Successfully!</Text>
              </View>
              <TouchableOpacity onPress={handleDone}>
                <X size={20} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.receiptScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.receiptStoreName}>MOKSHA JEWELS VJA</Text>
              <Text style={styles.receiptStoreSub}>Vijayawada, AP • Tax Invoice</Text>

              {receiptData && (
                <>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Invoice No:</Text>
                    <Text style={styles.receiptValue}>{receiptData.invoiceNo}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date:</Text>
                    <Text style={styles.receiptValue}>{new Date(receiptData.date).toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Customer:</Text>
                    <Text style={styles.receiptValue}>{receiptData.customerName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mobile:</Text>
                    <Text style={styles.receiptValue}>{receiptData.customerPhone}</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptSectionHeader}>ITEM DETAILS</Text>
                  {receiptData.items.map((rItem: any, idx: number) => (
                    <View key={idx} style={{ marginBottom: 10 }}>
                      <Text style={[styles.receiptValue, { color: Theme.colors.primary, fontSize: 11 }]}>{idx + 1}. {rItem.name} ({rItem.sku})</Text>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Purity / Wt:</Text>
                        <Text style={styles.receiptValue}>{rItem.purity} | Net: {rItem.netWt}g | Gross: {rItem.grossWt}g</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Gold Value:</Text>
                        <Text style={styles.receiptValue}>₹{Math.round(rItem.goldValue).toLocaleString('en-IN')}</Text>
                      </View>
                      {rItem.stonesTotal > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Stones Cost:</Text>
                          <Text style={styles.receiptValue}>₹{Math.round(rItem.stonesTotal).toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Making / Labor:</Text>
                        <Text style={styles.receiptValue}>₹{Math.round(rItem.makingCharges).toLocaleString('en-IN')}</Text>
                      </View>
                      {rItem.certCharges > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Cert. Fee:</Text>
                          <Text style={styles.receiptValue}>₹{Math.round(rItem.certCharges).toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      {rItem.otherCharges > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Other Charges:</Text>
                          <Text style={styles.receiptValue}>₹{Math.round(rItem.otherCharges).toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      {rItem.discount > 0 && (
                        <View style={styles.receiptRow}>
                          <Text style={[styles.receiptLabel, { color: Theme.colors.status.error }]}>Discount:</Text>
                          <Text style={[styles.receiptValue, { color: Theme.colors.status.error }]}>-₹{Math.round(rItem.discount).toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Item Sub-Total:</Text>
                        <Text style={styles.receiptValue}>₹{Math.round(rItem.total).toLocaleString('en-IN')}</Text>
                      </View>
                      {idx < receiptData.items.length - 1 && <View style={[styles.receiptDivider, { opacity: 0.5 }]} />}
                    </View>
                  ))}

                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Sub-Total:</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(receiptData.subTotal).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>GST ({receiptData.gstPct}%):</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(receiptData.gstAmt).toLocaleString('en-IN')}</Text>
                  </View>
                  {receiptData.discount > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, { color: Theme.colors.status.error }]}>Discount:</Text>
                      <Text style={[styles.receiptValue, { color: Theme.colors.status.error }]}>-₹{Math.round(receiptData.discount).toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                    <Text style={[styles.receiptLabel, { fontSize: 12, fontWeight: '900', color: Theme.colors.primary }]}>GRAND TOTAL:</Text>
                    <Text style={[styles.receiptValue, { fontSize: 13, fontWeight: '900' }]}>₹{Math.round(receiptData.total).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Mode / Billed By:</Text>
                    <Text style={styles.receiptValue}>{receiptData.paymentMode} / {receiptData.soldBy}</Text>
                  </View>
                </>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={[styles.receiptFooterBtnRow, { flexDirection: 'column', gap: 8, padding: 12 }]}>
              <TouchableOpacity style={[styles.actionBtn, { marginTop: 0 }]} onPress={printInvoiceReceipt}>
                <Printer size={16} color="black" />
                <Text style={styles.actionBtnText}>Print Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Theme.colors.status.success, marginTop: 0 }]} onPress={handleDone}>
                <Text style={styles.actionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Edit Worksheet Modal (double clicked row item) */}
      <Modal visible={editItemId !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {editItem && editComputed && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Edit Estimate Worksheet</Text>
                  <Text style={{ fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '700', marginTop: 2 }}>
                    {editItem.name} ({editItem.sku || 'N/A'}) • {editItem.purity} • G: {editItem.gross_wt}g | N: {editItem.net_wt}g
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditItemId(null)} style={{ padding: 4 }}>
                  <X size={20} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Editable Ornament Weights & HUID */}
                <Text style={styles.stoneDetailsTitle}>Ornament Weight & HUID Details</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                    <Text style={styles.inputLabel}>Gross Weight (g)</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.textInput} 
                        keyboardType="numeric" 
                        value={String(editItem.gross_wt)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'gross_wt', num(v))} 
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                    <Text style={styles.inputLabel}>Net Weight (g)</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.textInput} 
                        keyboardType="numeric" 
                        value={String(editItem.net_wt)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'net_wt', num(v))} 
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1.5, marginBottom: 0 }]}>
                    <Text style={styles.inputLabel}>HUID Code</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput 
                        style={styles.textInput} 
                        placeholder="HUID code"
                        placeholderTextColor={Theme.colors.text.muted}
                        autoCapitalize="characters"
                        value={editItem.huid} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'huid', v)} 
                      />
                    </View>
                  </View>
                </View>

                {/* Estimation Parameter Table */}
                <View style={styles.tableContainer}>
                  {/* Header */}
                  <View style={[styles.tableRow, styles.tableRowHeader]}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellLabel}>Particular</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellLabel, { textAlign: 'center' }]}>Value</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellLabel, { textAlign: 'center' }]}>Rate/Rate %</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellLabel, { textAlign: 'right' }]}>Total (₹)</Text></View>
                  </View>
                  
                  {/* Gold Net Wt row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText}>Gold Value (Net Wt)</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>{editItem.net_wt}g</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}>
                      <TextInput 
                        style={[styles.tableInput, { textAlign: 'center' }]} 
                        keyboardType="numeric" 
                        value={String(editItem.gold_rate)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'gold_rate', num(v))} 
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(editItem.net_wt * editItem.gold_rate).toLocaleString('en-IN')}</Text></View>
                  </View>

                  {/* Wastage row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText}>Wastage Charges</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>-</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}>
                      <TextInput 
                        style={[styles.tableInput, { textAlign: 'center' }]} 
                        keyboardType="numeric" 
                        value={String(editItem.wastage)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'wastage', num(v))} 
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(editItem.net_wt * (editItem.wastage / 100) * editItem.gold_rate).toLocaleString('en-IN')}</Text></View>
                  </View>

                  {/* Making charges row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText}>Making / Labour</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>{editItem.net_wt}g</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}>
                      <TextInput 
                        style={[styles.tableInput, { textAlign: 'center' }]} 
                        keyboardType="numeric" 
                        value={String(editItem.making_rate)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'making_rate', num(v))} 
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(editComputed.makingCharges).toLocaleString('en-IN')}</Text></View>
                  </View>

                  {/* Certification charges row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText}>Certification Fee</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>-</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}>
                      <TextInput 
                        style={[styles.tableInput, { textAlign: 'center' }]} 
                        keyboardType="numeric" 
                        value={String(editItem.cert_charges)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'cert_charges', num(v))} 
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(editItem.cert_charges).toLocaleString('en-IN')}</Text></View>
                  </View>

                  {/* Other charges row */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText}>Other Charges</Text></View>
                    <View style={[styles.tableCell, { flex: 0.8 }]}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>-</Text></View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}>
                      <TextInput 
                        style={[styles.tableInput, { textAlign: 'center' }]} 
                        keyboardType="numeric" 
                        value={String(editItem.other_charges)} 
                        onChangeText={(v) => updateCartItemField(editItem.id, 'other_charges', num(v))} 
                      />
                    </View>
                    <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(editItem.other_charges).toLocaleString('en-IN')}</Text></View>
                  </View>
                </View>

                {/* Stone Details Table */}
                {editItem.stones.length > 0 && (
                  <>
                    <Text style={styles.stoneDetailsTitle}>Stone Details Breakdown</Text>
                    <View style={styles.tableContainer}>
                      {/* Header */}
                      <View style={[styles.tableRow, styles.tableRowHeader]}>
                        <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellLabel}>Stone Name</Text></View>
                        <View style={[styles.tableCell, { flex: 0.7 }]}><Text style={[styles.tableCellLabel, { textAlign: 'center' }]}>Wt(Ct)</Text></View>
                        <View style={[styles.tableCell, { flex: 0.5 }]}><Text style={[styles.tableCellLabel, { textAlign: 'center' }]}>Pcs</Text></View>
                        <View style={[styles.tableCell, { flex: 1.0 }]}><Text style={[styles.tableCellLabel, { textAlign: 'center' }]}>Rate</Text></View>
                        <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellLabel, { textAlign: 'right' }]}>Total (₹)</Text></View>
                      </View>
                      
                      {/* Stone Rows */}
                      {editItem.stones.map((stone: any) => {
                        const isPerPc = stone.weight === 0;
                        const totalStoneVal = isPerPc ? stone.pcs * stone.rate : stone.weight * stone.rate;
                        return (
                          <View style={styles.tableRow} key={stone.id}>
                            <View style={[styles.tableCell, { flex: 1.8 }]}><Text style={styles.tableCellText} numberOfLines={1}>{stone.name}</Text></View>
                            <View style={[styles.tableCell, { flex: 0.7 }]}>
                              <TextInput 
                                style={[styles.tableInput, { textAlign: 'center' }]} 
                                keyboardType="numeric" 
                                value={String(stone.weight)} 
                                onChangeText={(v) => updateCartItemStone(editItem.id, stone.id, 'weight', v)} 
                              />
                            </View>
                            <View style={[styles.tableCell, { flex: 0.5 }]}>
                              <TextInput 
                                style={[styles.tableInput, { textAlign: 'center', color: Theme.colors.primary }]} 
                                keyboardType="numeric" 
                                value={String(stone.pcs)} 
                                onChangeText={(v) => updateCartItemStone(editItem.id, stone.id, 'pcs', v)} 
                              />
                            </View>
                            <View style={[styles.tableCell, { flex: 1.0 }]}>
                              <TextInput 
                                style={[styles.tableInput, { textAlign: 'center' }]} 
                                keyboardType="numeric" 
                                value={String(stone.rate)} 
                                onChangeText={(v) => updateCartItemStone(editItem.id, stone.id, 'rate', v)} 
                              />
                            </View>
                            <View style={[styles.tableCell, { flex: 1.2 }]}><Text style={[styles.tableCellText, { textAlign: 'right' }]}>₹{Math.round(totalStoneVal).toLocaleString('en-IN')}</Text></View>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Item Discount Row */}
                <Text style={styles.stoneDetailsTitle}>Item Cash Discount</Text>
                <View style={[styles.inputGroup, { width: '100%', marginBottom: 15 }]}>
                  <Text style={styles.inputLabel}>Item Discount (₹)</Text>
                  <View style={[styles.inputWrapper, { borderColor: Theme.colors.status.error }]}>
                    <TextInput 
                      style={[styles.textInput, { color: Theme.colors.status.error }]} 
                      keyboardType="numeric" 
                      placeholder="0.00"
                      value={String(editItem.discount)} 
                      onChangeText={(v) => updateCartItemField(editItem.id, 'discount', num(v))} 
                    />
                  </View>
                </View>

                {/* Save & Confirm button */}
                <TouchableOpacity 
                  style={[styles.actionBtn, { marginBottom: 30 }]} 
                  onPress={() => setEditItemId(null)}
                >
                  <Text style={styles.actionBtnText}>Apply & Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
