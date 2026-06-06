import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Platform, TextInput } from 'react-native';
import { Users, Package, ShoppingCart, Weight, ChevronRight, ArrowLeft, Search, X } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  summaryCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }
    })
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 15,
    padding: 6,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  activeTabText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.2)' },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorIcon: {
    width: 40,
    height: 40,
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  vendorSubtitle: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginTop: 2,
  },
  statSubValue: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  itemSku: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  saleDate: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    marginTop: 4,
  },
  itemStats: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemWt: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  qtyBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.text.secondary,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text.primary,
    paddingVertical: 8,
    marginLeft: 10,
  },
});

interface VendorStats {
  name: string;
  totalItems: number; 
  totalQty: number;   
  totalNetWt: number; 
  goldNetWt: number;    // Net weight of gold-only items
  diamondNetWt: number; // Gold weight of diamond items
  diamondCt: number;    // Diamond carats/weight
  soldQty: number;    
  soldNetWt: number;  
}

export default function VendorScreen() {
  const [vendors, setVendors] = useState<VendorStats[]>([]);
  const [totals, setTotals] = useState({ gold: 0, diamond: 0, carats: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
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
        .select('supplier_name, net_wt, dai_wt, id, name, sku');
      
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
          const itemNetWt = item.net_wt ? parseFloat(item.net_wt) : 0;
          salesMap[vendorName].netWt += (t.quantity_changed || 0) * itemNetWt;
        }
      });

      // 5. Group and calculate inventory stats
      const group: Record<string, VendorStats> = {};
      let globalGold = 0;
      let globalDiamond = 0;
      let globalCarats = 0;
      
      items?.forEach(item => {
        const vendorName = item.supplier_name || 'Unknown Vendor';
        if (!group[vendorName]) {
          group[vendorName] = {
            name: vendorName,
            totalItems: 0,
            totalQty: 0,
            totalNetWt: 0,
            goldNetWt: 0,
            diamondNetWt: 0,
            diamondCt: 0,
            soldQty: 0,
            soldNetWt: 0
          };
        }
        
        const qty = 1;
        const netWt = (parseFloat(item.net_wt as any) || 0);
        const daiWt = (parseFloat(item.dai_wt as any) || 0);
        
        group[vendorName].totalItems += 1;
        group[vendorName].totalQty += qty;
        group[vendorName].totalNetWt += (qty * netWt);
        
        // Split Gold vs Diamond
        if (daiWt > 0) {
          group[vendorName].diamondNetWt += (qty * netWt);
          group[vendorName].diamondCt += (qty * daiWt);
          globalDiamond += (qty * netWt);
          globalCarats += (qty * daiWt);
        } else {
          group[vendorName].goldNetWt += (qty * netWt);
          globalGold += (qty * netWt);
        }
        
        if (salesMap[vendorName]) {
          group[vendorName].soldQty = salesMap[vendorName].qty;
          group[vendorName].soldNetWt = salesMap[vendorName].qty * netWt; 
        }
      });

      setTotals({ gold: globalGold, diamond: globalDiamond, carats: globalCarats });

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
          .select('*, items(name, sku, net_wt, dai_wt)')
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

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderVendorCard = ({ item }: { item: VendorStats }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => fetchVendorDetails(item.name)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorIcon}>
          <Users size={20} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.vendorName}>{item.name}</Text>
          <Text style={styles.vendorSubtitle}>{item.totalItems} SKUs • {item.totalQty} items</Text>
        </View>
        <ChevronRight size={20} color={Theme.colors.text.secondary} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: Theme.colors.status.info }]}>Gold Stock</Text>
          <Text style={styles.statValue}>{item.goldNetWt.toFixed(2)}g</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: Theme.colors.primary }]}>Diamond Stock</Text>
          <Text style={styles.statValue}>{item.diamondNetWt.toFixed(2)}g</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: Theme.colors.status.success }]}>Diamond Wt</Text>
          <Text style={styles.statValue}>{item.diamondCt.toFixed(3)}ct</Text>
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
        <Text style={styles.itemWt}>G: {item.net_wt}g</Text>
        {parseFloat(item.dai_wt) > 0 && <Text style={[styles.itemWt, { color: Theme.colors.status.success }]}>D: {item.dai_wt}ct</Text>}
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
        <Text style={[styles.itemWt, { color: Theme.colors.status.success }]}>Sold</Text>
      </View>
    </View>
  );

  if (selectedVendor) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedVendor(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color={Theme.colors.text.primary} />
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
            <Package size={18} color={viewTab === 'stock' ? Theme.colors.primary : Theme.colors.text.secondary} />
            <Text style={[styles.tabText, viewTab === 'stock' && styles.activeTabText]}>Current Stock ({vendorItems.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, viewTab === 'sales' && styles.activeTab]} 
            onPress={() => setViewTab('sales')}
          >
            <ShoppingCart size={18} color={viewTab === 'sales' ? Theme.colors.primary : Theme.colors.text.secondary} />
            <Text style={[styles.tabText, viewTab === 'sales' && styles.activeTabText]}>Sales History ({vendorSales.length})</Text>
          </TouchableOpacity>
        </View>

        {detailLoading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={Theme.colors.primary} />
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

      {!loading && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Inventory (All Vendors)</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Theme.colors.status.info }]}>Total Gold</Text>
              <Text style={styles.summaryValue}>{totals.gold.toFixed(2)}g</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Theme.colors.primary }]}>Diamond Gold</Text>
              <Text style={styles.summaryValue}>{totals.diamond.toFixed(2)}g</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Theme.colors.status.success }]}>Total Diamonds</Text>
              <Text style={styles.summaryValue}>{totals.carats.toFixed(3)}ct</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.searchBar}>
        <Search size={20} color={Theme.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors by name..."
          placeholderTextColor={Theme.colors.text.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={18} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={Theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorCard}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>{search ? 'No vendors matching your search' : 'No vendor data available'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
