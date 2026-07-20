import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, TrendingUp, TrendingDown, Clock, ArrowLeft, RefreshCw, Download, Calendar as CalendarIcon, Filter, Plus, Wallet, Shield, User, FileText, ChevronRight } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  backBtn: { padding: 8, backgroundColor: Theme.colors.surface, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary },
  tabsContainer: { flexDirection: 'row', backgroundColor: Theme.colors.surface, borderRadius: 15, padding: 6, marginHorizontal: 20, marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: Theme.colors.border },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTabBtn: { backgroundColor: Theme.colors.background, borderWidth: 1, borderColor: Theme.colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary },
  activeTabText: { color: Theme.colors.primary, fontWeight: '800' },
  
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 15 },
  statCard: { flex: 1, backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Theme.colors.border },
  statLabel: { fontSize: 8, fontWeight: '700', color: Theme.colors.text.secondary, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary },
  
  filterCard: { backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 15, marginHorizontal: 20, marginBottom: 15, borderWidth: 1, borderColor: Theme.colors.border },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  filterTitle: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.5 },
  dateRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  dateInputGroup: { flex: 1 },
  dateLabel: { fontSize: 8, color: Theme.colors.text.secondary, marginBottom: 4, fontWeight: '600' },
  dateInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 10, paddingHorizontal: 10, height: 40, borderWidth: 1, borderColor: Theme.colors.border },
  dateText: { flex: 1, color: Theme.colors.text.primary, fontSize: 11, fontWeight: '700' },
  
  ledgerCard: { backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 15, marginBottom: 10, marginHorizontal: 20, borderWidth: 1, borderColor: Theme.colors.border },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ledgerDate: { fontSize: 10, color: Theme.colors.text.muted, fontWeight: '600' },
  ledgerDesc: { fontSize: 14, fontWeight: '700', color: Theme.colors.text.primary },
  ledgerMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  ledgerCategory: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  ledgerAmount: { fontSize: 15, fontWeight: '800' },
  
  dayBookRow: { backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 15, marginBottom: 10, marginHorizontal: 20, borderWidth: 1, borderColor: Theme.colors.border },
  dayBookHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: 8, marginBottom: 8 },
  dayBookDate: { fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary },
  dayBookGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBookCol: { alignItems: 'center', flex: 1 },
  dayBookLabel: { fontSize: 8, color: Theme.colors.text.secondary, textTransform: 'uppercase', marginBottom: 2 },
  dayBookValue: { fontSize: 12, fontWeight: '700' },
  
  pnLContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  pnLCard: { backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 20 },
  pnLTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.primary, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  pnLRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  pnLLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.text.secondary },
  pnLValue: { fontSize: 14, fontWeight: '800', color: Theme.colors.text.primary },
  pnLTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, marginTop: 10 },
  pnLTotalLabel: { fontSize: 15, fontWeight: '900', color: Theme.colors.primary },
  pnLTotalValue: { fontSize: 18, fontWeight: '900' },
  
  fab: { position: 'absolute', bottom: 25, right: 20, backgroundColor: Theme.colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '80%', borderWidth: 1, borderColor: Theme.colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text.primary },
  formGroup: { marginBottom: 15 },
  formLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary, marginBottom: 6 },
  inputWrapper: { backgroundColor: Theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 12 },
  formInput: { color: Theme.colors.text.primary, fontSize: 14, paddingVertical: 10, fontWeight: '600' },
  formDropdown: { backgroundColor: Theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Theme.colors.border, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formDropdownText: { color: Theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeOption: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border },
  typeOptionActive: { borderColor: Theme.colors.primary },
  typeTextActive: { color: Theme.colors.primary, fontWeight: '800' },
  saveBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 10, marginTop: 10 },
  saveBtnText: { color: Theme.colors.text.black, fontSize: 15, fontWeight: '700' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Theme.colors.text.secondary, marginTop: 10, fontSize: 14, fontWeight: '600' },
  staffScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  staffBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Theme.colors.border, gap: 6 },
  staffBtnActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  staffBtnText: { fontSize: 11, fontWeight: '700', color: Theme.colors.text.secondary },
  staffBtnTextActive: { color: Theme.colors.text.black }
});

