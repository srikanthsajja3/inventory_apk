import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Clock } from 'lucide-react-native';
import { supabase } from '../../supabase';

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // We join with the items table to get the item name
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          items (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isIncoming = item.type === 'IN';
    const date = new Date(item.created_at).toLocaleDateString();
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={[styles.iconBadge, { backgroundColor: isIncoming ? '#f0fdf4' : '#fff7ed' }]}>
          {isIncoming ? 
            <ArrowDownLeft size={20} color="#15803d" /> : 
            <ArrowUpRight size={20} color="#c2410c" />
          }
        </View>
        <View style={styles.info}>
          <Text style={styles.itemName}>{item.items?.name || 'Deleted Item'}</Text>
          <View style={styles.metaRow}>
            <Clock size={12} color="#94a3b8" />
            <Text style={styles.metaText}>{date} • {time}</Text>
          </View>
        </View>
        <View style={styles.qtyContainer}>
          <Text style={[styles.qtyText, { color: isIncoming ? '#15803d' : '#c2410c' }]}>
            {isIncoming ? '+' : '-'}{item.quantity_changed}
          </Text>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Log</Text>
        <TouchableOpacity onPress={fetchHistory} style={styles.refreshButton}>
          <RefreshCcw size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList 
          data={transactions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No activity recorded yet</Text>
              <Text style={styles.emptySubtext}>Adjust stock levels to see history here</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  qtyContainer: {
    alignItems: 'flex-end',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '800',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#1e293b',
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});
