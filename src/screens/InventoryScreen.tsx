import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Image, Platform } from 'react-native';
import { Search, Plus, Package, RefreshCcw, QrCode, X, Folder, ChevronRight, ArrowLeft, Trash2, Move, Edit2, ImageIcon } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import ItemFolderModal from '../components/ItemFolderModal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import MoveModal from '../components/MoveModal';

const FolderCard = ({ item, onNavigate, onMove, onDelete, onEdit }: any) => (
  <TouchableOpacity 
    style={styles.folderCard} 
    onPress={() => onNavigate(item)}
  >
    <View style={styles.folderIcon}>
      <Folder size={28} color="#6366f1" fill="#eef2ff" />
    </View>
    <View style={styles.info}>
      <Text style={styles.folderName}>{item.name}</Text>
      <Text style={styles.folderSubtext}>Folder</Text>
    </View>
    <View style={styles.controls}>
      <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
        <Edit2 size={18} color="#6366f1" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'folder')}>
        <Move size={18} color="#64748b" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'folder')}>
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
      <ChevronRight size={20} color="#cbd5e1" />
    </View>
  </TouchableOpacity>
);

const ItemCard = ({ item, onShowQR, onMove, onDelete, onEdit, onPress }: any) => (
  <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item)}>
    <View style={styles.itemIcon}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemThumb} />
      ) : (
        <Package size={24} color="#94a3b8" />
      )}
    </View>
    <View style={styles.info}>
      <Text style={styles.itemName}>{item.name}</Text>
      <View style={styles.itemMeta}>
        <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
        {item.purity && <Text style={styles.metaDivider}>•</Text>}
        {item.purity && <Text style={styles.itemPurity}>{item.purity}</Text>}
      </View>
      <View style={styles.jewelryStats}>
        <View style={styles.jewelryStatItem}>
          <Text style={styles.statLabelText}>G.Wt:</Text>
          <Text style={styles.statValueText}>{item.gross_wt || 0}g</Text>
        </View>
        <View style={styles.jewelryStatItem}>
          <Text style={styles.statLabelText}>N.Wt:</Text>
          <Text style={styles.statValueText}>{item.net_wt || 0}g</Text>
        </View>
      </View>
    </View>
    <View style={styles.controls}>
      <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
        <Edit2 size={18} color="#6366f1" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'item')}>
        <Move size={18} color="#64748b" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.qrBtn} onPress={() => onShowQR(item)}>
        <QrCode size={18} color="#6366f1" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'item')}>
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
      <View style={styles.qtyBadge}>
        <Text style={styles.qtyText}>{item.quantity}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function InventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [itemToMove, setItemToMove] = useState<any>(null);
  const { role } = useRole();

  useEffect(() => {
    fetchContents();
  }, [currentFolder]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const parentId = currentFolder ? currentFolder.id : null;

      // 1. Fetch Subfolders
      let catQuery = supabase.from('categories').select('*');
      if (parentId) {
        catQuery = catQuery.eq('parent_id', parentId);
      } else {
        catQuery = catQuery.is('parent_id', null);
      }
      const { data: catData, error: catError } = await catQuery.order('name');

      if (catError) throw catError;
      setFolders(catData || []);

      // 2. Fetch Items in this folder
      const tableName = role === 'admin' ? 'items' : 'staff_items';
      let query = supabase.from(tableName).select('*');
      
      if (parentId) {
        query = query.eq('category_id', parentId);
      } else {
        query = query.is('category_id', null);
      }

      const { data: itemData, error: itemError } = await query.order('name');
      if (itemError) throw itemError;
      setItems(itemData || []);

    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: any) => {
    setHistory([...history, currentFolder]);
    setCurrentFolder(folder);
  };

  const navigateBack = () => {
    const newHistory = [...history];
    const prevFolder = newHistory.pop();
    setHistory(newHistory);
    setCurrentFolder(prevFolder || null);
  };

  const showQR = (item: any) => {
    setSelectedItem(item);
    setQrModalVisible(true);
  };

  const showDetails = (item: any) => {
    setSelectedItem(item);
    setIsDetailsVisible(true);
  };

  const openMoveModal = (item: any, type: 'item' | 'folder') => {
    setItemToMove({ ...item, type });
    setMoveModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string, name: string, type: 'item' | 'folder') => {
    const message = `Are you sure you want to delete "${name}"? ${type === 'folder' ? 'This will delete all contents!' : ''}`;
    
    const performDelete = async () => {
      try {
        const table = type === 'folder' ? 'categories' : 'items';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        fetchContents();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          alert('Error: ' + error.message);
        } else {
          Alert.alert('Error', error.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Confirmation',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  // Combine folders and items for the list
  const displayData = search 
    ? [...folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), 
       ...items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))]
    : [...folders, ...items];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {currentFolder && (
            <TouchableOpacity onPress={navigateBack} style={styles.backBtn}>
              <ArrowLeft size={24} color="#1e293b" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{currentFolder ? currentFolder.name : 'Home'}</Text>
            <Text style={styles.subtitle}>
              {folders.length} Folders • {items.length} Items
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchContents} style={styles.refreshButton}>
            <RefreshCcw size={20} color="#6366f1" />
          </TouchableOpacity>
          {role === 'admin' && (
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Plus size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={20} color="#94a3b8" />
        <TextInput 
          style={styles.input}
          placeholder="Search this folder..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList 
          data={displayData}
          renderItem={({ item }) => 
            (item.sku !== undefined || item.barcode !== undefined) 
              ? <ItemCard item={item} onShowQR={showQR} onMove={openMoveModal} onDelete={handleDelete} onEdit={openEditModal} onPress={showDetails} /> 
              : <FolderCard item={item} onNavigate={navigateToFolder} onMove={openMoveModal} onDelete={handleDelete} onEdit={openEditModal} />
          }
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Folder size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>This folder is empty</Text>
            </View>
          }
        />
      )}

      {/* QR Modal */}
      <Modal visible={qrModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModalVisible(false)}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>{selectedItem?.name}</Text>
            <View style={styles.qrContainer}>
              {selectedItem && <QRCode value={selectedItem.id} size={200} />}
            </View>
            <Text style={styles.qrHint}>Scan to update stock</Text>
          </View>
        </View>
      </Modal>

      <ItemFolderModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={fetchContents}
        currentFolderId={currentFolder ? currentFolder.id : null}
        initialData={editingItem}
      />

      <ItemDetailsModal 
        isVisible={isDetailsVisible}
        onClose={() => setIsDetailsVisible(false)}
        item={selectedItem}
        onEdit={openEditModal}
      />

      <MoveModal
        isVisible={moveModalVisible}
        onClose={() => setMoveModalVisible(false)}
        onMove={fetchContents}
        itemToMove={itemToMove}
      />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  list: {
    paddingBottom: 20,
  },
  folderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
  },
  folderIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  folderSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaDivider: {
    marginHorizontal: 6,
    color: '#cbd5e1',
    fontSize: 12,
  },
  itemPurity: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '700',
  },
  jewelryStats: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  jewelryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statLabelText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  statValueText: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 12,
    color: '#94a3b8',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
  },
  qrBtn: {
    padding: 8,
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
  },
  qtyBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 35,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6366f1',
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
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  qrHint: {
    marginTop: 20,
    color: '#64748b',
  }
});
