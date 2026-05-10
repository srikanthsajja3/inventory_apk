import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, TrendingUp, TrendingDown, Clock, ArrowLeft, RefreshCw, ShoppingBag, User, Download, Calendar as CalendarIcon, Filter } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  backBtn: { padding: 8, backgroundColor: Theme.colors.surface, borderRadius: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary },
  scrollContent: { padding: 20 },
  filterCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dateInputGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  dateInput: {
    flex: 1,
    color: Theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  exportBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
    gap: 8,
  },
  exportBtnText: {
    color: Theme.colors.text.black,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: { flexDirection: 'row', gap: 15, marginBottom: 20, paddingHorizontal: 20 },
  summaryCard: { flex: 1, backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Theme.colors.border },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: Theme.colors.text.secondary, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800', color: Theme.colors.text.primary },
  list: { paddingBottom: 40 },
  saleCard: { backgroundColor: Theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, marginHorizontal: 20, borderWidth: 1, borderColor: Theme.colors.border },
  saleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  saleDate: { fontSize: 11, color: Theme.colors.text.muted, fontWeight: '600' },
  saleInfo: { gap: 4 },
  itemName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary },
  itemSku: { fontSize: 11, color: Theme.colors.text.secondary },
  saleMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  staffBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  staffName: { fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary },
  amountBox: { alignItems: 'flex-end' },
  saleAmount: { fontSize: 16, fontWeight: '800', color: Theme.colors.primary },
  profitBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  profitText: { fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Theme.colors.text.secondary, marginTop: 10, fontSize: 16, fontWeight: '600' }
});

const num = (v: any) => parseFloat(String(v)) || 0;

export default function SalesScreen({ onBack }: { onBack: () => void }) {
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];
  
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const fetchSales = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      let query = supabase.from('sales').select('*').order('sold_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('sold_at', `${startDate}T00:00:00Z`);
      }
      if (endDate) {
        query = query.lte('sold_at', `${endDate}T23:59:59Z`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Sales Fetch Error:', error.message);
      Alert.alert('Error', 'Failed to load sales history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSales(); }, [startDate, endDate]);
  const onRefresh = () => { setRefreshing(true); fetchSales(); };

  const summary = useMemo(() => {
    return sales.reduce((acc: any, curr: any) => {
      const saleAmt = num(curr.sale_amount);
      const purchaseAmt = num(curr.prc_amount);
      acc.totalSales += saleAmt;
      acc.totalProfit += (saleAmt - purchaseAmt);
      acc.count += 1;
      return acc;
    }, { totalSales: 0, totalProfit: 0, count: 0 });
  }, [sales]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentMode = showPicker;
    setShowPicker(null);
    
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (currentMode === 'start') setStartDate(dateStr);
      else if (currentMode === 'end') setEndDate(dateStr);
    }
  };

  const exportToCSV = async () => {
    if (sales.length === 0) {
      Alert.alert('Export Error', 'No sales data to export for this range.');
      return;
    }

    try {
      const headers = ['Date', 'Item Name', 'SKU', 'Sale Amount', 'Purchase Amount', 'Profit/Loss', 'Sold By'];
      const rows = sales.map(s => [
        new Date(s.sold_at).toLocaleString(),
        s.item_name,
        s.sku || 'N/A',
        s.sale_amount,
        s.prc_amount,
        s.profit_loss,
        s.sold_by
      ]);

      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${startDate}_to_${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const filename = `${FileSystem.documentDirectory}sales_report_${startDate}_to_${endDate}.csv`;
        await FileSystem.writeAsStringAsync(filename, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(filename);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={Theme.colors.text.primary} /></TouchableOpacity>
        <Text style={styles.title}>Sales History</Text>
      </View>

      <View style={styles.filterCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.filterTitle}>DATE FILTER</Text>
          <Filter size={16} color={Theme.colors.primary} />
        </View>
        
        <View style={styles.dateRow}>
          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>START DATE</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputWrapper}>
                <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    outline: 'none',
                    fontSize: '12px',
                    width: '100%',
                    fontWeight: '700'
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowPicker('start')}>
                <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
                <Text style={styles.dateInput}>{startDate}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateInputGroup}>
            <Text style={styles.dateLabel}>END DATE</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputWrapper}>
                <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    outline: 'none',
                    fontSize: '12px',
                    width: '100%',
                    fontWeight: '700'
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowPicker('end')}>
                <CalendarIcon size={14} color={Theme.colors.text.muted} style={{ marginRight: 6 }} />
                <Text style={styles.dateInput}>{endDate}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
          <Download size={18} color={Theme.colors.text.black} />
          <Text style={styles.exportBtnText}>EXPORT AS CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>₹{summary.totalSales.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Profit</Text>
          <Text style={[styles.summaryValue, { color: summary.totalProfit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>₹{summary.totalProfit.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date(showPicker === 'start' ? startDate : endDate)}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={sales}
          contentContainerStyle={styles.list}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          renderItem={({ item }) => {
            const profit = num(item.sale_amount) - num(item.prc_amount);
            return (
              <View style={styles.saleCard}>
                <View style={styles.saleHeader}>
                  <Text style={styles.saleDate}>{new Date(item.sold_at).toLocaleString()}</Text>
                  <ShoppingBag size={16} color={Theme.colors.primary} />
                </View>
                <View style={styles.saleInfo}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <Text style={styles.itemSku}>SKU: {item.item_sku || 'N/A'}</Text>
                </View>
                <View style={styles.saleMeta}>
                  <View style={styles.staffBox}>
                    <User size={14} color={Theme.colors.text.secondary} />
                    <Text style={styles.staffName}>{item.sold_by || 'Unknown'}</Text>
                  </View>
                  <View style={styles.amountBox}>
                    <Text style={styles.saleAmount}>₹{num(item.sale_amount).toLocaleString('en-IN')}</Text>
                    <View style={[styles.profitBadge, { backgroundColor: profit >= 0 ? Theme.colors.status.success + '20' : Theme.colors.status.error + '20' }]}>
                      <Text style={[styles.profitText, { color: profit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>
                        {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No sales recorded for this period</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}
