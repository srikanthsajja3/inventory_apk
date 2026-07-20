import { Platform, Alert, Linking } from 'react-native';

export function getShareableLink(id: string, basePortalUrl: string): string {
  const base = basePortalUrl.endsWith('/') ? basePortalUrl.slice(0, -1) : basePortalUrl;
  return `${base}/sign/${id}`;
}

export function shareToWhatsApp(phone: string, customerName: string, link: string) {
  const cleanedPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
  const message = `Hello ${customerName},\n\nPlease review and sign your Moksha Application using this link:\n\n${link}`;
  const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  
  Linking.openURL(whatsappUrl).catch(() => Alert.alert('Error', 'WhatsApp not found.'));
}
