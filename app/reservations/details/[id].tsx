import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking, Modal, TextInput, Platform } from 'react-native';
import { ArrowLeft, Car, User, Calendar, Clock, FileText, Phone, Mail, DollarSign, CreditCard as Edit, Trash2, Download } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

  const handleDeleteReservation = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
        deleteReservation(reservation.id)
          .then(() => router.back())
          .catch(() => window.alert('Impossible de supprimer la réservation'));
      }
    } else {
      Alert.alert(
        'Supprimer la réservation',
        'Êtes-vous sûr de vouloir supprimer cette réservation ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteReservation(reservation.id);
                router.back();
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer la réservation');
              }
            }
          }
        ]
      );
    }
  };

  const handleGenerateContract = async () => {
    if (!client.email) {
      if (Platform.OS === 'web') {
        window.alert('Email manquant: Le client n\'a pas d\'adresse email. Veuillez ajouter une adresse email au client pour pouvoir envoyer le contrat.');
      } else {
        Alert.alert(
          'Email manquant',
          'Le client n\'a pas d\'adresse email. Veuillez ajouter une adresse email au client pour pouvoir envoyer le contrat.',
          [{ text: 'OK' }]
        );
      }
      return;
    }

    try {
      if (success) {
        // Refresh contract URL
        const contract = await getContractByReservationId(reservation.id);
        if (contract && contract.contractUrl) {
          setContractUrl(contract.contractUrl);
        }
        
        if (Platform.OS === 'web') {
          window.alert(`Le contrat a été généré avec succès et envoyé à ${client.email}.`);
        } else {
          Alert.alert(
            'Contrat généré',
            `Le contrat a été généré avec succès et envoyé à ${client.email}.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Impossible de générer ou d\'envoyer le contrat. Veuillez réessayer.');
        } else {
          Alert.alert(
            'Erreur',
            "Impossible de générer ou d'envoyer le contrat. Veuillez réessayer.",
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Une erreur est survenue lors de la génération du contrat.');
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de la génération du contrat.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleViewContract = async () => {
    if (contractUrl) {
      try {
        // Send email to client
        if (client?.email) {
          try {
            await sendContractEmail(contractUrl, client.email, `${vehicle.marque} ${vehicle.modele}`, client.prenom);
          } catch (error) {
            console.error('Error sending contract email:', error);
          }
        }
        
        if (Platform.OS === 'web') {
          window.open(contractUrl, '_blank');
        } else {
          // For mobile, use Linking
          const supported = await Linking.canOpenURL(contractUrl);
          if (supported) {
            await Linking.openURL(contractUrl);
          } else {
            if (Platform.OS === 'web') {
              window.alert('Impossible d\'ouvrir le contrat. L\'URL n\'est pas supportée.');
            } else {
              Alert.alert(
                'Erreur',
                'Impossible d\'ouvrir le contrat. L\'URL n\'est pas supportée.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Impossible d\'ouvrir le contrat.');
        } else {
          Alert.alert(
            'Erreur',
            'Impossible d\'ouvrir le contrat.',
            [{ text: 'OK' }]
          );
        }
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Aucun contrat n\'a été généré pour cette réservation.');
      } else {
        Alert.alert(
          'Contrat non disponible',
          'Aucun contrat n\'a été généré pour cette réservation.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Send contract by email to client
  const sendContractEmail = async (contractUrl: string, email: string, vehicleInfo: string, clientName: string) => {
    try {
      const apiUrl =
        (typeof window !== 'undefined' && window.location && window.location.origin)
          ? `${window.location.origin}/api/send-email`
          : process.env.EXPO_PUBLIC_API_URL
            ? `${process.env.EXPO_PUBLIC_API_URL}/api/send-email`
            : 'https://easygarage-app.vercel.app/api/send-email';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: `Votre contrat de location - ${vehicleInfo}`,
          userId: user?.uid || '',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563EB;">Contrat de location</h2>
              <p>Bonjour ${clientName},</p>
              <p>Veuillez trouver ci-joint votre contrat de location pour le véhicule <strong>${vehicleInfo}</strong>.</p>
              <p>Vous pouvez télécharger votre contrat en cliquant sur le lien ci-dessous :</p>
              <p><a href="${contractUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Télécharger le contrat</a></p>
              <p>Merci de votre confiance.</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                EasyGarage<br>
                Cet email a été généré automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          `,
          attachments: [
            {
              filename: 'contrat_location.pdf',
              url: contractUrl,
              type: 'application/pdf'
            }
          ]
        })
      });

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleSaveOwnerPayment = async () => {
    if (!reservation) return;
    
    try {
    const amount = parseFloat(ownerPaymentAmount) || 0;
    updateReservation(reservation.id, {
      montantReverseProprietaire: amount
    }).then(() => {
      // Créer une charge pour le paiement au propriétaire si montant > 0
      if (amount > 0) {
        const chargeData = {
          nom: `Paiement propriétaire - Réservation ${reservation.id.substring(0, 6)}`,
          montantMensuel: amount,
          userId: user?.uid || '',
          type: 'Variable' as 'Variable',
          dateDebut: new Date().toISOString().split('T')[0],
          frequence: 'Mensuelle' as 'Mensuelle',
          vehiculeId: vehicle?.id,
          estPaiementProprietaire: true
        };
        
        // Ajouter la charge via le service avec URL absolue
        const apiUrlCharges =
          (typeof window !== 'undefined' && window.location && window.location.origin)
            ? `${window.location.origin}/api/charges/add`
            : process.env.EXPO_PUBLIC_API_URL
              ? `${process.env.EXPO_PUBLIC_API_URL}/api/charges/add`
              : 'https://easygarage-app.vercel.app/api/charges/add';
        
        fetch(apiUrlCharges, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chargeData)
        }).catch(error => {
          console.error('Error adding owner payment charge:', error);
        });
      }
      
      setShowOwnerPaymentModal(false);
      
      if (Platform.OS === 'web') {
        window.alert('Paiement au propriétaire enregistré');
      } else {
        Alert.alert('Succès', 'Paiement au propriétaire enregistré');
      }
    }).catch(error => {
      if (Platform.OS === 'web') {
        window.alert('Impossible d\'enregistrer le paiement');
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement');
      }
    });
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Impossible d\'enregistrer le paiement');
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement');
      }
    }
  };