import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EntrepriseService, Entreprise } from '@/services/firebaseService';

export function useEntreprise() {
  const { user } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadEntreprise = async () => {
      if (!user) {
        setEntreprise(null);
        setLoading(false);
        return;
      }

      try {
        // First try to get the entreprise directly by userId
        const entrepriseData = await EntrepriseService.getByUserId(user.uid);
        
        if (entrepriseData) {
          setEntreprise(entrepriseData);
          setLoading(false);
        } else {
          // If not found, set up a listener in case it's created
          unsubscribe = EntrepriseService.onSnapshotByUser(
            user.uid,
            (entreprises) => {
              if (entreprises.length > 0) {
                setEntreprise(entreprises[0]);
              } else {
                setEntreprise(null);
              }
              setLoading(false);
            },
            (error) => {
              setError(error.message);
              setLoading(false);
            }
          );
        }
      } catch (error) {
        console.error('Error loading entreprise:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        setLoading(false);
      }
    };

    loadEntreprise();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const updateEntreprise = async (data: Partial<Entreprise>): Promise<void> => {
    if (!user || !entreprise) {
      throw new Error('Utilisateur non connecté ou entreprise non trouvée');
    }

    try {
      await EntrepriseService.update(entreprise.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating entreprise:', error);
      throw new Error(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const hasCompletedOnboarding = (): boolean => {
    return !!entreprise;
  };

  const uploadLogo = async (file: File): Promise<string> => {
    if (!user || !entreprise) {
      throw new Error('Utilisateur non connecté ou entreprise non trouvée');
    }

    try {
      return await EntrepriseService.uploadLogo(entreprise.id, file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error(error instanceof Error ? error.message : 'Une erreur est survenue lors du téléchargement du logo');
    }
  };

  return {
    entreprise,
    loading,
    error,
    updateEntreprise,
    hasCompletedOnboarding,
    uploadLogo
  };
}