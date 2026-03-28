import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Image, Platform, BackHandler } from 'react-native';
import { Search, Plus, Package, RefreshCcw, QrCode, X, Folder, ChevronRight, ArrowLeft, Trash2, Move, Edit2, ImageIcon, CheckCircle2, Circle, ListFilter, CheckSquare, LayoutGrid, List, MapPin } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import ItemFolderModal from '../components/ItemFolderModal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import MoveModal from '../components/MoveModal';

const FolderCard = ({ item, onNavigate, onMove, onDelete, onEdit, selectionMode, isSelected, onSelect, viewMode }: any) => (
  <TouchableOpacity 
    style={[
      viewMode === 'grid' ? styles.folderCardGrid : styles.folderCard, 
      isSelected && styles.selectedCard
    ]} 
    onPress={() => selectionMode ? onSelect(item) : onNavigate(item)}
  >
    {selectionMode && (
      <View style={styles.selectionIndicator}>
        {isSelected ? <CheckCircle2 size={24} color="#6366f1" fill="#eef2ff" /> : <Circle size={24} color="#cbd5e1" />}
      </View>
    )}
    <View style={viewMode === 'grid' ? styles.folderIconGrid : styles.folderIcon}>
      <Folder size={viewMode === 'grid' ? 40 : 28} color="#6366f1" fill="#eef2ff" />
    </View>
    <View style={viewMode === 'grid' ? styles.infoGrid : styles.info}>
      <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.folderSubtext}>Folder</Text>
    </View>
    {!selectionMode && viewMode === 'list' && (
      <View style={styles.rightSection}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
            <Edit2 size={16} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'folder')}>
            <Move size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'folder')}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <ChevronRight size={18} color="#cbd5e1" />
      </View>
    )}
  </TouchableOpacity>
);

const ItemCard = ({ item, onShowQR, onMove, onDelete, onEdit, onPress, selectionMode, isSelected, onSelect, viewMode }: any) => (
  <TouchableOpacity 
    style={[
      viewMode === 'grid' ? styles.itemCardGrid : styles.itemCard, 
      isSelected && styles.selectedCard
    ]} 
    onPress={() => selectionMode ? onSelect(item) : onPress(item)}
  >
    {selectionMode && (
      <View style={styles.selectionIndicator}>
        {isSelected ? <CheckCircle2 size={24} color="#6366f1" fill="#eef2ff" /> : <Circle size={24} color="#cbd5e1" />}
      </View>
    )}
    <View style={viewMode === 'grid' ? styles.itemIconGrid : styles.itemIcon}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemThumb} />
      ) : (
        <Package size={viewMode === 'grid' ? 32 : 24} color="#94a3b8" />
      )}
    </View>
    <View style={viewMode === 'grid' ? styles.infoGrid : styles.info}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      {viewMode === 'list' ? (
        <View style={styles.itemMeta}>
          <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
          {item.purity && <Text style={styles.metaDivider}>•</Text>}
          {item.purity && <Text style={styles.itemPurity}>{item.purity}</Text>}
        </View>
      ) : (
        <Text style={styles.itemSku} numberOfLines={1}>{item.sku || 'No SKU'}</Text>
      )}
    </View>
    
    {viewMode === 'grid' ? (
      <View style={styles.qtyBadgeGrid}>
        <Text style={styles.qtyText}>{item.quantity}</Text>
      </View>
    ) : (
      <View style={styles.rightSection}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{item.quantity}</Text>
        </View>

        {!selectionMode && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
              <Edit2 size={16} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'item')}>
              <Move size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrBtn} onPress={() => onShowQR(item)}>
              <QrCode size={16} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'item')}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    )}
  </TouchableOpacity>
);

