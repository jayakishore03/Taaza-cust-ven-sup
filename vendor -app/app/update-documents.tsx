import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FileText, IdCard, ShieldCheck, FileSignature, FileBadge, ArrowLeft } from 'lucide-react-native';
import { uploadDocument } from '@/services/imageUpload';
import { updateShopDocument } from '@/services/shops';

type DocumentType = 'pan' | 'gst' | 'fssai' | 'shopLicense' | 'aadhaar';

interface DocConfig {
  key: DocumentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const DOCUMENTS: DocConfig[] = [
  {
    key: 'pan',
    label: 'PAN Card',
    description: 'Owner or business PAN card',
    icon: FileText,
  },
  {
    key: 'gst',
    label: 'GST Certificate',
    description: 'GST registration certificate (optional)',
    icon: FileBadge,
  },
  {
    key: 'fssai',
    label: 'FSSAI License',
    description: 'Mandatory license for meat business',
    icon: ShieldCheck,
  },
  {
    key: 'shopLicense',
    label: 'Shop / Trade License',
    description: 'Local shop or trade license (optional)',
    icon: FileSignature,
  },
  {
    key: 'aadhaar',
    label: 'Aadhaar Card',
    description: 'Shop owner Aadhaar card',
    icon: IdCard,
  },
];

export default function UpdateDocumentsScreen() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<DocumentType | null>(null);

  useEffect(() => {
    const loadShopId = async () => {
      try {
        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (vendorDataStr) {
          const vendorData = JSON.parse(vendorDataStr);
          const id = vendorData?.shop?.id || vendorData?.shop_id || null;
          if (id) {
            setShopId(id);
          } else {
            Alert.alert(
              'Shop Not Found',
              'We could not find your shop details. Please log out and log in again.'
            );
          }
        } else {
          Alert.alert(
            'Not Logged In',
            'Please sign in again to update your documents.'
          );
        }
      } catch (error) {
        console.error('[UpdateDocumentsScreen] Error loading shop ID:', error);
        Alert.alert(
          'Error',
          'Unable to load your shop details. Please try again later.'
        );
      } finally {
        setLoadingShop(false);
      }
    };

    loadShopId();
  }, []);

  const handlePickAndUpload = async (docType: DocumentType) => {
    if (!shopId) {
      Alert.alert(
        'Shop Not Found',
        'We could not find your shop details. Please log out and log in again.'
      );
      return;
    }

    setUploadingFor(docType);

    try {
      // Let user choose how to provide the document
      const choice = await new Promise<'document' | 'camera' | 'gallery' | 'cancel'>((resolve) => {
        Alert.alert(
          'Select Option',
          `Update ${DOCUMENTS.find(d => d.key === docType)?.label || 'document'}`,
          [
            { text: 'Document File', onPress: () => resolve('document') },
            { text: 'Camera', onPress: () => resolve('camera') },
            { text: 'Gallery', onPress: () => resolve('gallery') },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
          ],
          { cancelable: true }
        );
      });

      if (choice === 'cancel') {
        setUploadingFor(null);
        return;
      }

      let uri: string | null = null;

      if (choice === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
          uri = result.uri;
        }
      } else if (choice === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Please allow camera access to capture a photo of your document.'
          );
          setUploadingFor(null);
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          uri = result.assets[0].uri;
        }
      } else if (choice === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Please allow photo library access to select a document photo.'
          );
          setUploadingFor(null);
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          uri = result.assets[0].uri;
        }
      }

      if (!uri) {
        setUploadingFor(null);
        return;
      }

      // 1) Upload file to Supabase Storage (acts like S3 bucket)
      const uploadResult = await uploadDocument(uri, shopId, docType);

      if (!uploadResult.success || !uploadResult.url) {
        Alert.alert(
          'Upload Failed',
          uploadResult.error || 'We could not upload your document. Please try again.'
        );
        setUploadingFor(null);
        return;
      }

      // 2) Save the public URL into shops table so Super Admin can see it
      const updateResult = await updateShopDocument(shopId, docType, uploadResult.url);

      if (!updateResult.success) {
        Alert.alert(
          'Save Failed',
          updateResult.error || 'We uploaded the document, but could not save it to your shop record.'
        );
        setUploadingFor(null);
        return;
      }

      Alert.alert(
        'Document Updated',
        `${DOCUMENTS.find(d => d.key === docType)?.label || 'Document'} has been updated successfully.`
      );
    } catch (error: any) {
      console.error('[UpdateDocumentsScreen] Error updating document:', error);
      Alert.alert(
        'Error',
        error?.message || 'Something went wrong while updating the document. Please try again.'
      );
    } finally {
      setUploadingFor(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#111827" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Documents</Text>
      </View>

      {loadingShop ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading your shop details...</Text>
        </View>
      ) : !shopId ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            We could not find your shop. Please log out and log in again.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.introTitle}>Choose a document to update</Text>
          <Text style={styles.introSubtitle}>
            Updated documents are securely stored in the cloud and visible in the Super Admin panel.
          </Text>

          {DOCUMENTS.map((doc) => {
            const Icon = doc.icon;
            const isUploading = uploadingFor === doc.key;
            return (
              <TouchableOpacity
                key={doc.key}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handlePickAndUpload(doc.key)}
                disabled={isUploading}
              >
                <View style={styles.iconContainer}>
                  <Icon size={24} color="#111827" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{doc.label}</Text>
                  <Text style={styles.cardDescription}>{doc.description}</Text>
                </View>
                <View style={styles.actionContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.actionText}>Upload / Update</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.infoNote}>
            Once uploaded, your documents will be stored in a secure cloud bucket and linked to your
            shop. Super Admins can review these documents during verification.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionContainer: {
    marginLeft: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  infoNote: {
    marginTop: 16,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
});


