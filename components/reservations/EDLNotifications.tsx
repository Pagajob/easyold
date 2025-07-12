import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions
} from 'react-native';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Camera,
  Video
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface EDLNotification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface EDLNotificationsProps {
  notifications: EDLNotification[];
  onDismiss?: (id: string) => void;
  onAction?: (notification: EDLNotification) => void;
}

export default function EDLNotifications({ 
  notifications, 
  onDismiss, 
  onAction 
}: EDLNotificationsProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState<EDLNotification[]>([]);
  
  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const heightAnimation = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  useEffect(() => {
    // Filtrer les notifications récentes (dernières 24h)
    const recentNotifications = notifications.filter(
      notif => new Date().getTime() - notif.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    setVisibleNotifications(recentNotifications.slice(0, 3)); // Limiter à 3 notifications
  }, [notifications]);

  useEffect(() => {
    // Animer l'ouverture/fermeture
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnimation, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} color={colors.warning} />;
      case 'success': return <CheckCircle size={16} color={colors.success} />;
      case 'info': return <Clock size={16} color={colors.info} />;
      case 'error': return <AlertTriangle size={16} color={colors.error} />;
      default: return <Bell size={16} color={colors.textSecondary} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return colors.warning;
      case 'success': return colors.success;
      case 'info': return colors.info;
      case 'error': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  const renderNotificationItem = (notification: EDLNotification) => (
    <Animated.View
      key={notification.id}
      style={[
        styles.notificationItem,
        {
          opacity: fadeAnimation,
          transform: [{
            translateX: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-screenWidth, 0]
            })
          }]
        }
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          {getNotificationIcon(notification.type)}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss?.(notification.id)}
        >
          <X size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {notification.action && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: getNotificationColor(notification.type) + '20' }
          ]}
          onPress={() => onAction?.(notification)}
        >
          <Text style={[
            styles.actionButtonText,
            { color: getNotificationColor(notification.type) }
          ]}>
            {notification.action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  if (visibleNotifications.length === 0) {
    return null;
  }

  const unreadCount = visibleNotifications.filter(n => n.type === 'warning' || n.type === 'error').length;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.bellContainer}>
            <Bell size={20} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Notifications EDL</Text>
            <Text style={styles.headerSubtitle}>
              {visibleNotifications.length} notification{visibleNotifications.length > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        <Animated.View style={{
          transform: [{
            rotate: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg']
            })
          }]
        }}>
          {expanded ? (
            <ChevronUp size={20} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View 
          style={[
            styles.notificationsList,
            {
              opacity: fadeAnimation,
              maxHeight: heightAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300]
              })
            }
          ]}
        >
          {visibleNotifications.map(renderNotificationItem)}
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bellContainer: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 