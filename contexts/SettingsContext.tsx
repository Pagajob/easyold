import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Type for predefined extra fees
interface ExtraFee {
  id: string;
  label: string;
  price: number;
  enabled: boolean;
  unit?: string; // Optional unit for fees like fuel (per liter)
}

// Type for custom extra fees
interface CustomFee {
  id: string;
  label: string;
  price: number;
}

// Type for all extra fees
interface ExtraFees {
  predefined: ExtraFee[];
  custom: CustomFee[];
}

export interface CompanyInfo {
  nom: string;
  siret: string;
  adresse: string;
  logo: string;
  userId?: string;
  frais_supplementaires?: ExtraFees;
}

interface SettingsContextType {
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => Promise<void>;
  saveCompanyInfo: () => Promise<void>;
  loading: boolean;
}

const defaultCompanyInfo: CompanyInfo = {
  nom: 'Entreprise',
  siret: '',
  adresse: '',
  logo: '',
  userId: '',
  frais_supplementaires: {
    predefined: [
      { id: '1', label: 'Carburant manquant', price: 3, enabled: true, unit: '/litre' },
      { id: '2', label: 'Retard (par tranche de 30min)', price: 25, enabled: true },
      { id: '3', label: 'Jante frottée', price: 150, enabled: true },
      { id: '4', label: 'Nettoyage', price: 80, enabled: true },
    ],
    custom: []
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      loadCompanyInfo(user.uid);
    } else {
      setCompanyInfo(defaultCompanyInfo);
      setLoading(false);
    }
  }, [user?.uid]);

  const loadCompanyInfo = async (userId: string) => {
    try {
      // Use user-specific key for storage
      // First try to get from Firestore
      const entrepriseDoc = await getDoc(doc(db, 'entreprises', userId));
      
      if (entrepriseDoc.exists()) {
        // Convert Firestore data to CompanyInfo format
        const entrepriseData = entrepriseDoc.data();
        setCompanyInfo({
          nom: entrepriseData.nom || defaultCompanyInfo.nom,
          siret: entrepriseData.siret || '',
          adresse: entrepriseData.adresse || '',
          logo: entrepriseData.logo || '',
          userId: userId,
          frais_supplementaires: entrepriseData.frais_supplementaires || defaultCompanyInfo.frais_supplementaires
        });
      } else {
        // Try to get from AsyncStorage as fallback
        const savedInfo = await AsyncStorage.getItem(`companyInfo_${userId}`);
        if (savedInfo) {
          const parsedInfo = JSON.parse(savedInfo);
          setCompanyInfo({ 
            ...defaultCompanyInfo, 
            ...parsedInfo,
            userId // Ensure userId is set
          });
          
          // Save to Firestore for future use
          await setDoc(doc(db, 'entreprises', userId), {
            nom: parsedInfo.nom || defaultCompanyInfo.nom,
            siret: parsedInfo.siret || '',
            adresse: parsedInfo.adresse || '',
            logo: parsedInfo.logo || '',
            userId: userId,
            frais_supplementaires: parsedInfo.frais_supplementaires || defaultCompanyInfo.frais_supplementaires,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Set default with userId
          setCompanyInfo({
            ...defaultCompanyInfo,
            userId
          });
        }
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyInfo = async (info: Partial<CompanyInfo>) => {
    const updatedInfo = { ...companyInfo, ...info };
    
    // Ensure userId is set from current user
    if (user?.uid && !updatedInfo.userId) {
      updatedInfo.userId = user.uid;
    }
    
    setCompanyInfo(updatedInfo);
    
    // Save to both AsyncStorage and Firestore
    try {
      // Save to AsyncStorage as backup
      // Exclude logo from AsyncStorage to prevent QuotaExceededError
      const { logo, ...infoWithoutLogo } = updatedInfo;
      const storageKey = `companyInfo_${updatedInfo.userId || 'default'}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(infoWithoutLogo));
      
      // Save to Firestore as primary storage
      if (updatedInfo.userId) {
        await setDoc(doc(db, 'entreprises', updatedInfo.userId), {
          nom: updatedInfo.nom || defaultCompanyInfo.nom,
          siret: updatedInfo.siret || '',
          adresse: updatedInfo.adresse || '',
          logo: updatedInfo.logo || '',
          userId: updatedInfo.userId,
          frais_supplementaires: updatedInfo.frais_supplementaires || defaultCompanyInfo.frais_supplementaires,
          updatedAt: new Date().toISOString(),
          // Only set createdAt if it's a new document
          ...(!(await getDoc(doc(db, 'entreprises', updatedInfo.userId))).exists() && {
            createdAt: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('Error saving company info:', error);
    }
  };

  const saveCompanyInfo = async () => {
    try {
      // Exclude logo from AsyncStorage to prevent QuotaExceededError
      const { logo, ...infoWithoutLogo } = companyInfo;
      const storageKey = `companyInfo_${companyInfo.userId || 'default'}`;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify(infoWithoutLogo));
      
      // Save to Firestore
      if (companyInfo.userId) {
        await setDoc(doc(db, 'entreprises', companyInfo.userId), {
          nom: companyInfo.nom || defaultCompanyInfo.nom,
          siret: companyInfo.siret || '',
          adresse: companyInfo.adresse || '',
          logo: companyInfo.logo || '',
          userId: companyInfo.userId,
          frais_supplementaires: companyInfo.frais_supplementaires || defaultCompanyInfo.frais_supplementaires,
          updatedAt: new Date().toISOString(),
          // Only set createdAt if it's a new document
          ...(!(await getDoc(doc(db, 'entreprises', companyInfo.userId))).exists() && {
            createdAt: new Date().toISOString()
          })
        });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving company info:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{
      companyInfo,
      updateCompanyInfo,
      saveCompanyInfo,
      loading,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};