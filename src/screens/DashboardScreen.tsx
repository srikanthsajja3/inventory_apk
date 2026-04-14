import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock, Settings, X, Save, RefreshCw, Coins } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';

const MasterRatesModal = ({ isVisible, onClose }: any) => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isVisible) fetchRates();
  }, [isVisible]);

  const fetchRates = async () => {
    setLoading(true);
    const { data } = await supabase.from('master_rates').select('*').order('category');
    setRates(data || []);
    setLoading(false);
  };

  const handleUpdate = (id: string, value: string) => {
    setRates(rates.map(r => r.id === id ? { ...r, value: parseFloat(value) || 0 } : r));
  };

  const saveRates = async () => {
    setSaving(true);
    try {
      for (const rate of rates) {
        await supabase.from('master_rates').update({ value: rate.value }).eq('id', rate.id);
      }
      Alert.alert('Success', 'Rates updated successfully');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Master Rates Management</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#64748b" /></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
            ) : (
              rates.map(rate => (
                <View key={rate.id} style={styles.rateInputGroup}>
                  <Text style={styles.rateLabel}>{rate.label}</Text>
                  <View style={styles.rateInputWrapper}>
                    <TextInput
                      style={styles.rateInput}
                      value={String(rate.value)}
                      onChangeText={(v) => handleUpdate(rate.id, v)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={saveRates}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Save size={20} color="white" />}
            <Text style={styles.saveBtnText}>Save All Rates</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function DashboardScreen({ onUpdateGoldRate }: { onUpdateGoldRate?: () => void }) {
  const [stats, setStats] = useState({ total: 0, lowStock: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const { role } = useRole();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { count: totalCount, error: totalError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      const { count: lowCount, error: lowError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 5);

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
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.title}>Inventory Overview</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={styles.ratesBtn}
            onPress={onUpdateGoldRate}
          >
            <Coins size={20} color="#f59e0b" />
          </TouchableOpacity>
          
          {role === 'admin' && (
            <TouchableOpacity 
              style={styles.ratesBtn}
              onPress={() => setShowRatesModal(true)}
            >
              <Settings size={20} color="#6366f1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#eef2ff' }]}>
          <View style={[styles.iconBadge, { backgroundColor: '#6366f115' }]}>
            <Package size={24} color="#6366f1" />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
          <View style={[styles.iconBadge, { backgroundColor: '#ef444415' }]}>
            <AlertTriangle size={24} color="#ef4444" />
          </View>
          <Text style={styles.statValue}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={onRefresh}>
          <RefreshCw size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

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

      <MasterRatesModal 
        isVisible={showRatesModal} 
        onClose={() => setShowRatesModal(false)} 
      />
      
      <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  ratesBtn: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      }
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'flex-start',
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      }
    }),
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 10,
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0 2px 15px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
      }
    }),
    marginBottom: 30,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 15,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  activityQty: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyActivity: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    flex: 1,
  },
  rateInputGroup: {
    marginBottom: 20,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  rateInputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15,
  },
  rateInput: {
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
