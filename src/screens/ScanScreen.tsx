import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Platform, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, X, Package, Plus, Minus, Info, PlusCircle, Scale, Tag, Hash, FileText, Keyboard, IndianRupee, Calculator  } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import ItemFolderModal from '../components/ItemFolderModal';

const DetailBadge = ({ label, value, icon: Icon, color = "#6366f1" }: any) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailBadge}>
      <View style={[styles.badgeIcon, { backgroundColor: `${color}10` }]}>
        <Icon size={14} color={color} />
      </View>
      <View>
        <Text style={styles.badgeLabel}>{label}</Text>
        <Text style={styles.badgeValue}>{value}</Text>
      </View>
    </View>
  );
};

export default function ScanScreen({ onEstimate }: { onEstimate?: (item: any) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [itemFound, setItemFound] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const { role } = useRole();

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: any) => {
    if (scanned || loading) return;
    
    // Clean scanned data to remove dashes (GKC-1 becomes GKC1)
    const cleanData = data.replace(/-/g, '').trim();
    searchSku(cleanData);
  };

  const searchSku = async (sku: string) => {
    setScanned(true);
    setScannedData(sku);
    setLoading(true);

    try {
      const tableName = role === 'admin' ? 'items' : 'staff_items';
      
      // Search specifically by cleaned SKU
      const { data: item, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('sku', sku)
        .maybeSingle();

      if (error) throw error;

      if (item) {
        setItemFound(item);
      } else {
        // Fallback for internal IDs if it looks like a UUID
        if (sku.length === 36 && sku.includes('-')) {
          const { data: idItem, error: idError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', sku)
            .maybeSingle();
          
          if (!idError && idItem) {
            setItemFound(idItem);
            return;
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (!manualSku.trim()) return;
    searchSku(manualSku.trim());
    setManualSku('');
  };

  const adjustStock = async (amount: number) => {
    if (!itemFound) return;
    
    const newQty = Math.max(0, itemFound.quantity + amount);
    const type = amount > 0 ? 'IN' : 'OUT';

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', itemFound.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert([{
        item_id: itemFound.id,
        type: type,
        quantity_changed: Math.abs(amount),
        reason: `Scan update by ${role}`
      }]);

      setItemFound({ ...itemFound, quantity: newQty });
    } catch (error: any) {
      Alert.alert("Failed to update", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAddSuccess = () => {
    setScanned(false);
    setItemFound(null);
    setIsAddModalVisible(false);
    Alert.alert("Success", "Item added successfully");
  };

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanTarget} />
            <Text style={styles.hint}>Align QR Code within the frame</Text>
            
            <View style={styles.manualEntryContainer}>
              <View style={styles.manualInputWrapper}>
                <Keyboard size={20} color="#94a3b8" style={styles.manualIcon} />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Manual SKU Entry"
                  placeholderTextColor="#94a3b8"
                  value={manualSku}
                  onChangeText={setManualSku}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={styles.manualBtn}
                  onPress={handleManualSearch}
                >
                  <Text style={styles.manualBtnText}>Find</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {loading && !itemFound ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : itemFound ? (
            <View style={styles.fullWidthCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.headerTitle}>Scanned Product</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => { setScanned(false); setItemFound(null); }}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.itemTopSection}>
                  {itemFound.image_url ? (
                    <Image source={{ uri: itemFound.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Package size={48} color="#cbd5e1" />
                    </View>
                  )}
                  <View style={styles.itemBasicInfo}>
                    <Text style={styles.itemName}>{itemFound.name}</Text>
                    <Text style={styles.itemSku}>{itemFound.sku || 'No SKU'}</Text>
                    {itemFound.supplier_name && (
                      <View style={styles.vendorBadge}>
                        <Text style={styles.vendorText}>{itemFound.supplier_name}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <DetailBadge label="Net Weight" value={itemFound.net_wt ? `${itemFound.net_wt}g` : '0g'} icon={Scale} color="#6366f1" />
                  <DetailBadge label="Gross Weight" value={itemFound.gross_wt ? `${itemFound.gross_wt}g` : '0g'} icon={Scale} color="#8b5cf6" />
                  <DetailBadge label="Stone Wt" value={itemFound.clr_stone_wt ? `${itemFound.clr_stone_wt}g` : '0g'} icon={Scale} color="#10b981" />
                  <DetailBadge label="Wastage" value={itemFound.wastage ? `${itemFound.wastage}g` : '0g'} icon={Scale} color="#f59e0b" />
                  <DetailBadge label="Making" value={itemFound.labour_amt ? `₹${itemFound.labour_amt}` : '₹0'} icon={IndianRupee} color="#6366f1" />
                  <DetailBadge label="Purity" value={itemFound.purity} icon={Tag} color="#f59e0b" />
                  <DetailBadge label="HUID" value={itemFound.huid} icon={FileText} color="#ef4444" />
                  <DetailBadge label="Label No" value={itemFound.label_no} icon={Hash} color="#64748b" />
                  <DetailBadge label="Stones Detail" value={itemFound.stones_in_detail} icon={Info} color="#8b5cf6" />
                </View>
                
                <View style={{ height: 150 }} />
              </ScrollView>

              <View style={styles.stickyControls}>
                <View style={styles.stockControl}>
                  <TouchableOpacity 
                    style={[styles.adjustBtn, { backgroundColor: '#fee2e2' }]} 
                    onPress={() => adjustStock(-1)}
                    disabled={loading}
                  >
                    <Minus size={20} color="#ef4444" />
                  </TouchableOpacity>
                  
                  <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyValue}>{itemFound.quantity}</Text>
                    <Text style={styles.qtyLabel}>In Stock</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.adjustBtn, { backgroundColor: '#dcfce7' }]} 
                    onPress={() => adjustStock(1)}
                    disabled={loading}
                  >
                    <Plus size={20} color="#22c55e" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.estimateBtn}
                    onPress={() => onEstimate && onEstimate(itemFound)}
                  >
                    <Calculator size={20} color="white" />
                    <Text style={styles.doneBtnText}>Estimation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.doneBtn}
                    onPress={() => { setScanned(false); setItemFound(null); }}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.notFoundCard}>
              <X size={48} color="#ef4444" />
              <Text style={styles.notFoundTitle}>Not Found</Text>
              <Text style={styles.notFoundText}>
                No item found with SKU: {"\n"}
                <Text style={styles.scannedDataText}>{scannedData}</Text>
              </Text>
              
              <View style={styles.notFoundActions}>
                <TouchableOpacity 
                  style={styles.addBtn} 
                  onPress={() => setIsAddModalVisible(true)}
                >
                  <PlusCircle size={20} color="white" />
                  <Text style={styles.addBtnText}>Add as New Item</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.retryBtn} 
                  onPress={() => { setScanned(false); setScannedData(''); }}
                >
                  <Text style={styles.retryBtnText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <ItemFolderModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={onAddSuccess}
        currentFolderId={null} 
        initialData={{ sku: scannedData }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: '#6366f1',
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#fff',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  manualEntryContainer: {
    width: '80%',
    marginTop: 40,
  },
  manualInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 54,
  },
  manualIcon: {
    marginRight: 10,
  },
  manualInput: {
    flex: 1,
    height: '100%',
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  manualBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manualBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#64748b',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'flex-end',
  },
  fullWidthCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  resultScroll: {
    flex: 1,
    padding: 24,
  },
  itemTopSection: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemBasicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  vendorBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  vendorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailBadge: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  badgeValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '800',
  },
  stickyControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  adjustBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
  },
  qtyLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  estimateBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notFoundCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 30,
    margin: 20,
    alignItems: 'center',
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 15,
  },
  notFoundText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },
  scannedDataText: {
    fontWeight: '700',
    color: '#6366f1',
  },
  notFoundActions: {
    width: '100%',
    marginTop: 30,
    gap: 12,
  },
  addBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  retryBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  retryBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 16,
  },
});
