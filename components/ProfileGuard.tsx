import { useAuth } from '@/contexts/AuthContext';
import { useEntreprise } from '@/hooks/useEntreprise';
import { useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const { entreprise, loading: entrepriseLoading } = useEntreprise();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && !entreprise && pathname !== '/onboarding') {
      router.replace('/onboarding' as any);
    } else if (!loading && user && entreprise && userProfile && (!userProfile.prenom || !userProfile.nom || !userProfile.telephone) && pathname !== '/onboarding-profile') {
      router.replace('/onboarding-profile' as any);
    }
  }, [user, userProfile, entreprise, loading, entrepriseLoading, pathname]);

  return <>{children}</>;
} 