import { useData } from '@/contexts/DataContext';
import { Client } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export function useClients() {
  const { clients, addClient, updateClient, deleteClient, loading, error } = useData();
  const { user } = useAuth();

  // Only find clients belonging to the current user
  const getClientById = (id: string) => clients.find(c => c.id === id && c.userId === user?.uid);
  
  const getClientName = (id: string) => {
    const client = getClientById(id);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  };

  const getClientInitials = (id: string) => {
    const client = getClientById(id);
    return client ? `${client.prenom.charAt(0)}${client.nom.charAt(0)}` : '??';
  };

  const searchClients = (query: string, userId = user?.uid) => {
    if (!query.trim()) return clients;
    
    const searchTerm = query.toLowerCase();
    return clients.filter(client => 
      (client.prenom.toLowerCase().includes(searchTerm) ||
       client.nom.toLowerCase().includes(searchTerm) ||
       client.email?.toLowerCase().includes(searchTerm) ||
       client.telephone?.includes(searchTerm)) &&
      client.userId === userId
    );
  };

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    getClientName,
    getClientInitials,
    searchClients,
    loading,
    error,
  };
}