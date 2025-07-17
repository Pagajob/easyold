export default function AddReservationScreen() {
  const { colors } = useTheme();
  const { vehicles, clients, reservations, addReservation, addClient } = useData();
  const { user, abonnementUtilisateur, getAbonnementCourant } = useAuth();
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showDualDatePicker, setShowDualDatePicker] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarType, setCalendarType] = useState<'start' | 'end'>('start');
  
  // Get reserved dates for the selected vehicle
  const getReservedDatesForVehicle = () => {
    if (!selectedVehicle) return [];
    
    return reservations
      .filter(r => 
        r.vehiculeId === selectedVehicle && 
        r.statut !== 'Annulé' && 
        r.statut !== 'Terminé'
      )
      .flatMap(r => {
        // Generate all dates between start and end date
        const dates = [];
        const start = new Date(r.dateDebut);
        const end = new Date(r.dateRetourPrevue);
        
        // Set to midnight for proper comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Add each date in the range
        const current = new Date(start);
        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        
        return dates;
      });
  };
  
  const reservedDates = getReservedDatesForVehicle();
  
  const [reservationData, setReservationData] = useState({
    typeContrat: 'Location' as 'Location' | 'Prêt',
    dateDebut: '',
    heureDebut: '18:00',
    dateRetourPrevue: '',
    heureRetourPrevue: '18:00',
    montantLocation: 0,
    montantCalcule: 0,
  });

  const [newClientData, setNewClientData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    permisConduire: '',
    carteIdentite: '',
    notes: '',
  });

  const availableVehicles = vehicles.filter(v => v.statut === 'Disponible');
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  const calculateDays = () => {
    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) return 0;
    const start = new Date(reservationData.dateDebut);
    const end = new Date(reservationData.dateRetourPrevue);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateIncludedKm = () => {
    if (!selectedVehicleData) return 0;
    return calculateDays() * selectedVehicleData.kilometrageJournalier;
  };

  const isWeekendRental = () => {
    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) return false;
    const start = new Date(reservationData.dateDebut);
    const end = new Date(reservationData.dateRetourPrevue);
    
    // Vérifier si c'est un week-end (vendredi soir au dimanche soir)
    const startDay = start.getDay();
    const endDay = end.getDay();
    const startHour = parseInt(reservationData.heureDebut.split(':')[0]);
    const endHour = parseInt(reservationData.heureRetourPrevue.split(':')[0]);
    
    return (startDay === 5 && startHour >= 17) && (endDay === 0 && endHour <= 21);
  };

  const calculateAutomaticPrice = () => {
    if (!selectedVehicleData) return 0;
    
    const days = calculateDays();
    const isWeekend = isWeekendRental();
    
    if (isWeekend && selectedVehicleData.prix_base_weekend) {
      return selectedVehicleData.prix_base_weekend;
    } else if (selectedVehicleData.prix_base_24h) {
      return selectedVehicleData.prix_base_24h * days;
    }
    
    return 0;
  };

  const handleDualDateSelect = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    setReservationData(prev => ({
      ...prev,
      dateDebut: startDate,
      heureDebut: startTime,
      dateRetourPrevue: endDate,
      heureRetourPrevue: endTime
    }));
    setShowDualDatePicker(false);
  };

  // Recalculer le prix automatiquement quand les données changent
  React.useEffect(() => {
    const automaticPrice = calculateAutomaticPrice();
    setReservationData(prev => ({
      ...prev,
      montantCalcule: automaticPrice,
      montantLocation: prev.montantLocation === 0 ? automaticPrice : prev.montantLocation
    }));
  }, [selectedVehicle, reservationData.dateDebut, reservationData.dateRetourPrevue, reservationData.heureDebut, reservationData.heureRetourPrevue]);

  const openCalendarPicker = (type: 'start' | 'end') => {
    setCalendarType(type);
    setShowCalendarPicker(true);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    if (calendarType === 'start') {
      setReservationData(prev => ({
        ...prev,
        dateDebut: date,
        heureDebut: time
      }));
    } else {
      setReservationData(prev => ({
        ...prev,
        dateRetourPrevue: date,
        heureRetourPrevue: time
      }));
    }
    setShowCalendarPicker(false);
  };

  const formatDisplayDate = (dateString: string, timeString: string) => {
    if (!dateString) return 'Sélectionner';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('fr-FR')} à ${timeString}`;
  };

  const pickDocument = async (type: 'permis' | 'carte') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'permis') {
          setNewClientData(prev => ({ ...prev, permisConduire: result.assets[0].uri }));
        } else {
          setNewClientData(prev => ({ ...prev, carteIdentite: result.assets[0].uri }));
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document.');
    }
  };

  // Convert URI to Blob for upload
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const handleCreateClient = async () => {
    if (!newClientData.prenom || !newClientData.nom) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum le prénom et le nom.');
      return;
    }

    setIsCreatingClient(true);

    try {
      const clientData: Omit<Client, 'id'> = {
        userId: user?.uid || '',
        prenom: newClientData.prenom,
        nom: newClientData.nom,
        telephone: newClientData.telephone,
        email: newClientData.email,
        adresse: newClientData.adresse,
        permisConduire: '',
        carteIdentite: '',
        notes: newClientData.notes,
      };

      // Créer d'abord le client pour obtenir son ID
      const newClientId = await ClientService.create(clientData);

      // Upload documents to Firebase Storage if they exist
      if (newClientData.permisConduire || newClientData.carteIdentite) {
        const updateData: Partial<Client> = {};

        if (newClientData.permisConduire) {
          try {
            const permisBlob = await uriToBlob(newClientData.permisConduire);
            const permisUrl = await ClientService.uploadDocument(newClientId, permisBlob, 'permis');
            updateData.permisConduire = permisUrl;
          } catch (error) {
            console.warn('Failed to upload driving license:', error);
            // Continue without document
          }
        }

        if (newClientData.carteIdentite) {
          try {
            const carteBlob = await uriToBlob(newClientData.carteIdentite);
            const carteUrl = await ClientService.uploadDocument(newClientId, carteBlob, 'carte');
            updateData.carteIdentite = carteUrl;
          } catch (error) {
            console.warn('Failed to upload ID card:', error);
            // Continue without document
          }
        }

        // Mettre à jour le client avec les URLs des documents
        if (Object.keys(updateData).length > 0) {
          await ClientService.update(newClientId, updateData);
        }
      }
      
      // Fermer le modal
      setShowNewClientModal(false);
      
      // Reset form
      setNewClientData({
        prenom: '',
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        permisConduire: '',
        carteIdentite: '',
        notes: '',
      });

      // Afficher un message de succès
      Alert.alert('Succès', 'Client créé avec succès ! Vous pouvez maintenant le sélectionner dans la liste.');

    } catch (error) {
      console.error('Error creating client:', error);
      Alert.alert('Erreur', 'Impossible de créer le client. Veuillez réessayer.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSaveReservation = () => {
    if (!selectedVehicle || !selectedClient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule et un client.');
      return;
    }

    if (!reservationData.dateDebut || !reservationData.dateRetourPrevue) {
      Alert.alert('Erreur', 'Veuillez remplir les dates de début et de retour.');
      return;
    }

    // Vérifier que la date de retour est après la date de début
    const startDate = new Date(`${reservationData.dateDebut}T${reservationData.heureDebut}`);
    const endDate = new Date(`${reservationData.dateRetourPrevue}T${reservationData.heureRetourPrevue}`);
    
    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de retour doit être postérieure à la date de départ.');
      return;
    }

    const reservation: Omit<Reservation, 'id'> = {
      userId: user?.uid || '',
      vehiculeId: selectedVehicle,
      clientId: selectedClient,
      typeContrat: reservationData.typeContrat,
      dateDebut: reservationData.dateDebut,
      heureDebut: reservationData.heureDebut,
      dateRetourPrevue: reservationData.dateRetourPrevue,
      heureRetourPrevue: reservationData.heureRetourPrevue,
      statut: 'Planifiée',
      montantLocation: reservationData.montantLocation,
    };

    addReservation(reservation);
    Alert.alert('Succès', 'Votre réservation a bien été créée');
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step && styles.stepTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderVehicleSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🏎️ Sélectionner un véhicule</Text>
      
      {availableVehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <Car size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun véhicule disponible</Text>
          <Text style={styles.emptySubtitle}>
            Tous les véhicules sont actuellement loués ou en maintenance
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.vehiclesList} showsVerticalScrollIndicator={false}>
          {availableVehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                selectedVehicle === vehicle.id && styles.vehicleCardSelected
              ]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              {vehicle.photo ? (
                <Image source={{ uri: vehicle.photo }} style={styles.vehicleImage} />
              ) : (
                <View style={styles.vehiclePlaceholder}>
                  <Car size={24} color={colors.textSecondary} />
                </View>
              )}
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.marque} {vehicle.modele}
                </Text>
                <Text style={styles.vehicleImmat}>{vehicle.immatriculation}</Text>
                <Text style={styles.vehicleKm}>
                  {vehicle.kilometrageJournalier} km/jour inclus
                </Text>
                {vehicle.prix_base_24h && (
                  <Text style={styles.vehiclePrice}>
                    À partir de {vehicle.prix_base_24h}€/jour
                  </Text>
                )}
              </View>
              
              <View style={styles.vehicleStatus}>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    Disponible
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderDateTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dates et heures de location</Text>
      
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity 
          style={styles.dualDateButton}
          onPress={() => setShowDualDatePicker(true)}
        >
          <Calendar size={24} color={colors.primary} />
          <View style={styles.dualDateButtonContent}>
            <Text style={styles.dualDateButtonTitle}>Sélectionner les dates de location</Text>
            {reservationData.dateDebut && reservationData.dateRetourPrevue ? (
              <View style={styles.selectedDatesContainer}>
                <Text style={styles.selectedDateText}>
                  🚀 Départ: {formatDisplayDate(reservationData.dateDebut, reservationData.heureDebut)}
                </Text>
                <Text style={styles.selectedDateText}>
                  🔙 Retour: {formatDisplayDate(reservationData.dateRetourPrevue, reservationData.heureRetourPrevue)}
                </Text>
              </View>
            ) : (
              <Text style={styles.dualDateButtonSubtitle}>
                Choisissez les dates et heures de départ et de retour
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {reservationData.dateDebut && reservationData.dateRetourPrevue && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Résumé de la location</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Durée:</Text>
            <Text style={styles.summaryValue}>{calculateDays()} jour(s)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kilométrage inclus:</Text>
            <Text style={styles.summaryValue}>{calculateIncludedKm()} km</Text>
          </View>
          {isWeekendRental() && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>Week-end</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.contractSection}>
        <Text style={styles.sectionTitle}>📄 Type de contrat</Text>
        
        <View style={styles.contractOptions}>
          {['Location', 'Prêt'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.contractOption,
                reservationData.typeContrat === type && styles.contractOptionActive
              ]}
              onPress={() => setReservationData(prev => ({ 
                ...prev, 
                typeContrat: type as 'Location' | 'Prêt'
              }))}
            >
              <Text style={[
                styles.contractOptionText,
                reservationData.typeContrat === type && styles.contractOptionTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Prix */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingSectionHeader}>
            <Text style={{ fontSize: 18 }}>💰</Text>
            <Text style={styles.pricingSectionTitle}>Prix de la location</Text>
          </View>
          
          {reservationData.montantCalcule > 0 && (
            <View style={styles.calculatedPriceRow}>
              <Text style={styles.calculatedPriceLabel}>Prix calculé automatiquement:</Text>
              <Text style={styles.calculatedPriceValue}>
                {reservationData.montantCalcule.toLocaleString('fr-FR')} €
              </Text>
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix final (€)</Text>
            <TextInput
              style={styles.input}
              value={reservationData.montantLocation.toString()}
              onChangeText={(text) => setReservationData(prev => ({ 
                ...prev, 
                montantLocation: parseFloat(text) || 0 
              }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.helpText}>
              Vous pouvez modifier le prix calculé automatiquement
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderClientSelection = () => (
    <View style={styles.stepContent}>
      <View style={styles.clientHeader}>
        <Text style={styles.stepTitle}>Sélectionner un client</Text>
        <TouchableOpacity
          style={styles.newClientButton}
          onPress={() => setShowNewClientModal(true)}
        >
          <Plus size={20} color={colors.background} />
          <Text style={styles.newClientButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>
      
      {clients.length === 0 ? (
        <View style={styles.emptyState}>
          <User size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun client</Text>
          <Text style={styles.emptySubtitle}>
            Créez votre premier client pour continuer
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.clientsList} showsVerticalScrollIndicator={false}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[
                styles.clientCard,
                selectedClient === client.id && styles.clientCardSelected
              ]}
              onPress={() => setSelectedClient(client.id)}
            >
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {client.prenom.charAt(0)}{client.nom.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {client.prenom} {client.nom}
                </Text>
                {client.telephone && (
                  <Text style={styles.clientContact}>{client.telephone}</Text>
                )}
                {client.email && (
                  <Text style={styles.clientContact}>{client.email}</Text>
                )}
              </View>
              
              <View style={styles.clientDocuments}>
                {client.permisConduire && (
                  <View style={styles.documentBadge}>
                    <Text style={styles.documentText}>Permis</Text>
                  </View>
                )}
                {client.carteIdentite && (
                  <View style={styles.documentBadge}>
                    <Text style={styles.documentText}>ID</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderNewClientModal = () => (
    <Modal
      visible={showNewClientModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNewClientModal(false)}>
            <Text style={styles.modalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nouveau client</Text>
          <TouchableOpacity 
            onPress={handleCreateClient}
            disabled={isCreatingClient}
          >
            <Text style={[styles.modalSave, isCreatingClient && styles.modalSaveDisabled]}>
              {isCreatingClient ? 'Création...' : 'Créer'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={newClientData.prenom}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, prenom: text }))}
              placeholder="Prénom"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={newClientData.nom}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, nom: text }))}
              placeholder="Nom de famille"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={newClientData.telephone}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, telephone: text }))}
              placeholder="06 12 34 56 78"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={newClientData.email}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, email: text }))}
              placeholder="email@exemple.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={newClientData.adresse}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, adresse: text }))}
              placeholder="Adresse complète"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Permis de conduire</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('permis')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {newClientData.permisConduire ? 'Document ajouté' : 'Ajouter le permis'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carte d'identité</Text>
            <TouchableOpacity 
              style={styles.documentButton}
              onPress={() => pickDocument('carte')}
            >
              <Upload size={20} color={colors.primary} />
              <Text style={styles.documentButtonText}>
                {newClientData.carteIdentite ? 'Document ajouté' : 'Ajouter la carte d\'identité'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newClientData.notes}
              onChangeText={(text) => setNewClientData(prev => ({ ...prev, notes: text }))}
              placeholder="Notes sur le client..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedVehicle !== '';
      case 2:
        return reservationData.dateDebut && reservationData.dateRetourPrevue;
      case 3:
        return selectedClient !== '';
      default:
        return false;
    }
  };

  const styles = createStyles(colors);

  // Contrôle de la limite d'abonnement
  const reservationsMax = getAbonnementCourant()?.reservationsMax ?? 5;
  useEffect(() => {
    if (reservations.length >= reservationsMax) {
      setShowRestrictionModal(true);
    }
  }, [reservations, reservationsMax]);

  // At the end of the component
}