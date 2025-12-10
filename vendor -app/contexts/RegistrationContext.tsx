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
      // Validate required fields
      if (!registrationData.ownerName || !registrationData.storeName || !registrationData.email || !registrationData.mobileNumber) {
        return {
          success: false,
          message: 'Please complete all required fields before submitting',
        };
      }

      // Import API function
      const { submitVendorRegistration } = await import('../services/api');
      
      // Convert RegistrationData to match API interface (make required fields non-optional)
      const apiData = {
        ownerName: registrationData.ownerName!,
        storeName: registrationData.storeName!,
        email: registrationData.email!,
        mobileNumber: registrationData.mobileNumber!,
        pincode: registrationData.pincode || '',
        contractAccepted: registrationData.contractAccepted || false,
        isWhatsAppSame: registrationData.isWhatsAppSame ?? true,
        otpVerified: registrationData.otpVerified || false,
        workingDays: registrationData.workingDays || [],
        sameTime: registrationData.sameTime ?? true,
        // Optional fields
        address: registrationData.address,
        shopPlot: registrationData.shopPlot,
        floor: registrationData.floor,
        building: registrationData.building,
        location: registrationData.location,
        area: registrationData.area,
        city: registrationData.city,
        storePhotos: registrationData.storePhotos?.map(p => p.uri) || [],
        whatsappNumber: registrationData.whatsappNumber,
        commonOpenTime: registrationData.commonOpenTime,
        commonCloseTime: registrationData.commonCloseTime,
        dayTimes: registrationData.dayTimes ? Object.keys(registrationData.dayTimes).reduce((acc, day) => {
          const times = registrationData.dayTimes![day];
          acc[day] = {
            open: times.open instanceof Date ? times.open.toISOString() : String(times.open),
            close: times.close instanceof Date ? times.close.toISOString() : String(times.close),
          };
          return acc;
        }, {} as Record<string, { open: string; close: string }>) : undefined,
        documents: registrationData.documents ? {
          pan: typeof registrationData.documents.pan === 'string' ? registrationData.documents.pan : registrationData.documents.pan?.uri,
          gst: typeof registrationData.documents.gst === 'string' ? registrationData.documents.gst : registrationData.documents.gst?.uri,
          fssai: typeof registrationData.documents.fssai === 'string' ? registrationData.documents.fssai : registrationData.documents.fssai?.uri,
          shopLicense: typeof registrationData.documents.shopLicense === 'string' ? registrationData.documents.shopLicense : registrationData.documents.shopLicense?.uri,
          aadhaar: typeof registrationData.documents.aadhaar === 'string' ? registrationData.documents.aadhaar : registrationData.documents.aadhaar?.uri,
        } : undefined,
        bankDetails: registrationData.bankDetails,
        profitShare: registrationData.profitShare,
        signature: registrationData.signature,
        shopType: registrationData.shopType,
      };
      
      // Submit registration using the backend API
      const result = await submitVendorRegistration(apiData, password);
      
      if (result.success) {
        // Clear registration data after successful submission
        await clearRegistrationData();
      }
      
      return {
        success: result.success,
        message: result.message,
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

