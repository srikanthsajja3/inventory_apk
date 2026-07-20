import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, Alert, TextInput, useWindowDimensions } from 'react-native';
import { X, Package, Hash, Tag, MapPin, Calendar, Scale, Ruler, FileText, IndianRupee, User, Clock, History, Calculator, Edit2, ShoppingBag, Gem, ArrowDownLeft, ArrowUpRight, Shield, ChevronDown } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { Theme } from '../theme';
import { useJewelryCalc } from '../hooks/useJewelryCalc';
import OptimizedImage from './OptimizedImage';
import ImageModal from './ImageModal';

const styles = StyleSheet.create({
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
    color: Theme.colors.text.muted,
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
    color: Theme.colors.text.primary,
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
    color: Theme.colors.text.muted,
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
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: Theme.colors.text.muted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
  },
  sellModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: '100%',
        height: '100%',
      }
    })
  },
  sellModalContent: { 
    backgroundColor: Theme.colors.background, 
    borderRadius: Theme.radius.xl, 
    width: '90%',
    maxWidth: 340,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  sellHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Theme.spacing.md, 
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  modalTitle: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: Theme.spacing.md,
  },
  sellBody: { padding: Theme.spacing.md, justifyContent: 'center' },
  topInfo: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  imageSection: {
    width: 100,
    height: 100,
  },
  multiImageContainer: {
    width: 100,
    height: 100,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  primaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  itemSku: {
    fontSize: Theme.typography.size.sm,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  qtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.sm,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  qtyText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: Theme.typography.size.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  detailRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Theme.colors.surface,
    padding: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: Theme.colors.text.muted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: Theme.colors.text.primary,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.secondary,
    lineHeight: 22,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  footer: {
    padding: Theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  estimationBadge: {
    backgroundColor: Theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.lg,
    gap: 15,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  estIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  estLabel: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  estValue: {
    fontSize: 22,
    color: Theme.colors.primary,
    fontWeight: '900',
  },
  footerActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  estimateButton: {
    backgroundColor: Theme.colors.primary,
  },
  editButton: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  buttonText: {
    color: Theme.colors.text.black,
    fontSize: Theme.typography.size.md,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.muted,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
  },
  staffSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 6,
  },
  staffSelectBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  staffSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  staffSelectTextActive: {
    color: Theme.colors.text.black,
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    gap: 8,
  },
  saveButtonText: {
    color: Theme.colors.text.black,
    fontSize: Theme.typography.size.md,
    fontWeight: '700',
  },
  stoneListContainer: {
    gap: 12,
    marginTop: 0,
    marginBottom: 20,
  },
  stoneCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: 15,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '40',
    paddingBottom: 10,
  },
  stoneIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneMainInfo: {
    flex: 1,
  },
  stoneName: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  stoneCategory: {
    fontSize: 9,
    color: Theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  stoneCardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stoneGridItem: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stoneGridLabel: {
    fontSize: 8,
    color: Theme.colors.text.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stoneGridValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.colors.text.primary,
  },
  heroImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: Theme.colors.muted,
  },
  closeButtonFloating: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroImageScroll: {
    width: '100%',
    height: '100%',
  },
  heroImageTouch: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  detailsScrollView: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
  },
  productName: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.text.primary,
    flex: 1,
  },
  skuBadge: {
    backgroundColor: Theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    marginLeft: Theme.spacing.sm,
  },
  skuText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  adminBlock: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary + '30',
  },
  adminBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: 8,
  },
  adminBlockTitle: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Theme.spacing.sm,
  },
  adminGridItem: {
    width: '48%',
    backgroundColor: Theme.colors.muted,
    padding: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  adminGridItemSmall: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Theme.colors.muted,
    padding: Theme.spacing.sm - 2,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  adminLabel: {
    fontSize: 9,
    color: Theme.colors.text.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  adminValue: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  adminValueSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  adminStonesSection: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  adminStonesTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  adminStoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminStoneText: {
    fontSize: 12,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  adminStoneRate: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  adminStoneTextMuted: {
    fontSize: 11,
    color: Theme.colors.text.muted,
    fontStyle: 'italic',
  },
  adminSensitiveSection: {
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  historyToggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  historyToggleText: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
});

const HistoryItem = ({ log }: any) => {
  const isPositive = log.quantity_changed >= 0;
  const isScan = log.type === 'SCAN';
  const date = new Date(log.created_at).toLocaleDateString();
  const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let Icon = Package;
  let iconColor = Theme.colors.text.secondary;
  if (log.type === 'IN') { Icon = ArrowDownLeft; iconColor = Theme.colors.status.success; }
  if (log.type === 'OUT') { Icon = ArrowUpRight; iconColor = Theme.colors.status.error; }
  if (log.type === 'SCAN') { Icon = Clock; iconColor = Theme.colors.primary; }

  return (
    <View style={styles.historyItem}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '15', width: 36, height: 36, borderRadius: 10 }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailValue, { fontSize: 13 }]} numberOfLines={1}>{log.reason}</Text>
        <Text style={[styles.detailLabel, { fontSize: 10, marginTop: 2 }]}>{date} • {time}</Text>
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, icon: Icon }: any) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.iconContainer}>
        <Icon size={18} color={Theme.colors.primary} />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
};

