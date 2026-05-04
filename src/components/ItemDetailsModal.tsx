import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import { X, Package, Hash, Tag, MapPin, Calendar, Scale, Ruler, FileText, IndianRupee, User, Clock, History, Calculator, Edit2, ShoppingBag } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { Theme } from '../theme';

interface ItemDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: any;
  onEdit: (item: any) => void;
  onEstimate?: (item: any) => void;
}

const HistoryItem = ({ log }: any) => {
  const date = new Date(log.created_at).toLocaleString();
  const isPositive = log.quantity_changed >= 0;
  const isScan = log.type === 'SCAN';

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={[styles.typeBadge, { 
          backgroundColor: isScan ? Theme.colors.muted : log.type === 'IN' ? Theme.colors.status.success + '20' : log.type === 'OUT' ? Theme.colors.status.error + '20' : Theme.colors.muted 
        }]}>
          <Text style={[styles.typeText, { 
            color: isScan ? Theme.colors.primary : log.type === 'IN' ? Theme.colors.status.success : log.type === 'OUT' ? Theme.colors.status.error : Theme.colors.text.secondary 
          }]}>
            {log.type}
          </Text>
        </View>
        <Text style={styles.historyDate}>{date}</Text>
      </View>
      
      <View style={styles.historyContent}>
        <View style={styles.historyMain}>
          <Text style={styles.historyReason}>{log.reason}</Text>
          <View style={styles.userRow}>
            <User size={12} color={Theme.colors.text.muted} />
            <Text style={styles.historyUser}>{log.reason.includes('by') ? log.reason.split('by')[1].trim().split('(')[0].trim() : 'System'}</Text>
          </View>
        </View>
        {!isScan && (
          <View style={styles.qtyChange}>
            <Text style={[styles.qtyChangeText, { color: isPositive ? Theme.colors.status.success : Theme.colors.status.error }]}>
              {isPositive ? '+' : ''}{log.quantity_changed}
            </Text>
          </View>
        )}
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

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);

const EstimationBadge = ({ item }: { item: any }) => {
  const [rates, setRates] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await supabase
          .from('master_rates')
          .select('key, value');
        if (data) {
          const rateMap: any = {};
          data.forEach(r => { rateMap[r.key] = r.value; });
          setRates(rateMap);
        }
      } catch (e) {
        console.error('Rates Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, [item.id]);

  if (loading || Object.keys(rates).length === 0) return null;

  const num = (v: any) => parseFloat(String(v)) || 0;
  const goldRate = rates.gold_18kt || 0;
  const diamondRate = rates.diamond_rd_rate || 65000;
  const stoneRate = rates.stone_rate || 3500;
  const certRate = rates.cert_rate_per_ct || 950;
  const taxPct = rates.tax_gst_pct || 3;

  const grossWt = num(item.gross_wt);
  const wastagePct = num(item.wastage || rates.default_wastage_pct || 22);
  const netWt = num(item.net_wt) || (grossWt * 0.8);
  const billingWt = netWt * (1 + (wastagePct / 100));
  const goldValue = billingWt * goldRate;
  
  const isDiamond = item.name && item.name.trim().toUpperCase().startsWith('D');
  
  // Tiered Special D Rule
  const t1Limit = num(rates.special_d_tier1_weight || 5.2);
  const t1Labor = num(rates.special_d_tier1_labor || 10000);
  const t2Limit = num(rates.special_d_tier2_weight || 8.0);
  const t2Labor = num(rates.special_d_tier2_labor || 12000);
  const defaultLaborDiamond = num(rates.default_labor_diamond || 1200);
  const defaultLaborRegular = num(rates.default_labor_regular || 550);

  let makingValue = netWt * (isDiamond ? defaultLaborDiamond : defaultLaborRegular);

  if (isDiamond) {
    if (netWt <= t1Limit && netWt > 0) {
      makingValue = t1Labor;
    } else if (netWt < t2Limit && netWt > t1Limit) {
      makingValue = t2Labor;
    }
  }
  
  let stonesValue = 0;
  try {
    if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
      const stones = JSON.parse(item.stones_in_detail);
      stonesValue = stones.reduce((acc: number, s: any) => {
        const sWt = num(s.weight);
        const sPcs = num(s.pcs);
        const sRate = num(s.rate);
        return acc + (sWt === 0 ? sPcs * sRate : sWt * sRate);
      }, 0);
    } else {
      stonesValue = (num(item.dai_wt) * diamondRate) + (num(item.clr_stone_wt) * stoneRate);
    }
  } catch (e) {
    stonesValue = (num(item.dai_wt) * diamondRate) + (num(item.clr_stone_wt) * stoneRate);
  }

  const certCharges = isDiamond ? (num(item.dai_wt) * certRate) : 0;
  const total = (goldValue + stonesValue + makingValue + certCharges) * (1 + (taxPct / 100));

  return (
    <View style={styles.estimationBadge}>
      <View style={styles.estIconContainer}>
        <IndianRupee size={16} color={Theme.colors.status.success} />
      </View>
      <View>
        <Text style={styles.estLabel}>Approx. Estimate (18KT)</Text>
        <Text style={styles.estValue}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
      </View>
    </View>
  );
};

