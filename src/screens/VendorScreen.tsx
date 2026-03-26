import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Users, Package, ShoppingCart, Weight, ChevronRight, ArrowLeft, Search } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface VendorStats {
  name: string;
  totalItems: number; // Different SKUs
  totalQty: number;   // Total units in stock
  totalNetWt: number; // Total weight in stock
  soldQty: number;    // Total units sold
  soldNetWt: number;  // Total weight sold
}

export default function VendorScreen() {
  const [vendors, setVendors] = useState<VendorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendorItems, setVendorItems] = useState<any[]>([]);
  const [vendorSales, setVendorSales] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewTab, setViewTab] = useState<'stock' | 'sales'>('stock');

  useEffect(() => {
    fetchVendorStats();
  }, []);

  const fetchVendorStats = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all items to group by vendor
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('supplier_name, quantity, net_wt, id, name, sku');
      
      if (itemsError) throw itemsError;

      // 2. Fetch all 'OUT' transactions to calculate sales per vendor
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('quantity_changed, item_id, created_at')
        .eq('type', 'OUT');

      if (transError) throw transError;

      // 3. Map items for easy lookup during transaction processing
      const itemsMap: Record<string, any> = {};
      items?.forEach(item => {
        itemsMap[item.id] = item;
      });

      // 4. Calculate sales per vendor
      const salesMap: Record<string, { qty: number, netWt: number }> = {};
      transactions?.forEach(t => {
        const item = itemsMap[t.item_id];
        if (item) {
          const vendorName = item.supplier_name || 'Unknown Vendor';
          if (!salesMap[vendorName]) {
            salesMap[vendorName] = { qty: 0, netWt: 0 };
          }
          salesMap[vendorName].qty += (t.quantity_changed || 0);
          salesMap[vendorName].netWt += (t.quantity_changed || 0) * (parseFloat(item.net_wt) || 0);
        }
      });

      // 5. Group and calculate inventory stats
      const group: Record<string, VendorStats> = {};
      
      items?.forEach(item => {
        const vendorName = item.supplier_name || 'Unknown Vendor';
        if (!group[vendorName]) {
          group[vendorName] = {
            name: vendorName,
            totalItems: 0,
            totalQty: 0,
            totalNetWt: 0,
            soldQty: 0,
            soldNetWt: 0
          };
        }
        
        const qty = (item.quantity || 0);
        const netWt = (parseFloat(item.net_wt) || 0);
        
        group[vendorName].totalItems += 1;
        group[vendorName].totalQty += qty;
        group[vendorName].totalNetWt += (qty * netWt);
        
        if (salesMap[vendorName]) {
          group[vendorName].soldQty = salesMap[vendorName].qty;
          group[vendorName].soldNetWt = salesMap[vendorName].qty * netWt; // This is a bit simplified if net_wt varies per item in same vendor, but salesMap above handles it better
        }
      });

      // Re-assign sold stats from the more accurate salesMap
      Object.keys(group).forEach(vendorName => {
        if (salesMap[vendorName]) {
          group[vendorName].soldQty = salesMap[vendorName].qty;
          group[vendorName].soldNetWt = salesMap[vendorName].netWt;
        }
      });

      setVendors(Object.values(group).sort((a, b) => b.totalQty - a.totalQty));
    } catch (error: any) {
      console.error('Vendor Stats Error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVendorDetails = async (vendorName: string) => {
    try {
      setDetailLoading(true);
      setSelectedVendor(vendorName);
      setViewTab('stock');
      
      // Fetch Stock
      const { data: stock, error: stockError } = await supabase
        .from('items')
        .select('*')
        .eq('supplier_name', vendorName)
        .order('name');
      
      if (stockError) throw stockError;
      setVendorItems(stock || []);

      // Fetch Sales (Transactions)
      const itemIds = stock?.map(i => i.id) || [];
      if (itemIds.length > 0) {
        const { data: sales, error: salesError } = await supabase
          .from('transactions')
          .select('*, items(name, sku, net_wt)')
          .eq('type', 'OUT')
          .in('item_id', itemIds)
          .order('created_at', { ascending: false });
        
        if (salesError) throw salesError;
        setVendorSales(sales || []);
      }

    } catch (error: any) {
      console.error('Vendor Detail Error:', error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorStats();
  };

  const renderVendorCard = ({ item }: { item: VendorStats }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => fetchVendorDetails(item.name)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorIcon}>
          <Users size={20} color="#6366f1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vendorName}>{item.name}</Text>
          <Text style={styles.vendorSubtitle}>{item.totalItems} SKUs</Text>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Package size={14} color="#6366f1" />
          <Text style={styles.statLabel}>In Stock</Text>
          <Text style={styles.statValue}>{item.totalQty}</Text>
          <Text style={styles.statSubValue}>{item.totalNetWt.toFixed(2)}g</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }]}>
          <ShoppingCart size={14} color="#10b981" />
          <Text style={styles.statLabel}>Sold</Text>
          <Text style={styles.statValue}>{item.soldQty}</Text>
          <Text style={styles.statSubValue}>{item.soldNetWt.toFixed(2)}g</Text>
        </View>
        <View style={styles.statBox}>
          <Weight size={14} color="#f59e0b" />
          <Text style={styles.statLabel}>Total Net Wt</Text>
          <Text style={styles.statValue}>{(item.totalNetWt + item.soldNetWt).toFixed(2)}g</Text>
          <Text style={styles.statSubValue}>Life-time</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItemDetail = ({ item }: any) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSku}>{item.sku}</Text>
      </View>
      <View style={styles.itemStats}>
        <Text style={styles.itemWt}>{item.net_wt}g</Text>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{item.quantity}</Text>
        </View>
      </View>
    </View>
  );

  const renderSaleDetail = ({ item }: any) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.items?.name}</Text>
        <Text style={styles.itemSku}>{item.items?.sku}</Text>
        <Text style={styles.saleDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.itemStats}>
        <Text style={[styles.itemWt, { color: '#10b981' }]}>Sold</Text>
        <View style={[styles.qtyBadge, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.qtyText, { color: '#10b981' }]}>{item.quantity_changed}</Text>
        </View>
      </View>
    </View>
  );

  if (selectedVendor) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedVendor(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{selectedVendor}</Text>
            <Text style={styles.subtitle}>Vendor Analytics</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, viewTab === 'stock' && styles.activeTab]} 
            onPress={() => setViewTab('stock')}
          >
            <Package size={18} color={viewTab === 'stock' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.tabText, viewTab === 'stock' && styles.activeTabText]}>Current Stock ({vendorItems.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, viewTab === 'sales' && styles.activeTab]} 
            onPress={() => setViewTab('sales')}
          >
            <ShoppingCart size={18} color={viewTab === 'sales' ? '#6366f1' : '#64748b'} />
            <Text style={[styles.tabText, viewTab === 'sales' && styles.activeTabText]}>Sales History ({vendorSales.length})</Text>
          </TouchableOpacity>
        </View>

        {detailLoading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color="#6366f1" />
        ) : (
          <FlatList
            data={viewTab === 'stock' ? vendorItems : vendorSales}
            renderItem={viewTab === 'stock' ? renderItemDetail : renderSaleDetail}
            keyExtractor={(item, index) => item.id + index}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {viewTab === 'stock' ? 'No items in stock.' : 'No sales recorded yet.'}
              </Text>
            }
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Analytics</Text>
      <Text style={styles.subtitle}>Performance and stock by supplier</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#6366f1" />
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendorCard}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No vendor data available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 6,
    marginBottom: 20,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#f5f3ff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vendorName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  vendorSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  statSubValue: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  saleDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  itemStats: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemWt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  qtyBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  }
});
