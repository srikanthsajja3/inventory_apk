import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { X, Folder, ChevronRight, ArrowLeft, Check, Move } from 'lucide-react-native';
import { supabase } from '../../supabase';

interface MoveModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMove: () => void;
  itemToMove: { id: string, name: string, type: 'item' | 'folder' } | null;
}

export default function MoveModal({ isVisible, onClose, onMove, itemToMove }: MoveModalProps) {
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchFolders();
    }
  }, [isVisible, currentFolder]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const parentId = currentFolder ? currentFolder.id : null;
      
      let query = supabase.from('categories').select('*');
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      // Don't show the folder itself as a destination
      if (itemToMove?.type === 'folder') {
        query = query.neq('id', itemToMove.id);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error('Fetch Folders Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    if (!itemToMove) return;

    try {
      setMoving(true);
      const targetId = currentFolder ? currentFolder.id : null;

      if (itemToMove.type === 'folder') {
        const { error } = await supabase
          .from('categories')
          .update({ parent_id: targetId })
          .eq('id', itemToMove.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .update({ category_id: targetId })
          .eq('id', itemToMove.id);
        if (error) throw error;
      }

      Alert.alert('Success', `${itemToMove.name} moved successfully`);
      onMove();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setMoving(false);
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

  const renderFolder = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.folderCard} 
      onPress={() => navigateToFolder(item)}
    >
      <Folder size={20} color="#6366f1" />
      <Text style={styles.folderName}>{item.name}</Text>
      <ChevronRight size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Move to...</Text>
              <Text style={styles.itemToMoveText}>Moving: {itemToMove?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.breadcrumb}>
            {currentFolder && (
              <TouchableOpacity onPress={navigateBack} style={styles.backBtn}>
                <ArrowLeft size={18} color="#6366f1" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.pathText}>
              {currentFolder ? currentFolder.name : 'Home Root'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color="#6366f1" />
          ) : (
            <FlatList
              data={folders}
              renderItem={renderFolder}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No subfolders here</Text>
              }
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.moveButton, moving && styles.disabled]} 
              onPress={handleMove}
              disabled={moving}
            >
              {moving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={20} color="white" />
                  <Text style={styles.moveButtonText}>Move Here</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  itemToMoveText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  pathText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  list: {
    paddingBottom: 20,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
  },
  loader: {
    marginTop: 40,
  },
  footer: {
    paddingTop: 16,
  },
  moveButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  moveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  }
});
