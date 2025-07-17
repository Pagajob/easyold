import { useSettings, CompanyInfo } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanySettings() {
  const { companyInfo, updateCompanyInfo, saveCompanyInfo, loading } = useSettings();
  const { user } = useAuth();
  
  // Add userId to company info when saving
  const updateCompanyInfoWithUserId = async (info: Partial<CompanyInfo>) => {
    return updateCompanyInfo({
      ...info,
      userId: user?.uid || ''
    });
  };

  const hasLogo = () => !!companyInfo.logo;
  const hasAddress = () => !!companyInfo.adresse;
  const hasSiret = () => !!companyInfo.siret;
  
  const isCompanyInfoComplete = () => {
    return companyInfo.nom && companyInfo.adresse;
  };

  const getCompanyDisplayName = () => {
    return companyInfo.nom || 'Tajirent';
  };

  const getExtraFees = () => {
    return companyInfo.frais_supplementaires || {
      predefined: [
        { id: '1', label: 'Carburant manquant', price: 3, enabled: true, unit: '/litre' },
        { id: '2', label: 'Retard (par tranche de 30min)', price: 25, enabled: true },
        { id: '3', label: 'Jante frottée', price: 150, enabled: true },
        { id: '4', label: 'Nettoyage', price: 80, enabled: true },
      ],
      custom: []
    };
  };

  const getEnabledExtraFees = () => {
    const fees = getExtraFees();
    const enabledPredefined = fees.predefined.filter(fee => fee.enabled);
    return [...enabledPredefined, ...fees.custom];
  };

  // Get the fuel fee specifically
  const getFuelFee = () => {
    const fees = getExtraFees();
    return fees.predefined.find(fee => fee.id === '1' && fee.label === 'Carburant manquant');
  };

  return {
    companyInfo,
    updateCompanyInfo: updateCompanyInfoWithUserId,
    saveCompanyInfo,
    hasLogo,
    hasAddress,
    hasSiret,
    isCompanyInfoComplete,
    getCompanyDisplayName,
    getExtraFees,
    getEnabledExtraFees,
    getFuelFee,
    loading,
  };
}