const StoneDetailsList = ({ stonesJson }: { stonesJson: string | null }) => {
  if (!stonesJson) return null;
  
  try {
    const stones = JSON.parse(stonesJson);
    if (!Array.isArray(stones) || stones.length === 0) return null;

    return (
      <View style={{ gap: 20, marginBottom: 20 }}>
        {stones.map((stone: any, index: number) => (
          <View key={stone.id || index}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.5 }}>{stone.name?.toUpperCase() || 'STONE'}</Text>
              <Text style={{ fontSize: 9, color: Theme.colors.text.muted, fontWeight: '700' }}>{stone.category?.toUpperCase() || 'DETAIL'}</Text>
            </View>
            <View style={styles.grid}>
              <DetailRow label="Weight" value={stone.weight ? `${stone.weight}g` : '0g'} icon={Scale} />
              <DetailRow label="Pieces" value={stone.pcs || '0'} icon={Package} />
              {stone.rate && (
                <DetailRow 
                  label="Rate" 
                  value={`₹${parseFloat(String(stone.rate)).toLocaleString('en-IN')}`} 
                  icon={IndianRupee} 
                />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  } catch (e) {
    return <Text style={styles.detailValue}>{stonesJson}</Text>;
  }
};

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const EstimationBadge = ({ item }: { item: any }) => {
  const { calculateEstimation, loading } = useJewelryCalc();

  if (loading) return null;

  const total = calculateEstimation(item);
  if (total === 0) return null;

  return (
    <View style={{ marginBottom: Theme.spacing.lg }}>
      <View style={[styles.detailRow, { width: '100%', borderColor: Theme.colors.primary, borderWidth: 1.5, backgroundColor: Theme.colors.primary + '10' }]}>
        <View style={[styles.iconContainer, { backgroundColor: Theme.colors.primary, width: 36, height: 36, borderRadius: 10 }]}>
          <IndianRupee size={20} color="black" />
        </View>
        <View style={styles.detailTextContainer}>
          <Text style={[styles.detailLabel, { color: Theme.colors.primary, fontWeight: '800' }]}>ESTIMATE (18KT)</Text>
          <Text style={[styles.detailValue, { fontSize: 20, color: Theme.colors.text.primary, fontWeight: '900' }]}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
        </View>
      </View>
    </View>
  );
};

interface ItemDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: any;
  onEdit: (item: any) => void;
  onEstimate?: (item: any) => void;
}

export default function ItemDetailsModal({ isVisible, onClose, item, onEdit, onEstimate }: ItemDetailsModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const imageWidth = windowWidth;
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [selling, setSelling] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI/Bank' | 'Card' | 'Gold Exchange'>('Cash');
  const [previewGallery, setPreviewGallery] = useState<{ urls: string[], index: number } | null>(null);
  const { role, user } = useRole();
  const [showHistory, setShowHistory] = useState(false);
  const [showIdent, setShowIdent] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showRef, setShowRef] = useState(false);

  useEffect(() => {
    if (isVisible && item) {
      fetchLogs();
    }
  }, [isVisible, item, role]);

  useEffect(() => {
    if (showSellModal) {
      fetchEmployees();
    }
  }, [showSellModal]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('name').eq('is_active', true).order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (e: any) {
      console.error('Fetch Employees Error:', e.message);
    }
  };

  const fetchLogs = async () => {
    if (!item?.id) return;
    
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          quantity_changed,
          reason,
          created_at
        `)
        .eq('item_id', item.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (e: any) {
      console.error('Fetch Logs Error:', e.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const { calculateEstimation } = useJewelryCalc();

  const toggleEmployee = (name: string) => {
    setSelectedEmployees(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const handleSell = async () => {
    if (!item) return;

    const cleanAmount = saleAmount.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid sale amount');
      return;
    }

    if (selectedEmployees.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }

    try {
      setSelling(true);
      
      const staffNames = selectedEmployees.join(', ');
      const estimatedCost = calculateEstimation(item);
      const profitLoss = amount - estimatedCost;

      const { error: saleError } = await (supabase as any)
        .from('sales')
        .insert([{
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          prc_amount: estimatedCost,
          sale_amount: amount,
          profit_loss: profitLoss,
          payment_mode: paymentMode,
          sold_by: staffNames,
          sold_at: new Date().toISOString()
        }]);

      if (saleError) throw saleError;

      // Update item quantity to 0 (sold out)
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ quantity: 0 })
        .eq('id', item.id);

      if (itemUpdateError) throw itemUpdateError;

      await supabase.from('transactions').insert([{
        item_id: item.id,
        type: 'OUT',
        quantity_changed: 1,
        reason: `Sold for ₹${amount.toLocaleString()} by ${staffNames} via ${paymentMode}`
      }]);

      // Record transaction in accounts ledger (INFLOW)
      await (supabase as any).from('accounts_ledger').insert([{
        entry_date: new Date().toISOString().split('T')[0],
        description: `Sale of ${item.name} (SKU: ${item.sku || 'N/A'})`,
        type: 'INFLOW',
        category: 'Sale',
        payment_mode: paymentMode,
        amount: amount,
        gold_weight_g: 0,
        recorded_by: staffNames
      }]);

      Alert.alert('Success', `Item sold for ₹${amount.toLocaleString()}`);
      setShowSellModal(false);
      setSaleAmount('');
      setSelectedEmployees([]);
      onClose();
    } catch (error: any) {
      Alert.alert('Sale Failed', error.message);
    } finally {
      setSelling(false);
    }
  };

  let parsedStones: any[] = [];
  if (item && item.stones_in_detail) {
    try {
      const parsed = JSON.parse(item.stones_in_detail);
      if (Array.isArray(parsed)) {
        parsedStones = parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stones:', e);
    }
  }

  if (!item) return null;

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* 40% Image Section */}
          <View style={styles.heroImageContainer}>
            {/* Close Button floating over image */}
            <TouchableOpacity onPress={onClose} style={styles.closeButtonFloating}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {item.image_urls && item.image_urls.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={true} style={styles.heroImageScroll}>
                {item.image_urls.map((url: string, index: number) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.heroImageTouch, { width: imageWidth }]} 
                    onPress={() => setPreviewGallery({ urls: item.image_urls, index })}
                  >
                    <OptimizedImage url={url} width={400} height={400} resizeMode="cover" style={styles.heroImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : item.image_url ? (
              <TouchableOpacity 
                style={[styles.heroImageTouch, { width: imageWidth }]} 
                onPress={() => setPreviewGallery({ urls: [item.image_url], index: 0 })}
              >
                <OptimizedImage url={item.image_url} width={400} height={400} resizeMode="cover" style={styles.heroImage} />
              </TouchableOpacity>
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Package size={64} color={Theme.colors.border} />
              </View>
            )}
          </View>

          {/* 60% Details Section */}
          <View style={styles.detailsContainer}>
            <ScrollView style={styles.detailsScrollView} showsVerticalScrollIndicator={false}>
              
              {/* Product Header: Name and SKU */}
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.sku && (
                  <View style={styles.skuBadge}>
                    <Text style={styles.skuText}>{item.sku}</Text>
                  </View>
                )}
              </View>



              {/* Admin/Core Specifications Block */}
              <View style={styles.adminBlock}>
                <View style={styles.adminBlockHeader}>
                  <Shield size={16} color={Theme.colors.primary} />
                  <Text style={styles.adminBlockTitle}>Admin Specifications</Text>
                </View>
                
                <View style={styles.adminGrid}>
                  <View style={styles.adminGridItem}>
                    <Text style={styles.adminLabel}>Purity</Text>
                    <Text style={styles.adminValue}>{item.purity || 'N/A'}</Text>
                  </View>
                  <View style={styles.adminGridItem}>
                    <Text style={styles.adminLabel}>Gross Wt</Text>
                    <Text style={styles.adminValue}>{item.gross_wt ? `${item.gross_wt}g` : '0g'}</Text>
                  </View>
                  <View style={styles.adminGridItem}>
                    <Text style={styles.adminLabel}>Net Wt</Text>
                    <Text style={styles.adminValue}>{item.net_wt ? `${item.net_wt}g` : '0g'}</Text>
                  </View>
                </View>

                {/* Stones Summary inside Admin Block */}
                <View style={styles.adminStonesSection}>
                  <Text style={styles.adminStonesTitle}>Stones Overview</Text>
                  {parsedStones.length > 0 ? (
                    parsedStones.map((stone: any, idx: number) => {
                      const rawName = stone.name || 'Stone';
                      const nameUpper = rawName.toUpperCase();
                      const displayName = (nameUpper.includes('VVS') || nameUpper.includes('EF') || nameUpper.includes('RD') || nameUpper === 'DIAMOND') ? 'Diamond' : rawName;
                      return (
                        <View key={idx} style={{ marginBottom: 4 }}>
                          <Text style={styles.adminStoneText}>
                            • {displayName}: {stone.weight ? `${stone.weight}ct` : '0ct'}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.adminStoneTextMuted}>No stones details available</Text>
                  )}
                </View>

                {/* Sensitive Admin Costs Section (only show if role is admin and values exist) */}
                {role === 'admin' && (item.labour_rate || item.labour_amt || item.dia_purchase_amt || item.stone_purchase_amt) && (
                  <View style={styles.adminSensitiveSection}>
                    <Text style={styles.adminStonesTitle}>Purchase & Labour Details</Text>
                    <View style={styles.adminGrid}>
                      {item.labour_rate && (
                        <View style={styles.adminGridItemSmall}>
                          <Text style={styles.adminLabel}>Labour Rate</Text>
                          <Text style={styles.adminValueSmall}>₹{item.labour_rate}</Text>
                        </View>
                      )}
                      {item.labour_amt && (
                        <View style={styles.adminGridItemSmall}>
                          <Text style={styles.adminLabel}>Labour Amt</Text>
                          <Text style={styles.adminValueSmall}>₹{item.labour_amt}</Text>
                        </View>
                      )}
                      {item.dia_purchase_amt && (
                        <View style={styles.adminGridItemSmall}>
                          <Text style={styles.adminLabel}>Dia Purchase</Text>
                          <Text style={styles.adminValueSmall}>₹{item.dia_purchase_amt}</Text>
                        </View>
                      )}
                      {item.stone_purchase_amt && (
                        <View style={styles.adminGridItemSmall}>
                          <Text style={styles.adminLabel}>Stone Purchase</Text>
                          <Text style={styles.adminValueSmall}>₹{item.stone_purchase_amt}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* Identification Details Collapsible */}
              <TouchableOpacity 
                style={styles.historyToggleButton} 
                onPress={() => setShowIdent(!showIdent)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Package size={16} color={Theme.colors.primary} />
                  <Text style={styles.historyToggleText}>Identification Details</Text>
                </View>
                <ChevronDown 
                  size={16} 
                  color={Theme.colors.text.secondary} 
                  style={{ transform: [{ rotate: showIdent ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showIdent && (
                <View style={[styles.grid, { marginTop: 8, marginBottom: 12 }]}>
                  <DetailRow label="HUID" value={item.huid} icon={FileText} />
                  <DetailRow label="Size" value={item.size} icon={Ruler} />
                  <DetailRow label="Pcs" value={item.pcs} icon={Package} />
                  <DetailRow label="Wastage" value={item.wastage ? `${item.wastage}%` : null} icon={Scale} />
                </View>
              )}

              {/* Scan Tracking Collapsible */}
              <TouchableOpacity 
                style={styles.historyToggleButton} 
                onPress={() => setShowScan(!showScan)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <User size={16} color={Theme.colors.primary} />
                  <Text style={styles.historyToggleText}>Scan Tracking</Text>
                </View>
                <ChevronDown 
                  size={16} 
                  color={Theme.colors.text.secondary} 
                  style={{ transform: [{ rotate: showScan ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showScan && (
                <View style={[styles.grid, { marginTop: 8, marginBottom: 12 }]}>
                  <DetailRow label="Last Scanned By" value={item.last_scanned_by} icon={User} />
                  <DetailRow label="Last Scanned At" value={item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : null} icon={Clock} />
                </View>
              )}

              {/* Reference Collapsible */}
              <TouchableOpacity 
                style={styles.historyToggleButton} 
                onPress={() => setShowRef(!showRef)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color={Theme.colors.primary} />
                  <Text style={styles.historyToggleText}>Reference</Text>
                </View>
                <ChevronDown 
                  size={16} 
                  color={Theme.colors.text.secondary} 
                  style={{ transform: [{ rotate: showRef ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showRef && (
                <View style={[styles.grid, { marginTop: 8, marginBottom: 12 }]}>
                  <DetailRow label="Doc No" value={item.doc_no} icon={FileText} />
                  <DetailRow label="Doc Date" value={item.doc_date} icon={Calendar} />
                  <DetailRow label="Labeling Date" value={item.labeling_date} icon={Calendar} />
                  <DetailRow label="Quality" value={item.quality} icon={Tag} />
                  <DetailRow label="Location" value={item.location} icon={MapPin} />
                </View>
              )}

              {item.description && (
                <>
                  <SectionHeader title="Description" />
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </>
              )}

              <TouchableOpacity 
                style={styles.historyToggleButton} 
                onPress={() => setShowHistory(!showHistory)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <History size={16} color={Theme.colors.primary} />
                  <Text style={styles.historyToggleText}>Activity History</Text>
                </View>
                <ChevronDown 
                  size={16} 
                  color={Theme.colors.text.secondary} 
                  style={{ transform: [{ rotate: showHistory ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showHistory && (
                <View style={{ marginTop: 12 }}>
                  {loadingLogs ? (
                    <ActivityIndicator color={Theme.colors.primary} style={{ marginVertical: 20 }} />
                  ) : logs.length > 0 ? (
                    <View style={styles.historyContainer}>
                      {logs.map((log) => (
                        <HistoryItem key={log.id} log={log} />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyHistory}>
                      <Clock size={20} color={Theme.colors.border} />
                      <Text style={styles.emptyHistoryText}>No activity recorded yet</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <View style={styles.footerActions}>
                <TouchableOpacity 
                  style={[
                    styles.footerButton, 
                    { backgroundColor: Theme.colors.status.success }
                  ]} 
                  onPress={() => setShowSellModal(true)}
                >
                  <ShoppingBag size={20} color={Theme.colors.text.black} />
                  <Text style={styles.buttonText}>Sell</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.footerButton, styles.estimateButton]} 
                  onPress={() => {
                    onClose();
                    if (onEstimate) onEstimate(item);
                  }}
                >
                  <Calculator size={20} color={Theme.colors.text.black} />
                  <Text style={styles.buttonText}>Estimate</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.footerButton, styles.editButton, { flex: 0.5 }]} 
                  onPress={() => {
                    onClose();
                    onEdit(item);
                  }}
                >
                  <Edit2 size={18} color={Theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {previewGallery && (
            <ImageModal
              visible={!!previewGallery}
              onClose={() => setPreviewGallery(null)}
              urls={previewGallery.urls}
              initialIndex={previewGallery.index}
              title={item.name}
              netWt={item.net_wt}
              grossWt={item.gross_wt}
            />
          )}
        </View>

        {/* Sell Modal */}
        <Modal visible={showSellModal} transparent animationType="fade">
          <View style={styles.sellModalOverlay}>
            <View style={styles.sellModalContent}>
              <View style={styles.sellHeader}>
                <Text style={styles.modalTitle}>Confirm Sale</Text>
                <TouchableOpacity onPress={() => setShowSellModal(false)}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
              </View>
              <View style={styles.sellBody}>
                <Text style={[styles.detailLabel, { marginBottom: 12, fontSize: 14 }]} numberOfLines={1}>ITEM: {item.name}</Text>
                <Text style={[styles.detailLabel, { fontSize: 12 }]}>ENTER SALE AMOUNT (₹)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: Theme.colors.surface, marginTop: 8, borderWidth: 2, borderColor: Theme.colors.primary }]}>
                  <IndianRupee size={18} color={Theme.colors.primary} />
                  <TextInput 
                    style={[styles.input, { fontSize: 20, fontWeight: '800', color: Theme.colors.text.primary }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Theme.colors.text.muted}
                    value={saleAmount}
                    onChangeText={setSaleAmount}
                    autoFocus
                  />
                </View>

                <Text style={[styles.detailLabel, { marginTop: 15, marginBottom: 8, fontSize: 12 }]}>PAYMENT MODE</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {['Cash', 'UPI/Bank', 'Card', 'Gold Exchange'].map((mode) => (
                    <TouchableOpacity 
                      key={mode} 
                      style={[
                        styles.staffSelectBtn, 
                        paymentMode === mode && styles.staffSelectBtnActive,
                        { flex: 1, justifyContent: 'center', marginRight: 0, paddingVertical: 6 }
                      ]}
                      onPress={() => setPaymentMode(mode as any)}
                    >
                      <Text style={[
                        styles.staffSelectText,
                        paymentMode === mode && styles.staffSelectTextActive,
                        { fontSize: 9 }
                      ]}>{mode}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.detailLabel, { marginTop: 10, marginBottom: 8, fontSize: 12 }]}>SELECT STAFF</Text>
                <View style={{ minHeight: 45 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <TouchableOpacity 
                          key={emp.name}
                          style={[
                            styles.staffSelectBtn, 
                            selectedEmployees.includes(emp.name) && styles.staffSelectBtnActive,
                            { paddingVertical: 6 }
                          ]}
                          onPress={() => toggleEmployee(emp.name)}
                        >
                          <User size={14} color={selectedEmployees.includes(emp.name) ? Theme.colors.text.black : Theme.colors.text.secondary} />
                          <Text style={[
                            styles.staffSelectText,
                            selectedEmployees.includes(emp.name) && styles.staffSelectTextActive,
                            { fontSize: 11 }
                          ]}>{emp.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={{ paddingVertical: 5 }}>
                        <Text style={{ color: Theme.colors.status.error, fontSize: 10, fontWeight: '700' }}>
                          ⚠️ No staff found.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: Theme.colors.primary, marginTop: 15, paddingVertical: 12 }, (selling || selectedEmployees.length === 0) && { opacity: 0.7 }]}
                  onPress={handleSell}
                  disabled={selling || selectedEmployees.length === 0}
                >
                  {selling ? <ActivityIndicator color={Theme.colors.text.black} /> : <ShoppingBag size={18} color={Theme.colors.text.black} />}
                  <Text style={[styles.saveButtonText, { fontSize: 14 }]}>Confirm Sale</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