export default function ItemDetailsModal({ isVisible, onClose, item, onEdit, onEstimate }: ItemDetailsModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [selling, setSelling] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const { role, user } = useRole();

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
    // ... (keep fetchLogs implementation)
  };

  const handleSell = async () => {
    if (!item || (item.quantity || 0) <= 0) {
      Alert.alert('Error', 'This item is out of stock and cannot be sold.');
      return;
    }

    const cleanAmount = saleAmount.replace(/,/g, '');
    const amount = parseFloat(cleanAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid sale amount');
      return;
    }

    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select a staff member');
      return;
    }

    try {
      setSelling(true);
      
      // Calculate real purchase price (estimated value) for P/L
      const { data: ratesData } = await supabase.from('master_rates').select('key, value');
      const rates: any = {};
      ratesData?.forEach(r => { rates[r.key] = r.value; });

      const numVal = (v: any) => parseFloat(String(v)) || 0;
      const goldRate = rates.gold_18kt || 0;
      const diamondRate = rates.diamond_rd_rate || 65000;
      const stoneRate = rates.stone_rate || 3500;
      const certRate = rates.cert_rate_per_ct || 950;
      const taxPct = rates.tax_gst_pct || 3;

      const grossWt = numVal(item.gross_wt);
      const wastagePct = numVal(item.wastage || rates.default_wastage_pct || 22);
      const netWt = numVal(item.net_wt) || (grossWt * 0.8);
      const billingWt = netWt * (1 + (wastagePct / 100));
      const goldValue = billingWt * goldRate;
      
      const isDiamond = item.name && item.name.trim().toUpperCase().startsWith('D');
      
      const t1Limit = numVal(rates.special_d_tier1_weight || 5.2);
      const t1Labor = numVal(rates.special_d_tier1_labor || 10000);
      const t2Limit = numVal(rates.special_d_tier2_weight || 8.0);
      const t2Labor = numVal(rates.special_d_tier2_labor || 12000);
      const defaultLaborDiamond = numVal(rates.default_labor_diamond || 1200);
      const defaultLaborRegular = numVal(rates.default_labor_regular || 550);

      let makingValue = netWt * (isDiamond ? defaultLaborDiamond : defaultLaborRegular);
      if (isDiamond) {
        if (netWt <= t1Limit && netWt > 0) makingValue = t1Labor;
        else if (netWt < t2Limit && netWt > t1Limit) makingValue = t2Labor;
      }
      
      let stonesValue = 0;
      try {
        if (item.stones_in_detail && item.stones_in_detail.startsWith('[')) {
          const stones = JSON.parse(item.stones_in_detail);
          stonesValue = stones.reduce((acc: number, s: any) => {
            const sWt = numVal(s.weight);
            const sPcs = numVal(s.pcs);
            const sRate = numVal(s.rate);
            return acc + (sWt === 0 ? sPcs * sRate : sWt * sRate);
          }, 0);
        } else {
          stonesValue = (numVal(item.dai_wt) * diamondRate) + (numVal(item.clr_stone_wt) * stoneRate);
        }
      } catch (e) {
        stonesValue = (numVal(item.dai_wt) * diamondRate) + (numVal(item.clr_stone_wt) * stoneRate);
      }

      const certCharges = isDiamond ? (numVal(item.dai_wt) * certRate) : 0;
      const otherCharges = numVal(item.other_charges);
      const estimatedCost = (goldValue + stonesValue + makingValue + certCharges + otherCharges) * (1 + (taxPct / 100));

      const profitLoss = amount - estimatedCost;

      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          item_id: item.id,
          sku: item.sku,
          item_name: item.name,
          prc_amount: estimatedCost,
          sale_amount: amount,
          profit_loss: profitLoss,
          sold_by: selectedEmployee,
          sold_at: new Date().toISOString()
        }]);

      if (saleError) throw saleError;

      const newQty = Math.max(0, (item.quantity || 1) - 1);
      const { error: itemError } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', item.id);

      if (itemError) throw itemError;

      await supabase.from('transactions').insert([{
        item_id: item.id,
        type: 'OUT',
        quantity_changed: 1,
        reason: `Sold for ₹${amount.toLocaleString()} by ${selectedEmployee}`
      }]);

      Alert.alert('Success', `Item sold for ₹${amount.toLocaleString()}`);
      setShowSellModal(false);
      setSaleAmount('');
      setSelectedEmployee('');
      onClose();
    } catch (error: any) {
      Alert.alert('Sale Failed', error.message);
    } finally {
      setSelling(false);
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
              <X size={24} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.topInfo}>
              <View style={styles.imageSection}>
                {item.image_urls && item.image_urls.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiImageContainer}>
                    {item.image_urls.map((url: string, index: number) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: url }} style={styles.itemImage} />
                      </View>
                    ))}
                  </ScrollView>
                ) : item.image_url ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                      <Package size={48} color={Theme.colors.border} />
                    </View>
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

            <EstimationBadge item={item} />

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
              <DetailRow label="Net Wt" value={item.net_wt ? `${item.net_wt}g` : null} icon={Scale} />
              <DetailRow label="Gross Wt" value={item.gross_wt ? `${item.gross_wt}g` : null} icon={Scale} />
              <DetailRow label="Wastage" value={item.wastage ? `${item.wastage}%` : null} icon={Scale} />
            </View>

            <SectionHeader title="Stones & Detail" />
            <View style={styles.grid}>
              <DetailRow label="Stone Wt" value={item.clr_stone_wt ? `${item.clr_stone_wt}g` : null} icon={Scale} />
              <DetailRow label="Stone Pcs" value={item.clr_stone_pcs} icon={Hash} />
              <DetailRow label="Stones Detail" value={item.stones_in_detail} icon={FileText} />
            </View>

            <SectionHeader title="Scan Tracking" />
            <View style={styles.grid}>
              <DetailRow label="Last Scanned By" value={item.last_scanned_by} icon={User} />
              <DetailRow label="Last Scanned At" value={item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleString() : null} icon={Clock} />
            </View>

            <SectionHeader title="Activity History" />
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
                <Clock size={24} color={Theme.colors.border} />
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
            <View style={styles.footerActions}>
              <TouchableOpacity 
                style={[
                  styles.footerButton, 
                  { backgroundColor: Theme.colors.status.success },
                  (item.quantity <= 0) && { opacity: 0.5 }
                ]} 
                onPress={() => setShowSellModal(true)}
                disabled={item.quantity <= 0}
              >
                <ShoppingBag size={20} color={Theme.colors.text.black} />
                <Text style={styles.buttonText}>{item.quantity <= 0 ? 'Out of Stock' : 'Sell'}</Text>
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

        {/* Sell Modal */}
        <Modal visible={showSellModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto', borderRadius: 32, marginBottom: 40 }]}>
              <View style={styles.header}>
                <Text style={styles.modalTitle}>Confirm Sale</Text>
                <TouchableOpacity onPress={() => setShowSellModal(false)}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
              </View>
              <View style={styles.body}>
                <Text style={[styles.detailLabel, { marginBottom: 12 }]}>ITEM: {item.name}</Text>
                <Text style={styles.detailLabel}>ENTER SALE AMOUNT (₹)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: Theme.colors.surface, marginTop: 8, borderWidth: 2, borderColor: Theme.colors.primary }]}>
                  <IndianRupee size={20} color={Theme.colors.primary} />
                  <TextInput 
                    style={[styles.input, { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Theme.colors.text.muted}
                    value={saleAmount}
                    onChangeText={setSaleAmount}
                    autoFocus
                  />
                </View>

                <Text style={[styles.detailLabel, { marginTop: 20, marginBottom: 8 }]}>SELECT STAFF MEMBER</Text>
                <View style={{ minHeight: 50 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <TouchableOpacity 
                          key={emp.name}
                          style={[
                            styles.staffSelectBtn, 
                            selectedEmployee === emp.name && styles.staffSelectBtnActive
                          ]}
                          onPress={() => setSelectedEmployee(emp.name)}
                        >
                          <User size={16} color={selectedEmployee === emp.name ? Theme.colors.text.black : Theme.colors.text.secondary} />
                          <Text style={[
                            styles.staffSelectText,
                            selectedEmployee === emp.name && styles.staffSelectTextActive
                          ]}>{emp.name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={{ paddingVertical: 10 }}>
                        <Text style={{ color: Theme.colors.status.error, fontSize: 12, fontWeight: '700' }}>
                          ⚠️ No active staff found. Add them in Dashboard first.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, { backgroundColor: Theme.colors.primary, marginTop: 24 }, (selling || !selectedEmployee) && { opacity: 0.7 }]}
                  onPress={handleSell}
                  disabled={selling || !selectedEmployee}
                >
                  {selling ? <ActivityIndicator color={Theme.colors.text.black} /> : <ShoppingBag size={20} color={Theme.colors.text.black} />}
                  <Text style={styles.saveButtonText}>Confirm Sale</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text.primary,
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
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 8,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
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
  },
  primaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  itemSku: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  qtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  qtyText: {
    color: Theme.colors.primary,
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
    gap: 16,
  },
  detailRow: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Theme.colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: Theme.colors.text.muted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: Theme.colors.text.primary,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    color: Theme.colors.text.secondary,
    lineHeight: 22,
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  estimationBadge: {
    backgroundColor: Theme.colors.muted,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '40',
  },
  estIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  estLabel: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estValue: {
    fontSize: 20,
    color: Theme.colors.primary,
    fontWeight: '900',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Theme.colors.text.primary,
  },
  staffSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
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
    fontSize: 12,
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
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: Theme.colors.text.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
