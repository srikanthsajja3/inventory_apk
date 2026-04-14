import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { IndianRupee, Save, ArrowLeft, TrendingUp, History } from 'lucide-react-native';
import { supabase } from '../../supabase';

export default function GoldRateScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({
    gold_24kt: '',
    gold_22kt: '',
    gold_18kt: ''
  });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('master_rates').select('*');
      if (error) throw error;

      const rateMap: any = {};
      data?.forEach(r => {
        rateMap[r.key] = String(r.value);
      });

      setRates({
        gold_24kt: rateMap.gold_24kt || '0',
        gold_22kt: rateMap.gold_22kt || '0',
        gold_18kt: rateMap.gold_18kt || '0'
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load rates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handle24KChange = (value: string) => {
    const rate24k = parseFloat(value) || 0;
    
    if (rate24k === 0 && value === '') {
       setRates({
        gold_24kt: '',
        gold_22kt: '',
        gold_18kt: ''
      });
      return;
    }

    setRates({
      gold_24kt: value,
      gold_22kt: Math.round(rate24k * 0.92).toString(),
      gold_18kt: Math.round(rate24k * 0.75).toString()
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(rates).map(([key, value]) => ({
        key,
        value: parseFloat(String(value)) || 0,
        updated_at: new Date().toISOString()
      }));

      console.log('[GoldRate] Saving updates:', updates);

      // Single batch upsert is safer and faster
      const { error, data } = await supabase
        .from('master_rates')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        console.error('[GoldRate] Supabase error:', error);
        throw error;
      }

      console.log('[GoldRate] Save success:', data);
      Alert.alert('Success', 'Gold rates updated successfully across all devices!');
      fetchRates(); // Refresh to confirm
    } catch (error: any) {
      console.error('[GoldRate] Catch error:', error);
      Alert.alert('Update Failed', error.message || 'Check your internet or Supabase policies');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>Update Gold Rates</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <TrendingUp size={20} color="#6366f1" />
            <Text style={styles.infoText}>Enter rates per gram (₹)</Text>
          </View>

          <RateInput 
            label="24K Gold Rate" 
            value={rates.gold_24kt} 
            onChange={handle24KChange} 
            color="#f59e0b"
          />
          <RateInput 
            label="22K Gold Rate" 
            value={rates.gold_22kt} 
            onChange={(v) => setRates({...rates, gold_22kt: v})} 
            color="#eab308"
          />
          <RateInput 
            label="18K Gold Rate" 
            value={rates.gold_18kt} 
            onChange={(v) => setRates({...rates, gold_18kt: v})} 
            color="#ca8a04"
          />

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.saveBtnText}>Update Rates</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <History size={18} color="#64748b" />
            <Text style={styles.historyTitle}>Last Updated</Text>
          </View>
          <Text style={styles.historyDate}>{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RateInput = ({ label, value, onChange, color }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, { borderColor: color + '40' }]}>
      <IndianRupee size={18} color={color} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0.00"
      />
      <Text style={styles.unit}>/ gram</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  backBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25, backgroundColor: '#f5f3ff', padding: 12, borderRadius: 12 },
  infoText: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 18, fontWeight: '800', color: '#1e293b' },
  unit: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  saveBtn: { backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10, marginTop: 10 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  historyCard: { marginTop: 20, alignItems: 'center', gap: 5 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  historyDate: { fontSize: 12, color: '#94a3b8' }
});
