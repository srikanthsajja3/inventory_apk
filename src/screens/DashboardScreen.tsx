import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react-native';
import { supabase } from '../../supabase';

export default function DashboardScreen() {
  const [stats, setStats] = useState({ total: 0, lowStock: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Total Items
      const { count: totalCount, error: totalError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Low Stock Items (Quantity < 5)
      const { count: lowCount, error: lowError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 5);

      // 3. Fetch Recent Transactions
      const { data: activity, error: activityError } = await supabase
        .from('transactions')
        .select(`
          *,
          items (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (totalError || lowError || activityError) throw totalError || lowError || activityError;

      setStats({
        total: totalCount || 0,
        lowStock: lowCount || 0
      });
      setRecentActivity(activity || []);
      
    } catch (error: any) {
      console.error('Dashboard Fetch Error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Inventory Overview</Text>
      
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#e0f2fe' }]}>
          <Package size={24} color="#0369a1" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
          <AlertTriangle size={24} color="#b91c1c" />
          <Text style={styles.statValue}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {recentActivity.length > 0 ? (
          recentActivity.map((item) => (
            <ActivityItem 
              key={item.id}
              type={item.type} 
              item={item.items?.name || 'Item'} 
              qty={`${item.type === 'IN' ? '+' : '-'}${item.quantity_changed}`} 
              time={new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
            />
          ))
        ) : (
          <View style={styles.emptyActivity}>
            <Clock size={32} color="#e2e8f0" />
            <Text style={styles.emptyText}>No recent movements</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const ActivityItem = ({ type, item, qty, time }: any) => (
  <View style={styles.activityItem}>
    <View style={[styles.iconBadge, { backgroundColor: type === 'IN' ? '#f0fdf4' : '#fff7ed' }]}>
      {type === 'IN' ? 
        <ArrowDownLeft size={18} color="#15803d" /> : 
        <ArrowUpRight size={18} color="#c2410c" />
      }
    </View>
    <View style={styles.activityInfo}>
      <Text style={styles.activityText} numberOfLines={1}>{item}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <Text style={[styles.activityQty, { color: type === 'IN' ? '#15803d' : '#c2410c' }]}>
      {qty}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 30,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginBottom: 30,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activityQty: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyActivity: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
  },
});
