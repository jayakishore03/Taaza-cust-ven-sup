import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, TextInput, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Upload, CheckCircle, X, FileText, Camera } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore - expo-image-picker types may not be available immediately after installation
import * as ImagePicker from 'expo-image-picker';
import { uploadAgentDocument } from '@/services/imageUpload';

interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountHolderName: string;
  branchName: string;
}

interface DocumentUpload {
  selfie: string | null;
  drivingLicense: string | null;
  aadhar: string | null;
  pan: string | null;
  bankDetails: BankDetails | null;
}

export default function RegisterDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentUpload>({
    selfie: null,
    drivingLicense: null,
    aadhar: null,
    pan: null,
    bankDetails: null,
  });

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    branchName: '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Restore bank details if coming back from registration screen
  useEffect(() => {
    if (params.documents) {
      try {
        const parsedDocs = JSON.parse(params.documents as string);
        if (parsedDocs.bankDetails) {
          setBankDetails(parsedDocs.bankDetails);
          setDocuments(parsedDocs);
        }
      } catch (e) {
        console.error('Error parsing documents:', e);
      }
    }
  }, [params.documents]);

  const isBankDetailsComplete = () => {
    return (
      bankDetails.accountNumber.trim() !== '' &&
      bankDetails.ifscCode.trim() !== '' &&
      bankDetails.bankName.trim() !== '' &&
      bankDetails.accountHolderName.trim() !== '' &&
      bankDetails.branchName.trim() !== ''
    );
  };

  const allDocumentsUploaded = 
    documents.selfie &&
    documents.drivingLicense && 
    documents.aadhar && 
    documents.pan && 
    isBankDetailsComplete();

  const pickImage = async (documentType: keyof DocumentUpload) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload documents');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takeSelfie = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take a selfie');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          selfie: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    }
  };

  const removeDocument = (documentType: keyof DocumentUpload) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: null,
    }));
  };

  const handleCompleteRegistration = async () => {
    if (!allDocumentsUploaded) {
      Alert.alert('Incomplete', 'Please upload all required documents and fill bank details');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Create auth user
      const email = params.email as string;
      const password = params.password as string;
      const { error: signUpError, user: authUser } = await signUp(email, password);

      if (signUpError || !authUser) {
        setLoading(false);
        Alert.alert('Registration Failed', signUpError?.message || 'Failed to create account');
        return;
      }

      console.log('✅ Auth user created:', authUser.id);

      // Step 2: Upload documents to Supabase Storage
      let drivingLicenseUrl = null;
      let aadharUrl = null;
      let panUrl = null;
      let selfieUrl = null;

      try {
        console.log('📤 Starting document uploads...');
        
        if (documents.drivingLicense) {
          console.log('Uploading driving license...');
          drivingLicenseUrl = await uploadAgentDocument(documents.drivingLicense, authUser.id, 'driving_license');
          console.log('✅ Driving license uploaded');
        }
        if (documents.aadhar) {
          console.log('Uploading aadhar...');
          aadharUrl = await uploadAgentDocument(documents.aadhar, authUser.id, 'aadhar');
          console.log('✅ Aadhar uploaded');
        }
        if (documents.pan) {
          console.log('Uploading PAN...');
          panUrl = await uploadAgentDocument(documents.pan, authUser.id, 'pan');
          console.log('✅ PAN uploaded');
        }
        if (documents.selfie) {
          console.log('Uploading selfie...');
          selfieUrl = await uploadAgentDocument(documents.selfie, authUser.id, 'selfie');
          console.log('✅ Selfie uploaded');
        }
        
        console.log('✅ All documents uploaded successfully');
      } catch (uploadError: any) {
        console.error('❌ Document upload error:', uploadError);
        setLoading(false);
        Alert.alert('Upload Failed', uploadError.message || 'Failed to upload documents. Please try again.');
        return;
      }

      // Step 3: Save delivery agent profile via backend API
      try {
        const { deliveryAgentAPI } = await import('../../services/api');
        
        const result = await deliveryAgentAPI.register({
          user_id: authUser.id,
          full_name: params.fullName as string,
          email: email,
          phone_number: params.phoneNumber as string,
          alternate_phone: params.alternatePhone as string,
          vehicle_type: params.vehicleType as string,
          vehicle_number: params.vehicleNumber as string,
          vehicle_name: params.vehicleName as string,
          driving_license_url: drivingLicenseUrl,
          aadhar_url: aadharUrl,
          pan_url: panUrl,
          selfie_url: selfieUrl,
          bank_account_number: bankDetails.accountNumber,
          bank_ifsc_code: bankDetails.ifscCode,
          bank_name: bankDetails.bankName,
          bank_account_holder_name: bankDetails.accountHolderName,
          bank_branch_name: bankDetails.branchName,
        });

        console.log('✅ Delivery agent profile created successfully:', result.data);
      } catch (apiError: any) {
        console.error('❌ Profile creation error:', apiError);
        setLoading(false);
        Alert.alert('Registration Error', apiError.message || 'Account created but profile setup failed. Please contact support.');
        return;
      }

      setLoading(false);
      
      // Navigate to tabs immediately
      router.replace('/(tabs)');
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Registration Complete!', 
          'Your account has been created and is pending verification. You will be notified once approved.',
          [{ text: 'OK' }]
        );
      }, 300);
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred');
    }
  };

  const handleBack = () => {
    // If user goes back, preserve form data
    router.push({
      pathname: '/auth/register',
      params: params,
    });
  };

  const DocumentCard = ({ 
    title, 
    documentType, 
    value 
  }: { 
    title: string; 
    documentType: keyof DocumentUpload; 
    value: string | null;
  }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <Text style={styles.documentLabel}>{title}</Text>
        {value ? (
          <View style={styles.statusContainer}>
            <CheckCircle size={20} color="#000" />
            <Text style={styles.uploadedText}>Uploaded</Text>
          </View>
        ) : (
          <Text style={styles.requiredText}>Required</Text>
        )}
      </View>

      {value ? (
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => setSelectedImage(value)}>
          <Image source={{ uri: value }} style={styles.previewImage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeDocument(documentType)}
          >
            <X size={18} color="#FFF" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickImage(documentType)}
        >
          <Upload size={20} color="#FFF" />
          <Text style={styles.uploadButtonText}>Upload {title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>Please upload all required documents to complete registration</Text>
        </View>

        <View style={styles.documentList}>
          {/* Selfie Section */}
          <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentLabel}>Selfie Photo</Text>
              {documents.selfie ? (
                <View style={styles.statusContainer}>
                  <CheckCircle size={20} color="#000" />
                  <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
              ) : (
                <Text style={styles.requiredText}>Required</Text>
              )}
            </View>

            {documents.selfie ? (
              <View style={styles.imageContainer}>
                <TouchableOpacity onPress={() => setSelectedImage(documents.selfie)}>
                  <Image source={{ uri: documents.selfie }} style={styles.previewImage} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDocument('selfie')}
                >
                  <X size={18} color="#FFF" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.selfieButton}
                onPress={takeSelfie}
              >
                <Camera size={24} color="#FFF" />
                <Text style={styles.uploadButtonText}>Take Selfie</Text>
              </TouchableOpacity>
            )}
          </View>

          <DocumentCard 
            title="Driving License" 
            documentType="drivingLicense" 
            value={documents.drivingLicense}
          />
          <DocumentCard 
            title="Aadhar Card" 
            documentType="aadhar" 
            value={documents.aadhar}
          />
          <DocumentCard 
            title="PAN Card" 
            documentType="pan" 
            value={documents.pan}
          />
          {/* Bank Details Form */}
          <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentLabel}>Bank Details</Text>
              {isBankDetailsComplete() ? (
                <View style={styles.statusContainer}>
                  <CheckCircle size={20} color="#000" />
                  <Text style={styles.uploadedText}>Completed</Text>
                </View>
              ) : (
                <Text style={styles.requiredText}>Required</Text>
              )}
            </View>

            <View style={styles.bankForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account holder name"
                  placeholderTextColor="#888"
                  value={bankDetails.accountHolderName}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, accountHolderName: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  placeholderTextColor="#888"
                  value={bankDetails.accountNumber}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text.replace(/\D/g, '') })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter IFSC code"
                  placeholderTextColor="#888"
                  value={bankDetails.ifscCode}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, ifscCode: text.toUpperCase() })}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter bank name"
                  placeholderTextColor="#888"
                  value={bankDetails.bankName}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, bankName: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Branch Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter branch name"
                  placeholderTextColor="#888"
                  value={bankDetails.branchName}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, branchName: text })}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <FileText size={24} color="#000" />
          <Text style={styles.infoTitle}>Document Requirements</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Clear and readable photos</Text>
            <Text style={styles.infoItem}>• All corners visible</Text>
            <Text style={styles.infoItem}>• Valid and not expired</Text>
            <Text style={styles.infoItem}>• Name should match registration</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, (!allDocumentsUploaded || loading) && styles.buttonDisabled]}
          onPress={handleCompleteRegistration}
          disabled={!allDocumentsUploaded || loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.continueButtonText}>Completing Registration...</Text>
            </View>
          ) : (
          <Text style={styles.continueButtonText}>
              {allDocumentsUploaded ? 'Complete Registration' : 'Upload All Documents to Continue'}
          </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <X size={28} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
  },
  documentList: {
    gap: 20,
    marginBottom: 20,
  },
  documentCard: {
    backgroundColor: '#F7F7F7',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  requiredText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selfieButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#E0E0E0',
  },
  removeButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankForm: {
    marginTop: 12,
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

