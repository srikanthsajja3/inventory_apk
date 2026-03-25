import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, X, Package, Plus, Minus, Info, PlusCircle } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import ItemFolderModal from '../components/ItemFolderModal';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [itemFound, setItemFound] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
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
    setScanned(true);
    setScannedData(data);
    setLoading(true);

    try {
      const tableName = role === 'admin' ? 'items' : 'staff_items';
      
      // Try searching by SKU/Barcode first (most common for external codes)
      // then by ID (UUID) if it looks like one
      let query = supabase.from(tableName).select('*').eq('sku', data);
      
      // Basic UUID check
      if (data.length === 36 && data.includes('-')) {
        query = supabase.from(tableName).select('*').or(`id.eq.${data},sku.eq.${data}`);
      }

      const { data: item, error } = await query.maybeSingle();

      if (error) throw error;

      if (item) {
        setItemFound(item);
      } else {
        // Not found - the UI will show an "Add New" option
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
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
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {loading && !itemFound ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : itemFound ? (
            <View style={styles.resultCard}>
              <TouchableOpacity style={styles.closeIcon} onPress={() => { setScanned(false); setItemFound(null); }}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>

              {itemFound.image_url ? (
                <Image source={{ uri: itemFound.image_url }} style={styles.itemImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Package size={48} color="#cbd5e1" />
                </View>
              )}
              
              <Text style={styles.itemName}>{itemFound.name}</Text>
              <Text style={styles.itemSku}>{itemFound.sku || 'No SKU'}</Text>

              <View style={styles.stockControl}>
                <TouchableOpacity 
                  style={[styles.adjustBtn, { backgroundColor: '#fee2e2' }]} 
                  onPress={() => adjustStock(-1)}
                  disabled={loading}
                >
                  <Minus size={24} color="#ef4444" />
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
                  <Plus size={24} color="#22c55e" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => { setScanned(false); setItemFound(null); }}
              >
                <Text style={styles.resetBtnText}>Done</Text>
              </TouchableOpacity>
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
        currentFolderId={null} // Root for new scans, or could let user pick
        initialData={{ sku: scannedData }} // Pass scanned data as initial SKU
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
    justifyContent: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 5,
  },
  itemImage: {
    width: 140,
    height: 140,
    borderRadius: 24,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  itemName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  itemSku: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    marginTop: 32,
    marginBottom: 32,
  },
  adjustBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e293b',
  },
  qtyLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resetBtn: {
    backgroundColor: '#1e293b',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  notFoundCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 30,
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