const num = (v: any) => parseFloat(String(v)) || 0;

export default function AccountsScreen({ onBack }: { onBack: () => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [activeTab, setActiveTab] = useState<'daybook' | 'ledger' | 'pnl'>('daybook');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  
  // Date Filters
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  
  // Transaction Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Transaction Form fields
  const [formType, setFormType] = useState<'INFLOW' | 'OUTFLOW'>('OUTFLOW');
  const [formCategory, setFormCategory] = useState('Office Expense');
  const [formMode, setFormMode] = useState<'Cash' | 'UPI/Bank' | 'Card' | 'Gold Exchange'>('Cash');
  const [formAmount, setFormAmount] = useState('');
  const [formGoldWeight, setFormGoldWeight] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStaff, setFormStaff] = useState('');

  const categories = useMemo(() => {
    if (formType === 'INFLOW') {
      return ['Sale', 'Advance', 'Owner Capital', 'Others'];
    }
    return ['Purchase', 'Labour', 'Salary', 'Rent', 'Office Expense', 'Gold Exchange', 'Others'];
  }, [formType]);

  useEffect(() => {
    fetchLedger();
    fetchEmployees();
  }, [startDate, endDate]);

  const fetchLedger = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      let query = (supabase as any).from('accounts_ledger').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLedger(data || []);
    } catch (error: any) {
      console.error('Ledger Fetch Error:', error.message);
      Alert.alert('Database Error', 'Failed to load ledger: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('name').eq('is_active', true).order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (e: any) {
      console.error('Fetch Employees Error:', e.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
    fetchEmployees();
  };

  // Day Book calculations
  const dayBookData = useMemo(() => {
    const grouped: Record<string, { entry_date: string, inflow: number, outflow: number, gold_in: number, gold_out: number, count: number }> = {};
    
    ledger.forEach(item => {
      const date = item.entry_date;
      if (!grouped[date]) {
        grouped[date] = { entry_date: date, inflow: 0, outflow: 0, gold_in: 0, gold_out: 0, count: 0 };
      }
      const val = num(item.amount);
      const wt = num(item.gold_weight_g);
      
      if (item.type === 'INFLOW') {
        grouped[date].inflow += val;
        grouped[date].gold_in += wt;
      } else {
        grouped[date].outflow += val;
        grouped[date].gold_out += wt;
      }
      grouped[date].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }, [ledger]);

  // Overall Totals for Filtered Period
  const summaryTotals = useMemo(() => {
    return ledger.reduce((acc, curr) => {
      const amt = num(curr.amount);
      const wt = num(curr.gold_weight_g);
      
      if (curr.type === 'INFLOW') {
        acc.inflow += amt;
        acc.goldIn += wt;
        if (curr.payment_mode === 'Cash') acc.cashIn += amt;
        if (curr.payment_mode === 'UPI/Bank') acc.bankIn += amt;
      } else {
        acc.outflow += amt;
        acc.goldOut += wt;
        if (curr.payment_mode === 'Cash') acc.cashOut += amt;
        if (curr.payment_mode === 'UPI/Bank') acc.bankOut += amt;
      }
      return acc;
    }, { inflow: 0, outflow: 0, cashIn: 0, cashOut: 0, bankIn: 0, bankOut: 0, goldIn: 0, goldOut: 0 });
  }, [ledger]);

  // Profit and Loss calculations
  const pnlSummary = useMemo(() => {
    const catGroups: Record<string, number> = {};
    ledger.forEach(item => {
      const amt = num(item.amount);
      if (!catGroups[item.category]) catGroups[item.category] = 0;
      catGroups[item.category] += amt;
    });

    const revenue = catGroups['Sale'] || 0;
    const advances = catGroups['Advance'] || 0;
    
    const costOfGoods = catGroups['Purchase'] || 0;
    const labour = catGroups['Labour'] || 0;
    
    const operatingExpenses = 
      (catGroups['Salary'] || 0) +
      (catGroups['Rent'] || 0) +
      (catGroups['Office Expense'] || 0) +
      (catGroups['Others'] || 0);

    const grossProfit = revenue - costOfGoods - labour;
    const netProfit = grossProfit - operatingExpenses;

    return {
      revenue,
      advances,
      costOfGoods,
      labour,
      operatingExpenses,
      salaries: catGroups['Salary'] || 0,
      rent: catGroups['Rent'] || 0,
      officeExp: catGroups['Office Expense'] || 0,
      misc: catGroups['Others'] || 0,
      grossProfit,
      netProfit
    };
  }, [ledger]);

  const handleSaveTransaction = async () => {
    const amt = parseFloat(formAmount);
    if (!formDesc.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await (supabase as any).from('accounts_ledger').insert([{
        entry_date: todayStr,
        description: formDesc.trim(),
        type: formType,
        category: formCategory,
        payment_mode: formMode,
        amount: amt,
        gold_weight_g: parseFloat(formGoldWeight) || 0,
        recorded_by: formStaff || 'System'
      }]);

      if (error) throw error;

      Alert.alert('Success', 'Transaction recorded successfully');
      setShowAddModal(false);
      
      // Clear Form
      setFormAmount('');
      setFormGoldWeight('');
      setFormDesc('');
      setFormStaff('');
      
      fetchLedger();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save transaction: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const exportAccountsToCSV = async () => {
    if (ledger.length === 0) {
      Alert.alert('Export Error', 'No data to export for this range.');
      return;
    }

    try {
      const headers = ['Date', 'Description', 'Type', 'Category', 'Mode', 'Amount (INR)', 'Gold Wt (g)', 'Recorded By'];
      const rows = ledger.map(l => [
        l.entry_date,
        l.description,
        l.type,
        l.category,
        l.payment_mode,
        l.amount,
        l.gold_weight_g,
        l.recorded_by || 'System'
      ]);

      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts_ledger_${startDate}_to_${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const filename = `${FileSystem.documentDirectory}accounts_ledger_${startDate}_to_${endDate}.csv`;
        await FileSystem.writeAsStringAsync(filename, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Accounts Ledger</Text>
        <TouchableOpacity onPress={exportAccountsToCSV} style={styles.backBtn}>
          <Download size={22} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Board */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cash Net</Text>
          <Text style={[styles.statValue, { color: summaryTotals.cashIn >= summaryTotals.cashOut ? Theme.colors.status.success : Theme.colors.status.error }]}>
            ₹{(summaryTotals.cashIn - summaryTotals.cashOut).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Bank Net</Text>
          <Text style={[styles.statValue, { color: summaryTotals.bankIn >= summaryTotals.bankOut ? Theme.colors.status.success : Theme.colors.status.error }]}>
            ₹{(summaryTotals.bankIn - summaryTotals.bankOut).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Gold Net</Text>
          <Text style={[styles.statValue, { color: Theme.colors.primary }]}>
            {(summaryTotals.goldIn - summaryTotals.goldOut).toFixed(3)}g
          </Text>
        </View>
      </View>

      {/* Date Filter Card */}
      <View style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>SELECT LEDGER PERIOD</Text>
          <Filter size={16} color={Theme.colors.primary} />
        </View>
        <View style={styles.dateRow}>
          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>FROM</Text>
            <View style={styles.dateInputWrapper}>
              <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
              {Platform.OS === 'web' ? (
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '11px', width: '100%', fontWeight: '700' }}
                />
              ) : (
                <TextInput style={styles.dateText} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={Theme.colors.text.muted} />
              )}
            </View>
          </View>
          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>TO</Text>
            <View style={styles.dateInputWrapper}>
              <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
              {Platform.OS === 'web' ? (
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '11px', width: '100%', fontWeight: '700' }}
                />
              ) : (
                <TextInput style={styles.dateText} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={Theme.colors.text.muted} />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Screen Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'daybook' && styles.activeTabBtn]} onPress={() => setActiveTab('daybook')}>
          <Text style={[styles.tabText, activeTab === 'daybook' && styles.activeTabText]}>Day Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'ledger' && styles.activeTabBtn]} onPress={() => setActiveTab('ledger')}>
          <Text style={[styles.tabText, activeTab === 'ledger' && styles.activeTabText]}>All Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'pnl' && styles.activeTabBtn]} onPress={() => setActiveTab('pnl')}>
          <Text style={[styles.tabText, activeTab === 'pnl' && styles.activeTabText]}>Profit & Loss</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>
      ) : activeTab === 'daybook' ? (
        <FlatList
          data={dayBookData}
          keyExtractor={item => item.entry_date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          renderItem={({ item }) => {
            const netAmount = item.inflow - item.outflow;
            const netGold = item.gold_in - item.gold_out;
            return (
              <View style={styles.dayBookRow}>
                <View style={styles.dayBookHeader}>
                  <Text style={styles.dayBookDate}>{new Date(item.entry_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  <Text style={{ fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '700' }}>{item.count} Transactions</Text>
                </View>
                <View style={styles.dayBookGrid}>
                  <View style={styles.dayBookCol}>
                    <Text style={styles.dayBookLabel}>Inflow</Text>
                    <Text style={[styles.dayBookValue, { color: Theme.colors.status.success }]}>₹{item.inflow.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.dayBookCol}>
                    <Text style={styles.dayBookLabel}>Outflow</Text>
                    <Text style={[styles.dayBookValue, { color: Theme.colors.status.error }]}>₹{item.outflow.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.dayBookCol}>
                    <Text style={styles.dayBookLabel}>Net Balance</Text>
                    <Text style={[styles.dayBookValue, { color: netAmount >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>
                      ₹{netAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {netGold !== 0 && (
                    <View style={styles.dayBookCol}>
                      <Text style={styles.dayBookLabel}>Gold Net</Text>
                      <Text style={[styles.dayBookValue, { color: Theme.colors.primary }]}>{netGold.toFixed(3)}g</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No transactions recorded</Text></View>}
        />
      ) : activeTab === 'ledger' ? (
        <FlatList
          data={ledger}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          renderItem={({ item }) => {
            const isGain = item.type === 'INFLOW';
            return (
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerHeader}>
                  <Text style={styles.ledgerDate}>{new Date(item.entry_date).toLocaleDateString()} • {item.payment_mode}</Text>
                  <Text style={[styles.ledgerAmount, { color: isGain ? Theme.colors.status.success : Theme.colors.status.error }]}>
                    {isGain ? '+' : '-'}₹{num(item.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.ledgerDesc}>{item.description}</Text>
                {num(item.gold_weight_g) > 0 && (
                  <Text style={{ fontSize: 11, color: Theme.colors.primary, marginTop: 4, fontWeight: '700' }}>
                    Gold Weight: {item.gold_weight_g}g
                  </Text>
                )}
                <View style={styles.ledgerMeta}>
                  <Text style={styles.ledgerCategory}>{item.category}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <User size={12} color={Theme.colors.text.secondary} />
                    <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '600' }}>
                      {item.recorded_by || 'System'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No entries in this period</Text></View>}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.pnLContainer}>
          <View style={styles.pnLCard}>
            <Text style={styles.pnLTitle}>Revenue & Receipts</Text>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Sales Revenue</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.success }]}>₹{pnlSummary.revenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Customer Advances</Text>
              <Text style={styles.pnLValue}>₹{pnlSummary.advances.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.pnLRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.pnLLabel, { fontWeight: '800' }]}>Total Inflows</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.success, fontSize: 16 }]}>₹{(pnlSummary.revenue + pnlSummary.advances).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.pnLCard}>
            <Text style={styles.pnLTitle}>Cost of Sales (COGS)</Text>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Stock Purchases</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.error }]}>₹{pnlSummary.costOfGoods.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Labour Charges</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.error }]}>₹{pnlSummary.labour.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.pnLRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.pnLLabel, { fontWeight: '800' }]}>Total Cost of Sales</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.error, fontSize: 16 }]}>₹{(pnlSummary.costOfGoods + pnlSummary.labour).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={styles.pnLCard}>
            <Text style={styles.pnLTitle}>Operating Expenses</Text>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Rent</Text>
              <Text style={styles.pnLValue}>₹{pnlSummary.rent.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Salaries</Text>
              <Text style={styles.pnLValue}>₹{pnlSummary.salaries.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Office Expenses</Text>
              <Text style={styles.pnLValue}>₹{pnlSummary.officeExp.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Miscellaneous</Text>
              <Text style={styles.pnLValue}>₹{pnlSummary.misc.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.pnLRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={[styles.pnLLabel, { fontWeight: '800' }]}>Total Expenses</Text>
              <Text style={[styles.pnLValue, { color: Theme.colors.status.error, fontSize: 16 }]}>₹{pnlSummary.operatingExpenses.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={[styles.pnLCard, { borderColor: Theme.colors.primary, borderWidth: 2 }]}>
            <Text style={[styles.pnLTitle, { color: Theme.colors.primary }]}>Statement Summary</Text>
            <View style={styles.pnLRow}>
              <Text style={styles.pnLLabel}>Gross Margin</Text>
              <Text style={[styles.pnLValue, { color: pnlSummary.grossProfit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>₹{pnlSummary.grossProfit.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.pnLTotalRow}>
              <Text style={styles.pnLTotalLabel}>NET PROFIT / LOSS</Text>
              <Text style={[styles.pnLTotalValue, { color: pnlSummary.netProfit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>
                ₹{pnlSummary.netProfit.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Add Button for Inflow/Outflow */}
      {activeTab !== 'pnl' && (
        <TouchableOpacity style={styles.fab} onPress={() => {
          setFormType('OUTFLOW');
          setFormCategory('Office Expense');
          setFormMode('Cash');
          setShowAddModal(true);
        }}>
          <Plus size={28} color="black" />
        </TouchableOpacity>
      )}

      {/* Add Transaction Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Inflow/Outflow Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeOption, formType === 'INFLOW' && styles.typeOptionActive]} 
                  onPress={() => {
                    setFormType('INFLOW');
                    setFormCategory('Sale');
                  }}
                >
                  <Text style={[styles.tabText, formType === 'INFLOW' && styles.typeTextActive]}>INFLOW (Income)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeOption, formType === 'OUTFLOW' && styles.typeOptionActive]} 
                  onPress={() => {
                    setFormType('OUTFLOW');
                    setFormCategory('Office Expense');
                  }}
                >
                  <Text style={[styles.tabText, formType === 'OUTFLOW' && styles.typeTextActive]}>OUTFLOW (Expense)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.staffBtn, formCategory === cat && styles.staffBtnActive]} 
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text style={[styles.staffBtnText, formCategory === cat && styles.staffBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Payment Mode</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['Cash', 'UPI/Bank', 'Card', 'Gold Exchange'].map(mode => (
                    <TouchableOpacity 
                      key={mode} 
                      style={[styles.staffBtn, formMode === mode && styles.staffBtnActive, { flex: 1, justifyContent: 'center' }]} 
                      onPress={() => setFormMode(mode as any)}
                    >
                      <Text style={[styles.staffBtnText, formMode === mode && styles.staffBtnTextActive]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (₹)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.formInput} 
                    keyboardType="numeric" 
                    placeholder="0.00" 
                    placeholderTextColor={Theme.colors.text.muted} 
                    value={formAmount} 
                    onChangeText={setFormAmount} 
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gold Weight (g) - Optional</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.formInput} 
                    keyboardType="numeric" 
                    placeholder="0.000" 
                    placeholderTextColor={Theme.colors.text.muted} 
                    value={formGoldWeight} 
                    onChangeText={setFormGoldWeight} 
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <View style={styles.inputWrapper}>
                  <TextInput 
                    style={styles.formInput} 
                    placeholder="Enter details..." 
                    placeholderTextColor={Theme.colors.text.muted} 
                    value={formDesc} 
                    onChangeText={setFormDesc} 
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recorded By (Staff)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffScroll}>
                  {employees.map(emp => (
                    <TouchableOpacity 
                      key={emp.name} 
                      style={[styles.staffBtn, formStaff === emp.name && styles.staffBtnActive]} 
                      onPress={() => setFormStaff(emp.name)}
                    >
                      <User size={12} color={formStaff === emp.name ? 'black' : Theme.colors.text.secondary} />
                      <Text style={[styles.staffBtnText, formStaff === emp.name && styles.staffBtnTextActive]}>{emp.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                onPress={handleSaveTransaction}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={Theme.colors.text.black} /> : <Wallet size={20} color={Theme.colors.text.black} />}
                <Text style={styles.saveBtnText}>Save Entry</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
