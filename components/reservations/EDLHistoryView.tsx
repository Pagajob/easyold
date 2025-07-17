import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Fuel, 
  FileText, 
  Camera, 
  Video, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  Download,
  Share
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Reservation, Vehicle, Client } from '@/contexts/DataContext';

const { width: screenWidth } = Dimensions.get('window');

interface EDLHistoryViewProps {
  reservation: Reservation;
  vehicle: Vehicle | null;
  client: Client | null;
  onViewEDL?: (type: 'depart' | 'retour') => void;
  onDownloadPDF?: (type: 'depart' | 'retour') => void;
  onShareEDL?: (type: 'depart' | 'retour') => void;
}

export default function EDLHistoryView({ 
  reservation, 
  vehicle, 
  client,
  onViewEDL,
  onDownloadPDF,
  onShareEDL
}: EDLHistoryViewProps) {
  const { colors } = useTheme();
  const [expandedEDL, setExpandedEDL] = useState<'depart' | 'retour' | null>(null);
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getEDLStatus = (type: 'depart' | 'retour') => {
    if (type === 'depart') {
      return reservation.edlDepart ? 'completed' : 'pending';
    } else {
      return reservation.edlRetour ? 'completed' : 'not_required';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'not_required': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'pending': return 'En attente';
      case 'not_required': return 'Non requis';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={colors.success} />;
      case 'pending': return <AlertCircle size={16} color={colors.warning} />;
      case 'not_required': return <FileText size={16} color={colors.textSecondary} />;
      default: return <FileText size={16} color={colors.textSecondary} />;
    }
  };

  const renderEDLCard = (type: 'depart' | 'retour') => {
    const status = getEDLStatus(type);
    const edlData = type === 'depart' ? reservation.edlDepart : reservation.edlRetour;
    const isExpanded = expandedEDL === type;
    const isCompleted = status === 'completed';

    return (
      <View style={styles.edlCard}>
        <TouchableOpacity
          style={styles.edlHeader}
          onPress={() => setExpandedEDL(isExpanded ? null : type)}
          activeOpacity={0.7}
        >
          <View style={styles.edlHeaderLeft}>
            <View style={[
              styles.edlIcon,
              { backgroundColor: getStatusColor(status) + '20' }
            ]}>
              {type === 'depart' ? (
                <Camera size={20} color={getStatusColor(status)} />
              ) : (
                <Video size={20} color={getStatusColor(status)} />
              )}
            </View>
            
            <View style={styles.edlInfo}>
              <Text style={styles.edlTitle}>
                État des lieux de {type === 'depart' ? 'départ' : 'retour'}
              </Text>
              <Text style={styles.edlSubtitle}>
                {type === 'depart' ? 'Documentation initiale' : 'Finalisation de la location'}
              </Text>
            </View>
          </View>
          
          <View style={styles.edlHeaderRight}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) + '20' }
            ]}>
              {getStatusIcon(status)}
              <Text style={[
                styles.statusText,
                { color: getStatusColor(status) }
              ]}>
                {getStatusText(status)}
              </Text>
            </View>
            
            <Animated.View style={{
              transform: [{
                rotate: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '90deg']
                })
              }]
            }}>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View 
            style={[
              styles.edlDetails,
              {
                opacity: fadeAnimation,
                transform: [{
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }
            ]}
          >
            {isCompleted && edlData ? (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Informations</Text>
                  
                  <View style={styles.detailRow}>
                    <Calendar size={14} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(edlData.dateHeure).date}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.detailLabel}>Heure:</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(edlData.dateHeure).time}
                    </Text>
                  </View>
                  
                  {type === 'depart' && 'carburant' in edlData && (
                    <View style={styles.detailRow}>
                      <Fuel size={14} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Carburant:</Text>
                      <Text style={styles.detailValue}>
                        {typeof edlData.carburant === 'number' ? edlData.carburant : '-'} /8
                      </Text>
                    </View>
                  )}
                  
                  {type === 'retour' && 'kmRetour' in edlData && (
                    <View style={styles.detailRow}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Km retour:</Text>
                      <Text style={styles.detailValue}>
                        {typeof edlData.kmRetour === 'number' ? edlData.kmRetour.toLocaleString() + ' km' : '-'}
                      </Text>
                    </View>
                  )}
                  
                  {type === 'retour' && 'carburantRetour' in edlData && (
                    <View style={styles.detailRow}>
                      <Fuel size={14} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Carburant retour:</Text>
                      <Text style={styles.detailValue}>
                        {typeof edlData.carburantRetour === 'number' ? edlData.carburantRetour : '-'} /8
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onViewEDL?.(type)}
                  >
                    <Eye size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Voir</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDownloadPDF?.(type)}
                  >
                    <Download size={16} color={colors.accent} />
                    <Text style={styles.actionButtonText}>PDF</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onShareEDL?.(type)}
                  >
                    <Share size={16} color={colors.success} />
                    <Text style={styles.actionButtonText}>Partager</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.pendingSection}>
                <Text style={styles.pendingText}>
                  {type === 'depart' 
                    ? 'L\'état des lieux de départ n\'a pas encore été effectué.'
                    : 'L\'état des lieux de retour sera disponible une fois la location terminée.'
                  }
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.summaryTitle}>Résumé des états des lieux</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={[
            styles.summaryIcon,
            { backgroundColor: getStatusColor(getEDLStatus('depart')) + '20' }
          ]}>
            <Camera size={20} color={getStatusColor(getEDLStatus('depart'))} />
          </View>
          <Text style={styles.summaryLabel}>Départ</Text>
          <Text style={[
            styles.summaryStatus,
            { color: getStatusColor(getEDLStatus('depart')) }
          ]}>
            {getStatusText(getEDLStatus('depart'))}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <View style={[
            styles.summaryIcon,
            { backgroundColor: getStatusColor(getEDLStatus('retour')) + '20' }
          ]}>
            <Video size={20} color={getStatusColor(getEDLStatus('retour'))} />
          </View>
          <Text style={styles.summaryLabel}>Retour</Text>
          <Text style={[
            styles.summaryStatus,
            { color: getStatusColor(getEDLStatus('retour')) }
          ]}>
            {getStatusText(getEDLStatus('retour'))}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderSummary()}
      
      <View style={styles.edlSection}>
        <Text style={styles.sectionTitle}>Historique détaillé</Text>
        {renderEDLCard('depart')}
        {renderEDLCard('retour')}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summarySection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  summaryStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  edlSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  edlCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  edlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  edlHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  edlIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  edlInfo: {
    flex: 1,
  },
  edlTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  edlSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  edlHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  edlDetails: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailSection: {
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 4,
  },
  pendingSection: {
    padding: 15,
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 