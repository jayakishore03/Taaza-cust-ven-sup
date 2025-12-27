import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegistrationData {
  // Step 1
  ownerName?: string;
  storeName?: string;
  address?: string;
  shopPlot?: string;
  floor?: string;
  building?: string;
  pincode?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  area?: string;
  city?: string;
  storePhotos?: Array<{ uri: string }>;
  shopType?: string;
  
  // Step 2
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  isWhatsAppSame?: boolean;
  otpVerified?: boolean;
  
  // Step 3
  workingDays?: string[];
  sameTime?: boolean;
  commonOpenTime?: string;
  commonCloseTime?: string;
  dayTimes?: Record<string, { open: Date; close: Date }>;
  
  // Step 4
  documents?: {
    pan?: { uri: string; name: string; type: string };
    gst?: { uri: string; name: string; type: string };
    fssai?: { uri: string; name: string; type: string };
    shopLicense?: { uri: string; name: string; type: string };
    aadhaar?: { uri: string; name: string; type: string };
  };
  
  // Step 5
  bankDetails?: {
    ifsc?: string;
    accountNumber?: string;
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountType?: string;
  };
  
  // Step 6
  contractAccepted?: boolean;
  profitShare?: number;
  signature?: string;
}

interface RegistrationContextType {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => Promise<void>;
  clearRegistrationData: () => Promise<void>;
  submitRegistration: (password: string) => Promise<{ success: boolean; message: string }>;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

const STORAGE_KEY = '@taaza_registration_data';

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});

  // Load data from storage on mount
  React.useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRegistrationData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const updateRegistrationData = async (data: Partial<RegistrationData>) => {
    const newData = { ...registrationData, ...data };
    setRegistrationData(newData);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const clearRegistrationData = async () => {
    setRegistrationData({});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const submitRegistration = async (password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Read directly from AsyncStorage to get the latest data
      // This ensures we have the most up-to-date data regardless of state
      let latestData: RegistrationData = {};
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          latestData = JSON.parse(stored);
          console.log('[submitRegistration] Loaded data from AsyncStorage');
        } else {
          // Fallback to state if storage is empty
          latestData = registrationData;
          console.log('[submitRegistration] Using state data (storage empty)');
        }
      } catch (storageError) {
        console.error('[submitRegistration] Error reading from storage, using state:', storageError);
        latestData = registrationData;
      }
      
      // Log current registration data for debugging
      console.log('[submitRegistration] Current registration data:', {
        ownerName: latestData.ownerName,
        storeName: latestData.storeName,
        email: latestData.email,
        mobileNumber: latestData.mobileNumber,
        pincode: latestData.pincode,
        hasLocation: !!latestData.location,
        hasWorkingDays: !!latestData.workingDays && latestData.workingDays.length > 0,
        hasDocuments: !!latestData.documents,
        hasBankDetails: !!latestData.bankDetails,
        contractAccepted: latestData.contractAccepted,
        hasSignature: !!latestData.signature,
        passwordLength: password?.length || 0,
        fullData: latestData, // Log full data for debugging
      });

      // Validate only the most critical required fields
      // These are the absolute minimum needed to create a shop
      const missingFields: string[] = [];

      // Step 1: Basic Details (Critical)
      if (!latestData.ownerName || (typeof latestData.ownerName === 'string' && latestData.ownerName.trim() === '')) {
        missingFields.push('Owner Name');
      }
      if (!latestData.storeName || (typeof latestData.storeName === 'string' && latestData.storeName.trim() === '')) {
        missingFields.push('Shop Name');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!latestData.email || (typeof latestData.email === 'string' && latestData.email.trim() === '')) {
        missingFields.push('Email Address');
      } else if (latestData.email && !emailRegex.test(latestData.email.trim().toLowerCase())) {
        missingFields.push('Email Address (invalid format)');
      }
      
      if (!latestData.mobileNumber || (typeof latestData.mobileNumber === 'string' && latestData.mobileNumber.trim() === '')) {
        missingFields.push('Mobile Number');
      }
      if (!latestData.pincode || (typeof latestData.pincode === 'string' && latestData.pincode.trim() === '')) {
        missingFields.push('Pincode');
      }

      // Password validation
      if (!password || password.length < 6) {
        missingFields.push('Password (minimum 6 characters)');
      }

      if (missingFields.length > 0) {
        console.error('[submitRegistration] Missing required fields:', missingFields);
        return {
          success: false,
          message: `Please complete all required fields:\n\n${missingFields.join('\n')}\n\nNote: Make sure you've filled all steps of the registration form.`,
        };
      }

      // Log that validation passed
      console.log('[submitRegistration] Validation passed, proceeding with registration...');

      // Import Supabase shop service
      const { completeVendorRegistration } = await import('../services/shops');
      
      // Convert RegistrationData to match shop service interface
      // Use latestData to ensure we have the most recent data
      const shopRegistrationData = {
        // Step 1: Basic Details
        ownerName: latestData.ownerName!,
        storeName: latestData.storeName!,
        shopPlot: latestData.shopPlot,
        floor: latestData.floor,
        building: latestData.building,
        pincode: latestData.pincode || '',
        latitude: latestData.location?.latitude,
        longitude: latestData.location?.longitude,
        area: latestData.area,
        city: latestData.city,
        storePhotos: latestData.storePhotos?.map((p: any) => typeof p === 'string' ? p : p.uri) || [],
        shopType: latestData.shopType,
        
        // Step 2: Contact Details
        email: latestData.email!,
        mobileNumber: latestData.mobileNumber!,
        whatsappNumber: latestData.whatsappNumber,
        isWhatsAppSame: latestData.isWhatsAppSame ?? true,
        otpVerified: latestData.otpVerified || false,
        
        // Step 3: Working Days
        workingDays: latestData.workingDays || [],
        sameTime: latestData.sameTime ?? true,
        commonOpenTime: latestData.commonOpenTime,
        commonCloseTime: latestData.commonCloseTime,
        dayTimes: latestData.dayTimes ? Object.keys(latestData.dayTimes).reduce((acc, day) => {
          const times = latestData.dayTimes![day];
          acc[day] = {
            open: times.open instanceof Date ? times.open.toTimeString().slice(0, 5) : (typeof times.open === 'string' ? times.open : String(times.open)),
            close: times.close instanceof Date ? times.close.toTimeString().slice(0, 5) : (typeof times.close === 'string' ? times.close : String(times.close)),
          };
          return acc;
        }, {} as Record<string, { open: string; close: string }>) : undefined,
        
        // Step 4: Documents
        documents: latestData.documents ? {
          pan: typeof latestData.documents.pan === 'string' ? latestData.documents.pan : latestData.documents.pan?.uri,
          gst: typeof latestData.documents.gst === 'string' ? latestData.documents.gst : latestData.documents.gst?.uri,
          fssai: typeof latestData.documents.fssai === 'string' ? latestData.documents.fssai : latestData.documents.fssai?.uri,
          shopLicense: typeof latestData.documents.shopLicense === 'string' ? latestData.documents.shopLicense : latestData.documents.shopLicense?.uri,
          aadhaar: typeof latestData.documents.aadhaar === 'string' ? latestData.documents.aadhaar : latestData.documents.aadhaar?.uri,
        } : undefined,
        
        // Step 5: Bank Details
        bankDetails: latestData.bankDetails,
        
        // Step 6: Contract
        contractAccepted: latestData.contractAccepted || false,
        profitShare: latestData.profitShare || 20,
        signature: typeof latestData.signature === 'string' ? latestData.signature : latestData.signature,
        
        // Password for account creation
        password: password,
      };
      
      console.log('[submitRegistration] Prepared shop registration data:', {
        ownerName: shopRegistrationData.ownerName,
        storeName: shopRegistrationData.storeName,
        email: shopRegistrationData.email,
        mobileNumber: shopRegistrationData.mobileNumber,
        pincode: shopRegistrationData.pincode,
        hasDocuments: !!shopRegistrationData.documents,
        hasBankDetails: !!shopRegistrationData.bankDetails,
        contractAccepted: shopRegistrationData.contractAccepted,
      });
      
      // Submit registration directly to Supabase
      console.log('[submitRegistration] Calling completeVendorRegistration...');
      const result = await completeVendorRegistration(shopRegistrationData);
      
      console.log('[submitRegistration] Registration result:', {
        success: result.success,
        hasShop: !!result.shop,
        hasUserId: !!result.userId,
        error: result.error,
      });
      
      if (result.success) {
        // Store shop and user data for immediate login
        if (result.shop && result.userId) {
          try {
            const vendorData = {
              user: {
                id: result.userId,
                email: registrationData.email!,
                name: registrationData.ownerName!,
                phone: registrationData.mobileNumber!,
              },
              shop: result.shop, // Shop object already contains id and name
            };
            await AsyncStorage.setItem('vendor_data', JSON.stringify(vendorData));
            console.log('[submitRegistration] ✅ Vendor data stored successfully:', {
              userId: result.userId,
              shopId: result.shop.id,
              shopName: result.shop.name,
            });
          } catch (storageError) {
            console.error('[submitRegistration] Error storing vendor data:', storageError);
          }
        }
        
        // Clear registration data after successful submission
        await clearRegistrationData();
        
        console.log('[submitRegistration] ✅ Registration completed successfully!');
        return {
          success: true,
          message: 'Registration successful! Your shop has been created and saved to Supabase. Please wait for admin approval.',
        };
      }
      
      console.error('[submitRegistration] ❌ Registration failed:', result.error);
      return {
        success: false,
        message: result.error || 'Registration failed. Please try again.',
      };
    } catch (error: any) {
      console.error('Submission error:', error);
      
      let errorMessage = 'Network error. Please check your connection.';
      
      if (error.message) {
        if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please ensure:\n1. Backend server is running\n2. If using a device/emulator, update the API URL to your computer\'s IP address\n3. Check your internet connection';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${mStr} ${ampm}`;
  };

  return (
    <RegistrationContext.Provider
      value={{
        registrationData,
        updateRegistrationData,
        clearRegistrationData,
        submitRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}

