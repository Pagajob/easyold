import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Collection name
const COLLECTION = 'invitations';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  expiresAt: Timestamp | Date;
  acceptedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  inviterId: string;
  companyId: string;
  companyName: string;
  status: 'pending' | 'accepted' | 'expired';
}

export class InvitationService {
  /**
   * Create a new invitation
   */
  static async create(invitation: Omit<Invitation, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...invitation,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error(`Failed to create invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invitation by token
   */
  static async getByToken(token: string): Promise<Invitation | null> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('token', '==', token)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Invitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw new Error(`Failed to get invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invitations by company ID
   */
  static async getByCompany(companyId: string): Promise<Invitation[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
    } catch (error) {
      console.error('Error getting invitations by company:', error);
      throw new Error(`Failed to get invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invitations by inviter ID
   */
  static async getByInviter(inviterId: string): Promise<Invitation[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('inviterId', '==', inviterId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
    } catch (error) {
      console.error('Error getting invitations by inviter:', error);
      throw new Error(`Failed to get invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update invitation
   */
  static async update(id: string, data: Partial<Invitation>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating invitation:', error);
      throw new Error(`Failed to update invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete invitation
   */
  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw new Error(`Failed to delete invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Listen to invitations by inviter ID
   */
  static onSnapshotByInviter(
    inviterId: string,
    callback: (invitations: Invitation[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    const q = query(
      collection(db, COLLECTION),
      where('inviterId', '==', inviterId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const invitations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invitation[];
        callback(invitations);
      },
      (error) => {
        console.error('Error in invitation snapshot listener:', error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
  }

  /**
   * Check if invitation is valid
   */
  static isValid(invitation: Invitation): boolean {
    if (invitation.status !== 'pending') {
      return false;
    }
    
    const expiresAt = invitation.expiresAt instanceof Timestamp 
      ? invitation.expiresAt.toDate() 
      : new Date(invitation.expiresAt);
    
    return expiresAt > new Date();
  }
}