export default function InventoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<any[]>([]);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const { role } = useRole();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('location')
        .not('location', 'is', null);
      
      if (error) throw error;
      
      const uniqueLocations = Array.from(new Set(data.map(i => i.location))).sort();
      setLocations(['All Locations', ...uniqueLocations]);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    // Web specific folder history handling
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.type === 'folder') {
          // Find the folder in history or reset
          const prevFolderId = event.state.folderId;
          if (!prevFolderId) {
            setCurrentFolder(null);
            setHistory([]);
          } else {
            // Find folder in current items/folders or history
            // Actually, simpler to just set the folder from state if we stored it
            setCurrentFolder(event.state.folder || null);
          }
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (selectionMode) {
        toggleSelectionMode();
        return true;
      }
      if (currentFolder) {
        navigateBack();
        return true;
      }
      return false; // Let App.tsx handle it
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentFolder, selectionMode]);

  useEffect(() => {
    fetchContents();
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [currentFolder]);

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedIds(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const toggleSelect = (item: any) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const getSelectedItems = () => {
    return [...folders, ...items].filter(i => selectedIds.has(i.id));
  };

  const calculateStats = () => {
    const totalItems = items.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const totalValue = items.reduce((acc, item) => {
      const qty = parseInt(item.quantity) || 0;
      const itemCost = (parseFloat(item.labour_amt) || 0) + 
                       (parseFloat(item.dia_purchase_amt) || 0) + 
                       (parseFloat(item.stone_purchase_amt) || 0) +
                       (parseFloat(item.other_charges) || 0);
      return acc + (itemCost * qty);
    }, 0);

    return {
      folders: folders.length,
      items: items.length,
      totalQty: totalItems,
      totalValue: totalValue
    };
  };

  const stats = calculateStats();

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
    if (Platform.OS === 'web') {
      window.history.pushState({ type: 'folder', folderId: folder.id, folder }, '');
    }
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
    setItemsToMove([{ id: item.id, name: item.name, type }]);
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

  const handleBulkDelete = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return;

    const folderCount = selectedItems.filter(i => i.sku === undefined && i.barcode === undefined).length;
    const itemCount = selectedItems.length - folderCount;
    
    let message = `Are you sure you want to delete ${selectedItems.length} selected items?`;
    if (folderCount > 0) {
      message += `\n\nWarning: ${folderCount} folders are selected. Deleting a folder will delete all of its contents!`;
    }

    const performBulkDelete = async () => {
      try {
        setLoading(true);
        const folderIds = selectedItems.filter(i => i.sku === undefined && i.barcode === undefined).map(i => i.id);
        const itemIds = selectedItems.filter(i => i.sku !== undefined || i.barcode !== undefined).map(i => i.id);

        if (itemIds.length > 0) {
          const { error: itemError } = await supabase.from('items').delete().in('id', itemIds);
          if (itemError) throw itemError;
        }

        if (folderIds.length > 0) {
          const { error: folderError } = await supabase.from('categories').delete().in('id', folderIds);
          if (folderError) throw folderError;
        }

        toggleSelectionMode();
        fetchContents();
      } catch (error: any) {
        Alert.alert('Bulk Delete Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        performBulkDelete();
      }
    } else {
      Alert.alert(
        'Bulk Delete Confirmation',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete All', style: 'destructive', onPress: performBulkDelete }
        ]
      );
    }
  };

  // Combine folders and items for the list
  const filteredItems = items.filter(item => {
    const matchesSearch = search === '' || 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.label_no?.toLowerCase().includes(search.toLowerCase());
    
    const matchesLocation = selectedLocation === 'All Locations' || item.location === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

  const displayData = search 
    ? [...folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), ...filteredItems]
    : [...folders, ...filteredItems];

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
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
            style={styles.refreshButton}
          >
            {viewMode === 'grid' ? <List size={20} color="#6366f1" /> : <LayoutGrid size={20} color="#6366f1" />}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={toggleSelectionMode} 
            style={[styles.refreshButton, selectionMode && styles.activeSelectionBtn]}
          >
            <CheckSquare size={20} color={selectionMode ? "white" : "#6366f1"} />
          </TouchableOpacity>
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

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Folders</Text>
          <Text style={styles.summaryValue}>{stats.folders}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{stats.items}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Quantity</Text>
          <Text style={styles.summaryValue}>{stats.totalQty} units</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>₹{stats.totalValue.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput 
            style={styles.input}
            placeholder="Search by name, SKU, or Label..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.locationContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
            {locations.map((loc) => (
              <TouchableOpacity 
                key={loc} 
                onPress={() => setSelectedLocation(loc)}
                style={[styles.locBadge, selectedLocation === loc && styles.activeLocBadge]}
              >
                <MapPin size={12} color={selectedLocation === loc ? 'white' : '#64748b'} />
                <Text style={[styles.locBadgeText, selectedLocation === loc && styles.activeLocBadgeText]}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.size} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              style={styles.selectionActionBtn} 
              onPress={() => {
                const itemsToMove = getSelectedItems().map(i => ({
                  id: i.id,
                  name: i.name,
                  type: (i.sku !== undefined || i.barcode !== undefined) ? 'item' : 'folder'
                }));
                setItemsToMove(itemsToMove as any);
                setMoveModalVisible(true);
              }}
            >
              <Move size={18} color="#6366f1" />
              <Text style={styles.selectionActionText}>Move</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectionActionBtn, { backgroundColor: '#fee2e2' }]} 
              onPress={handleBulkDelete}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.selectionActionText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectionCancelBtn} onPress={toggleSelectionMode}>
              <Text style={styles.selectionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList 
          key={viewMode}
          numColumns={viewMode === 'grid' ? 3 : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : null}
          data={displayData}
          extraData={[selectedIds, selectionMode, viewMode]}
          renderItem={({ item }) => {
            const isFolder = (item.sku === undefined && item.barcode === undefined);
            const isSelected = selectedIds.has(item.id);
            
            return isFolder ? (
              <FolderCard 
                item={item} 
                onNavigate={navigateToFolder} 
                onMove={openMoveModal} 
                onDelete={handleDelete} 
                onEdit={openEditModal}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onSelect={toggleSelect}
                viewMode={viewMode}
              />
            ) : (
              <ItemCard 
                item={item} 
                onShowQR={showQR} 
                onMove={openMoveModal} 
                onDelete={handleDelete} 
                onEdit={openEditModal} 
                onPress={showDetails}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onSelect={toggleSelect}
                viewMode={viewMode}
              />
            );
          }}
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
              {selectedItem && <QRCode value={selectedItem.sku || selectedItem.id} size={200} />}
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
        itemsToMove={itemsToMove}
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
    marginBottom: 15,
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
  activeSelectionBtn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 20,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  filterRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  locationContainer: {
    backgroundColor: 'transparent',
  },
  locationScroll: {
    flexDirection: 'row',
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  activeLocBadge: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  locBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeLocBadgeText: {
    color: '#fff',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 15,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  selectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  selectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  selectionCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectionCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  list: {
    paddingBottom: 20,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  folderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  folderCardGrid: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    alignItems: 'flex-start',
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: '#f5f3ff',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  folderIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIconGrid: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  folderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  folderSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemCardGrid: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    alignItems: 'flex-start',
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
  itemIconGrid: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  infoGrid: {
    width: '100%',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSku: {
    fontSize: 11,
    color: '#94a3b8',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
  },
  qrBtn: {
    padding: 6,
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
  qtyBadgeGrid: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
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
