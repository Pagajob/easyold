import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationBanner from './NotificationBanner';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationStack() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <View
          key={notification.id}
          style={[
            styles.notificationWrapper,
            {
              top: index * 80, // Décalage pour empiler les notifications
              zIndex: 1000 - index, // Z-index décroissant
            },
          ]}
        >
          <NotificationBanner
            visible={true}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
            onPress={notification.onPress}
            showCloseButton={notification.showCloseButton}
            autoHide={notification.autoHide}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notificationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
}); 