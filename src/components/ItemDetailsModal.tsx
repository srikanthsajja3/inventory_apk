import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator } from 'react-native';
import { X, Package, Hash, Tag, MapPin, Calendar, Scale, Ruler, FileText, IndianRupee, User, Clock, History } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface ItemDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: any;
  onEdit: (item: any) => void;
}

const HistoryItem = ({ log }: any) => {
  const date = new Date(log.created_at).toLocaleString();
  const isPositive = log.quantity_changed >= 0;

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={[styles.typeBadge, { backgroundColor: log.type === 'IN' ? '#ecfdf5' : log.type === 'OUT' ? '#fef2f2' : '#f1f5f9' }]}>
          <Text style={[styles.typeText, { color: log.type === 'IN' ? '#10b981' : log.type === 'OUT' ? '#ef4444' : '#64748b' }]}>
            {log.type}
          </Text>
        </View>
        <Text style={styles.historyDate}>{date}</Text>
      </View>
      
      <View style={styles.historyContent}>
        <View style={styles.historyMain}>
          <Text style={styles.historyReason}>{log.reason}</Text>
          <View style={styles.userRow}>
            <User size={12} color="#94a3b8" />
            <Text style={styles.historyUser}>Admin System</Text>
          </View>
        </View>
        <View style={styles.qtyChange}>
          <Text style={[styles.qtyChangeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
            {isPositive ? '+' : ''}{log.quantity_changed}
          </Text>
        </View>
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, icon: Icon }: any) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.iconContainer}>
        <Icon size={18} color="#6366f1" />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

export default function ItemDetailsModal({ isVisible, onClose, item, onEdit }: ItemDetailsModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isVisible && item) {
      fetchLogs();
    }
  }, [isVisible, item]);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Logs Error:', error.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!item) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ... topInfo, grid sections ... */}
            <View style={styles.topInfo}>
              <View style={styles.imageContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Package size={48} color="#cbd5e1" />
                  </View>
                )}
              </View>
              <View style={styles.primaryInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantity} in stock</Text>
                </View>
              </View>
            </View>

            <SectionHeader title="Identification" />
            <View style={styles.grid}>
              <DetailRow label="Label No" value={item.label_no} icon={Hash} />
              <DetailRow label="HUID" value={item.huid} icon={FileText} />
              <DetailRow label="Purity" value={item.purity} icon={Tag} />
              <DetailRow label="Size" value={item.size} icon={Ruler} />
            </View>

            <SectionHeader title="Weights & Pieces" />
            <View style={styles.grid}>
              <DetailRow label="Pcs" value={item.pcs} icon={Package} />
              <DetailRow label="Gross Wt" value={item.gross_wt ? `${item.gross_wt}g` : null} icon={Scale} />
              <DetailRow label="Net Wt" value={item.net_wt ? `${item.net_wt}g` : null} icon={Scale} />
              <DetailRow label="Wastage" value={item.wastage ? `${item.wastage}g` : null} icon={Scale} />
            </View>

            <SectionHeader title="Activity History" />
            {loadingLogs ? (
              <ActivityIndicator color="#6366f1" style={{ marginVertical: 20 }} />
            ) : logs.length > 0 ? (
              <View style={styles.historyContainer}>
                {logs.map((log) => (
                  <HistoryItem key={log.id} log={log} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <Clock size={24} color="#cbd5e1" />
                <Text style={styles.emptyHistoryText}>No activity recorded yet</Text>
              </View>
            )}

            <SectionHeader title="Purchase & Labour" />
            <View style={styles.grid}>
              <DetailRow label="Labour Rate" value={item.labour_rate ? `₹${item.labour_rate}` : null} icon={IndianRupee} />
              <DetailRow label="Labour Amt" value={item.labour_amt ? `₹${item.labour_amt}` : null} icon={IndianRupee} />
              <DetailRow label="Dia Purchase" value={item.dia_purchase_amt ? `₹${item.dia_purchase_amt}` : null} icon={IndianRupee} />
              <DetailRow label="Stone Purchase" value={item.stone_purchase_amt ? `₹${item.stone_purchase_amt}` : null} icon={IndianRupee} />
              <DetailRow label="Purch Wastage" value={item.purch_wastage_rate ? `${item.purch_wastage_rate}%` : null} icon={Tag} />
              <DetailRow label="Other Charges" value={item.other_charges ? `₹${item.other_charges}` : null} icon={IndianRupee} />
            </View>

            <SectionHeader title="Reference" />
            <View style={styles.grid}>
              <DetailRow label="Doc No" value={item.doc_no} icon={FileText} />
              <DetailRow label="Doc Date" value={item.doc_date} icon={Calendar} />
              <DetailRow label="Labeling Date" value={item.labeling_date} icon={Calendar} />
              <DetailRow label="Quality" value={item.quality} icon={Tag} />
              <DetailRow label="Location" value={item.location} icon={MapPin} />
            </View>

            {item.description && (
              <>
                <SectionHeader title="Description" />
                <Text style={styles.descriptionText}>{item.description}</Text>
              </>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => {
                onClose();
                onEdit(item);
              }}
            >
              <Text style={styles.editButtonText}>Edit Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  historyDate: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMain: {
    flex: 1,
  },
  historyReason: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  historyUser: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  qtyChange: {
    paddingLeft: 12,
  },
  qtyChangeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 24,
  },
  topInfo: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  qtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  qtyText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailRow: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  editButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
