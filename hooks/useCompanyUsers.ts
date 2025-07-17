import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { InvitationService, Invitation } from '@/services/invitationService';

interface CompanyUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isCurrentUser: boolean;
}

export function useCompanyUsers() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !userProfile?.companyId) {
      setLoading(false);
      return;
    }

    const loadCompanyUsers = async () => {
      setLoading(true);
      try {
        // Get all users with the same companyId
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('companyId', '==', userProfile.companyId)
        );
        
        const querySnapshot = await getDocs(q);
        const companyUsers = querySnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'user',
            isCurrentUser: doc.id === user.uid
          };
        });
        
        setUsers(companyUsers);
        
        // Get pending invitations
        const invitationData = await InvitationService.getByCompany(userProfile.companyId!);
        setInvitations(invitationData.filter(inv => inv.status === 'pending'));
        
      } catch (error) {
        console.error('Error loading company users:', error);
        setError('Failed to load company users');
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanyUsers();
  }, [user, userProfile]);

  // Listen for invitation changes
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = InvitationService.onSnapshotByInviter(
      user.uid,
      (invitationData) => {
        setInvitations(invitationData.filter(inv => inv.status === 'pending'));
      }
    );
    
    return () => unsubscribe();
  }, [user]);

  return {
    users,
    invitations,
    loading,
    error
  };
}