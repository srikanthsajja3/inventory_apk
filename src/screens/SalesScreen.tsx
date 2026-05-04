import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, IndianRupee, TrendingUp, TrendingDown, Clock, ArrowLeft, RefreshCw, ShoppingBag, User } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const num = (v: any) => parseFloat(String(v)) || 0;

export default function SalesScreen({ onBack }: { onBack: () => void }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setStats] = useState({ totalSales: 0, totalProfit: 0, count: 0 });

  const fetchSales = async () => {
    try {
      if (!refreshing) setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sold_at', { ascending: false });

      if (error) throw error;

      setSales(data || []);
      
      const stats = (data || []).reduce((acc: any, curr: any) => {
        const saleAmt = num(curr.sale_amount);
        const purchaseAmt = num(curr.prc_amount);
        acc.totalSales += saleAmt;
        acc.totalProfit += (saleAmt - purchaseAmt);
        acc.count += 1;
        return acc;
      }, { totalSales: 0, totalProfit: 0, count: 0 });

      setStats(stats);
    } catch (error: any) {
      console.error('Sales Fetch Error:', error.message);
      Alert.alert('Error', 'Failed to load sales history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const renderSaleItem = ({ item }: { item: any }) => {
    const saleAmt = num(item.sale_amount);
    const purchaseAmt = num(item.prc_amount);
    const profit = saleAmt - purchaseAmt;
    
    const isProfit = profit > 0;
    const isLoss = profit < 0;
    const date = new Date(item.sold_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
      <View style={styles.saleCard}>
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
          </View>
          <View style={[styles.plBadge, { 
            backgroundColor: isProfit ? Theme.colors.status.success + '20' : isLoss ? Theme.colors.status.error + '20' : Theme.colors.muted 
          }]}>
            <Text style={[styles.plText, { 
              color: isProfit ? Theme.colors.status.success : isLoss ? Theme.colors.status.error : Theme.colors.text.secondary 
            }]}>
              {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>SOLD FOR</Text>
            <Text style={[styles.detailValue, { color: Theme.colors.primary }]}>₹{saleAmt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: Theme.colors.text.muted, fontWeight: '900' }}>-</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>PURCHASE</Text>
            <Text style={styles.detailValue}>₹{purchaseAmt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: Theme.colors.text.muted, fontWeight: '900' }}>=</Text>
          </View>
          <View style={[styles.detailBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.detailLabel}>NET P/L</Text>
            <Text style={[styles.detailValue, { color: isProfit ? Theme.colors.status.success : isLoss ? Theme.colors.status.error : Theme.colors.text.primary }]}>
               {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <User size={12} color={Theme.colors.text.muted} />
            <Text style={styles.footerText}>{item.sold_by}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Clock size={12} color={Theme.colors.text.muted} />
            <Text style={styles.footerText}>{date}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={Theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sales & P/L Report</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
          <View style={[styles.statBox, { backgroundColor: Theme.colors.surface }]}>
            <Text style={styles.statLabel}>TOTAL SALES</Text>
            <Text style={[styles.statValue, { color: Theme.colors.primary }]}>₹{summary.totalSales.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Theme.colors.surface }]}>
            <Text style={styles.statLabel}>NET PROFIT/LOSS</Text>
            <Text style={[styles.statValue, { color: summary.totalProfit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>
              ₹{summary.totalProfit.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Theme.colors.surface }]}>
            <Text style={styles.statLabel}>ITEMS SOLD</Text>
            <Text style={styles.statValue}>{summary.count}</Text>
          </View>
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ShoppingBag size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No sales recorded yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  refreshBtn: {
    padding: 8,
  },
  summaryContainer: {
    paddingVertical: 15,
  },
  summaryScroll: {
    paddingHorizontal: 20,
    gap: 15,
  },
  statBox: {
    padding: 15,
    borderRadius: 20,
    minWidth: 160,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.text.primary,
  },
  list: {
    padding: 20,
    gap: 15,
  },
  saleCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  itemSku: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  plBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  plText: {
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderStyle: 'dashed',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: Theme.colors.text.muted,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 15,
  },
  emptyText: {
    color: Theme.colors.text.muted,
    fontSize: 16,
    fontWeight: '600',
  },
});
