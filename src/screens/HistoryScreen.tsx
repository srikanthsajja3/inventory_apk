import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Clock } from 'lucide-react-native';
import { supabase } from '../../supabase';

import { Theme } from '../theme';

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
    const isScan = item.type === 'SCAN';
    const date = new Date(item.created_at).toLocaleDateString();
    const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let badgeColor = Theme.colors.status.info;
    if (isIncoming) badgeColor = Theme.colors.status.success;
    if (item.type === 'OUT') badgeColor = Theme.colors.status.error;

    return (
      <View style={styles.card}>
        <View style={[styles.iconBadge, { backgroundColor: `${badgeColor}15` }]}>
          {isIncoming ? 
            <ArrowDownLeft size={20} color={badgeColor} /> : 
            (isScan ? <Clock size={20} color={badgeColor} /> : <ArrowUpRight size={20} color={badgeColor} />)
          }
        </View>
        <View style={styles.info}>
          <Text style={styles.itemName}>{item.items?.name || 'Deleted Item'}</Text>
          <View style={styles.metaRow}>
            <Clock size={12} color={Theme.colors.text.secondary} />
            <Text style={styles.metaText}>{date} • {time}</Text>
          </View>
          {item.reason && <Text style={[styles.metaText, { marginTop: 2 }]}>{item.reason}</Text>}
        </View>
        <View style={styles.qtyContainer}>
          <Text style={[styles.qtyText, { color: badgeColor }]}>
            {isIncoming ? '+' : (isScan ? '' : '-')}{item.quantity_changed}
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
          <RefreshCcw size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
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
              <Clock size={48} color={Theme.colors.border} />
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
    backgroundColor: Theme.colors.background,
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
    color: Theme.colors.text.primary,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 2,
      }
    }),
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
    color: Theme.colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
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
    color: Theme.colors.text.secondary,
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
    color: Theme.colors.text.primary,
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtext: {
    color: Theme.colors.text.secondary,
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});
