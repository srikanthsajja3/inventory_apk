import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface Props {
  onOK: (signature: string) => void;
  descriptionText?: string;
}

const SignaturePad: React.FC<Props> = ({ onOK, descriptionText = "Sign Here" }) => {
  const ref = useRef<any>(null);

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    onOK(signature);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{descriptionText}</Text>
      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={ref}
          onOK={handleOK}
          webStyle={`.m-signature-pad--footer { display: none; } body,html { width: 100%; height: 100%; }`}
          autoClear={false}
          descriptionText=""
        />
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, styles.clearBtn]} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignaturePad;

const styles = StyleSheet.create({
  container: {
    height: 350,
    width: '100%',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  signatureBox: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#dc3545',
  },
  confirmBtn: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
