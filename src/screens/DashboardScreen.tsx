import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform, FlatList } from 'react-native';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock, Settings, X, Save, RefreshCw, Coins, Diamond, UserPlus, UserMinus, Shield, User as UserIcon, ShoppingBag, Users, Trash2, Plus, TrendingUp } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { Theme } from '../theme';

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
      // Use upsert for batch update instead of loop
      const updates = rates.map(rate => ({
        id: rate.id,
        value: rate.value,
        key: rate.key,
        label: rate.label,
        category: rate.category
      }));

      const { error } = await supabase.from('master_rates').upsert(updates);
      if (error) throw error;

      Alert.alert('Success', 'Settings updated successfully');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedRates = rates.reduce((acc: any, curr: any) => {
    const cat = curr.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>System Settings</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
              Object.keys(groupedRates).map(cat => (
                <View key={cat} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{cat.toUpperCase()}</Text>
                  {groupedRates[cat].map((rate: any) => (
                    <View key={rate.id} style={styles.rateInputGroup}>
                      <Text style={styles.rateLabel}>{rate.label}</Text>
                      <View style={styles.rateInputWrapper}>
                        <TextInput
                          style={styles.rateInput}
                          value={String(rate.value)}
                          onChangeText={(v) => handleUpdate(rate.id, v)}
                          keyboardType="numeric"
                          placeholderTextColor={Theme.colors.text.muted}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={saveRates}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={Theme.colors.text.black} /> : <Save size={20} color={Theme.colors.text.black} />}
            <Text style={styles.saveBtnText}>Save All Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const EmployeeManagementModal = ({ isVisible, onClose }: any) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isVisible) fetchEmployees();
  }, [isVisible]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (e: any) {
      Alert.alert('Database Error', 'Failed to fetch staff: ' + e.message + '\n\nEnsure you have run the latest SQL migration.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      const { error } = await supabase.from('employees').insert([{ name: name.toUpperCase().trim() }]);
      if (error) throw error;
      setName('');
      fetchEmployees();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const toggleStatus = async (emp: any) => {
    try {
      await supabase.from('employees').update({ is_active: !emp.is_active }).eq('id', emp.id);
      fetchEmployees();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      fetchEmployees();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Staff Directory</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
          </View>

          <View style={styles.userForm}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.userInput, { flex: 1 }]} 
                placeholder="Enter Staff Name" 
                value={name} 
                onChangeText={setName} 
                placeholderTextColor={Theme.colors.text.muted}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.userAddBtn} onPress={handleAdd}>
                <Plus size={24} color={Theme.colors.text.black} />
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={employees}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userRowName, !item.is_active && { color: Theme.colors.text.muted }]}>{item.name}</Text>
                  <Text style={styles.userRowRole}>{item.is_active ? 'Active' : 'Inactive'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleStatus(item)} style={{ marginRight: 15 }}>
                  <Shield size={20} color={item.is_active ? Theme.colors.status.success : Theme.colors.text.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteEmployee(item.id)}>
                  <Trash2 size={20} color={Theme.colors.status.error} />
                </TouchableOpacity>
              </View>
            )}
            style={{ flex: 1, marginTop: 20 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Users size={48} color={Theme.colors.border} />
                <Text style={{ color: Theme.colors.text.muted, marginTop: 10 }}>No staff added yet</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const UserManagementModal = ({ isVisible, onClose }: any) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'staff', email: '' });

  useEffect(() => {
    if (isVisible) fetchUsers();
  }, [isVisible]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_users').select('*').order('username');
    setUsers(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.username || !form.password) {
      Alert.alert('Error', 'Username and Password are required');
      return;
    }
    try {
      const { error } = await supabase.from('app_users').upsert({
        username: form.username.toUpperCase().trim(),
        password: form.password,
        role: form.role,
        email: form.email,
        is_active: true
      });
      if (error) throw error;
      Alert.alert('Success', 'User saved successfully');
      setEditingUser(null);
      setForm({ username: '', password: '', role: 'staff', email: '' });
      fetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      await supabase.from('app_users').update({ is_active: !user.is_active }).eq('username', user.username);
      fetchUsers();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Management</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
          </View>

          <View style={styles.userForm}>
            <TextInput 
              style={styles.userInput} 
              placeholder="Username" 
              value={form.username} 
              onChangeText={v => setForm({...form, username: v})} 
              placeholderTextColor={Theme.colors.text.muted}
              autoCapitalize="characters"
            />
            <TextInput 
              style={styles.userInput} 
              placeholder="Password" 
              value={form.password} 
              onChangeText={v => setForm({...form, password: v})} 
              placeholderTextColor={Theme.colors.text.muted}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                    style={[styles.roleBtn, form.role === 'admin' && styles.roleBtnActive]} 
                    onPress={() => setForm({...form, role: 'admin'})}
                >
                    <Text style={[styles.roleBtnText, form.role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleBtn, form.role === 'staff' && styles.roleBtnActive]} 
                    onPress={() => setForm({...form, role: 'staff'})}
                >
                    <Text style={[styles.roleBtnText, form.role === 'staff' && styles.roleBtnTextActive]}>Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.userAddBtn} onPress={handleSave}>
                    <UserPlus size={20} color={Theme.colors.text.black} />
                </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={users}
            keyExtractor={item => item.username}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userRowName}>{item.username} <Text style={styles.userRowRole}>({item.role})</Text></Text>
                  <Text style={styles.userRowPass}>PW: {item.password}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleStatus(item)}>
                  <Shield size={20} color={item.is_active ? Theme.colors.status.success : Theme.colors.text.muted} />
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setForm({ username: item.username, password: item.password, role: item.role, email: item.email || '' })}>
                    <Settings size={20} color={Theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            style={{ flex: 1, marginTop: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function DashboardScreen({ onUpdateGoldRate, onManageStones, onEstimation, onNavigate }: { onUpdateGoldRate?: () => void, onManageStones?: () => void, onEstimation?: (item: any) => void, onNavigate?: (tab: string) => void }) {
  const [stats, setStats] = useState({ total: 0, lowStock: 0, salesToday: 0, inventoryValue: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [staffStats, setStaffStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const { role } = useRole();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: settings } = await supabase.from('master_rates').select('*');
      const threshold = settings?.find(s => s.key === 'low_stock_threshold')?.value || 5;
      const goldRate = settings?.find(s => s.key === 'gold_18kt')?.value || 0;
      const diamondRate = settings?.find(s => s.key === 'diamond_rd_rate')?.value || 65000;
      const stoneRate = settings?.find(s => s.key === 'stone_rate')?.value || 3500;
      const certRate = settings?.find(s => s.key === 'cert_rate_per_ct')?.value || 950;
      const taxPct = settings?.find(s => s.key === 'tax_gst_pct')?.value || 3;

      const { data: allItems, count: totalCount } = await supabase.from('items').select('*', { count: 'exact' });
      const lowCount = (allItems || []).filter(i => (i.quantity || 0) < threshold).length;

      // Calculate Total Inventory Value
      const totalInventoryValue = (allItems || []).reduce((acc, item) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        if (qty <= 0) return acc;

        const netWt = parseFloat(String(item.net_wt)) || 0;
        const wastagePct = parseFloat(String(item.wastage)) || 22;
        const billingWt = netWt * (1 + (wastagePct / 100));
        const goldValue = billingWt * goldRate;

        const daiWt = parseFloat(String(item.dai_wt)) || 0;
        const clrStoneWt = parseFloat(String(item.clr_stone_wt)) || 0;
        const stonesValue = (daiWt * diamondRate) + (clrStoneWt * stoneRate);

        const labourAmt = parseFloat(String(item.labour_amt)) || 0;
        const certCharges = (item.name || '').trim().toUpperCase().startsWith('D') ? (daiWt * certRate) : 0;
        const otherCharges = parseFloat(String(item.other_charges)) || 0;

        const itemTotal = (goldValue + stonesValue + labourAmt + certCharges + otherCharges) * (1 + (taxPct / 100));
        return acc + (itemTotal * qty);
      }, 0);

      // Today's Sales
      const today = new Date();
      today.setHours(0,0,0,0);
      const { data: todaySales } = await supabase.from('sales').select('sale_amount, profit_loss').gte('sold_at', today.toISOString());
      
      const salesTotal = (todaySales || []).reduce((acc, s) => acc + (parseFloat(String(s.sale_amount)) || 0), 0);

      // Staff Analytics
      const { data: allSales } = await supabase.from('sales').select('sale_amount, prc_amount, sold_by').order('sold_at', { ascending: false });
      
      const staffMap = (allSales || []).reduce((acc: any, curr: any) => {
        const staff = curr.sold_by || 'Unknown';
        const saleAmt = parseFloat(String(curr.sale_amount)) || 0;
        const purchaseAmt = parseFloat(String(curr.prc_amount)) || 0;
        const profit = saleAmt - purchaseAmt;

        if (!acc[staff]) acc[staff] = { name: staff, count: 0, sales: 0, profit: 0 };
        acc[staff].count += 1;
        acc[staff].sales += saleAmt;
        acc[staff].profit += profit;
        return acc;
      }, {});

      setStaffStats(Object.values(staffMap).sort((a: any, b: any) => b.sales - a.sales));

      const { data: activity } = await supabase.from('transactions').select('*, items(*)').order('created_at', { ascending: false }).limit(5);

      setStats({
        total: totalCount || 0,
        lowStock: lowCount || 0,
        salesToday: salesTotal,
        inventoryValue: totalInventoryValue
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
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
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
            <Coins size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
          
          {role === 'admin' && (
            <>
              <TouchableOpacity 
                style={styles.ratesBtn}
                onPress={onManageStones}
              >
                <Diamond size={20} color={Theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.ratesBtn}
                onPress={() => setShowEmployeesModal(true)}
              >
                <Users size={20} color={Theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.ratesBtn}
                onPress={() => setShowUsersModal(true)}
              >
                <UserIcon size={20} color={Theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.ratesBtn}
                onPress={() => setShowRatesModal(true)}
              >
                <Settings size={20} color={Theme.colors.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Theme.colors.surface }]}>
          <View style={[styles.iconBadge, { backgroundColor: Theme.colors.primary + '20' }]}>
            <Package size={24} color={Theme.colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Theme.colors.surface }]}>
          <View style={[styles.iconBadge, { backgroundColor: Theme.colors.status.success + '20' }]}>
            <ShoppingBag size={24} color={Theme.colors.status.success} />
          </View>
          <Text style={styles.statValue}>₹{stats.salesToday.toLocaleString('en-IN')}</Text>
          <Text style={styles.statLabel}>Today's Sales</Text>
        </View>
      </View>

      {role === 'admin' && (
        <View style={{ marginBottom: 15 }}>
          <View style={[styles.adminActionCard, { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }]}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Coins size={24} color="white" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.adminActionTitle, { color: 'white' }]}>Total Inventory Value</Text>
              <Text style={[styles.adminActionSub, { color: 'rgba(255,255,255,0.8)' }]}>Estimated worth of current stock</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: 'white' }}>₹{stats.inventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          </View>
        </View>
      )}

      {role === 'admin' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Performance</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {staffStats.map((staff, idx) => (
              <View key={idx} style={styles.staffCard}>
                <Text style={styles.staffName}>{staff.name}</Text>
                <Text style={styles.staffSales}>₹{staff.sales.toLocaleString('en-IN')}</Text>
                <View style={styles.staffMeta}>
                  <Text style={styles.staffMetaText}>{staff.count} Sales</Text>
                  <Text style={[styles.staffMetaText, { color: staff.profit >= 0 ? Theme.colors.status.success : Theme.colors.status.error }]}>
                    ₹{staff.profit.toLocaleString('en-IN')} P/L
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={styles.adminActionCard}
            onPress={() => onNavigate && onNavigate('sales')}
          >
            <View style={[styles.iconBadge, { backgroundColor: Theme.colors.status.success + '20' }]}>
              <TrendingUp size={24} color={Theme.colors.status.success} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.adminActionTitle}>Full Sales Analytics</Text>
              <Text style={styles.adminActionSub}>Detailed Profit/Loss breakdown</Text>
            </View>
            <ArrowUpRight size={20} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={onRefresh}>
          <RefreshCw size={16} color={Theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        {recentActivity.length > 0 ? (
          recentActivity.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => onEstimation && onEstimation(item.items)}
            >
              <ActivityItem 
                type={item.type} 
                item={item.items?.name || 'Item'} 
                qty={`${item.type === 'IN' ? '+' : '-'}${item.quantity_changed}`} 
                time={new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyActivity}>
            <Clock size={32} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No recent movements</Text>
          </View>
        )}
      </View>

      <MasterRatesModal 
        isVisible={showRatesModal} 
        onClose={() => setShowRatesModal(false)} 
      />

      <EmployeeManagementModal
        isVisible={showEmployeesModal}
        onClose={() => setShowEmployeesModal(false)}
      />

      <UserManagementModal
        isVisible={showUsersModal}
        onClose={() => setShowUsersModal(false)}
      />
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const ActivityItem = ({ type, item, qty, time }: any) => (
  <View style={styles.activityItem}>
    <View style={[styles.iconBadge, { backgroundColor: Theme.colors.muted }]}>
      {type === 'IN' ? 
        <ArrowDownLeft size={18} color={Theme.colors.status.success} /> : 
        <ArrowUpRight size={18} color={Theme.colors.status.error} />
      }
    </View>
    <View style={styles.activityInfo}>
      <Text style={styles.activityText} numberOfLines={1}>{item}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <Text style={[styles.activityQty, { color: type === 'IN' ? Theme.colors.status.success : Theme.colors.status.error }]}>
      {qty}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  ratesBtn: {
    padding: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
    color: Theme.colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  adminActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  adminActionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  adminActionSub: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  activityList: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 30,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
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
    color: Theme.colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: Theme.colors.text.muted,
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
    color: Theme.colors.text.muted,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: '85%',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
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
    color: Theme.colors.text.primary,
  },
  modalBody: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 25,
    backgroundColor: Theme.colors.surface,
    padding: 15,
    borderRadius: 20,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginBottom: 15,
    letterSpacing: 1,
  },
  rateInputGroup: {
    marginBottom: 15,
  },
  rateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    marginBottom: 6,
  },
  rateInputWrapper: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 15,
  },
  rateInput: {
    paddingVertical: 10,
    fontSize: 15,
    color: Theme.colors.text.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
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
    color: Theme.colors.text.black,
    fontSize: 16,
    fontWeight: '700',
  },
  // User Management
  userForm: {
    backgroundColor: Theme.colors.surface,
    padding: 15,
    borderRadius: 20,
    gap: 12,
  },
  userInput: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    padding: 12,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  roleBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  roleBtnTextActive: {
    color: Theme.colors.text.black,
  },
  userAddBtn: {
    backgroundColor: Theme.colors.primary,
    width: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    marginBottom: 10,
  },
  userRowName: {
    color: Theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  userRowRole: {
    color: Theme.colors.primary,
    fontSize: 11,
  },
  userRowPass: {
    color: Theme.colors.text.muted,
    fontSize: 12,
    marginTop: 2,
  },
  staffCard: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  staffSales: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    marginVertical: 4,
  },
  staffMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  staffMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.text.muted,
  }
});
