/**
 * NotificationService - Windows-friendly browser notification system
 * Uses the Notification API with graceful degradation for all Windows browsers
 */

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.isVibrationSupported = 'vibrate' in navigator;
    this.notificationQueue = [];
    this.displayedNotifications = new Set();
  }

  // Request notification permission from user
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return 'denied';
    }

    // If already granted, return granted
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    // If user previously denied, don't request again
    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission from user
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  // Get current permission status
  getPermissionStatus() {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.isSupported && Notification.permission === 'granted';
  }

  // Play a short buzzer sound using Web Audio API
  playBuzzerSound() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.warn('Buzzer sound not supported:', err);
    }
  }

  // Show a notification - Windows-compatible
  showNotification(title, options = {}) {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled. Permission status:', this.getPermissionStatus());
      return null;
    }

    // Prevent duplicate notifications for the same incident within 2 seconds
    const notificationKey = `${title}-${JSON.stringify(options)}`;
    if (this.displayedNotifications.has(notificationKey)) {
      return null;
    }

    try {
      // Default options with Windows-friendly settings
      const defaultOptions = {
        icon: '/incident-icon.svg', // Fallback icon
        badge: '/notification-badge.svg',
        tag: `incident-${Date.now()}`, // Tag for notification grouping
        requireInteraction: false, // Allow auto-close
        silent: false, // Play sound
        timestamp: Date.now(),
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Create notification
      const notification = new Notification(title, finalOptions);

      // Vibrate on Windows devices that support it
      if (this.isVibrationSupported && options.vibrate !== false) {
        try {
          navigator.vibrate([200, 100, 200]); // Pattern: 200ms vibrate, 100ms pause, 200ms vibrate
        } catch (_) {
          // Vibration not available, fallback silently
        }
      }

      // Add to displayed set
      this.displayedNotifications.add(notificationKey);
      setTimeout(() => {
        this.displayedNotifications.delete(notificationKey);
      }, 2000);

      // Auto-close notification after 8 seconds if user doesn't interact
      const autoCloseTimer = setTimeout(() => {
        notification.close();
      }, 8000);

      // Handle user click on notification
      notification.onclick = () => {
        clearTimeout(autoCloseTimer);
        if (finalOptions.onClick) {
          finalOptions.onClick();
        }
        // Focus the window when notification is clicked
        window.focus();
        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        clearTimeout(autoCloseTimer);
      };

      return notification;
    } catch (err) {
      console.error('Error showing notification:', err);
      return null;
    }
  }

  // Notify about new incident
  notifyNewIncident(incident) {
    const title = `New Incident: ${incident.title}`;
    const options = {
      body: `Priority: ${incident.priority.toUpperCase()} | Location: ${incident.location}`,
      icon: '/incident-alert-icon.svg',
      tag: `incident-${incident.id}`,
      requireInteraction: incident.priority === 'high', // Keep high priority visible longer
      data: {
        incidentId: incident.id,
        url: `/incidents/${incident.id}`,
      },
      onClick: () => {
        // Navigation will be handled by the context
      },
    };

    return this.showNotification(title, options);
  }

  // Notify about incident update
  notifyIncidentUpdate(incident, message) {
    const title = `Update: ${incident.title}`;
    const options = {
      body: message.substring(0, 100), // Limit to 100 chars
      icon: '/update-icon.svg',
      tag: `update-${incident.id}-${Date.now()}`,
      data: {
        incidentId: incident.id,
      },
    };

    return this.showNotification(title, options);
  }

  // Notify about incident assignment
  notifyIncidentAssignment(incident, assignedUser) {
    const title = `You've been assigned to: ${incident.title}`;
    const options = {
      body: `Location: ${incident.location} | Priority: ${incident.priority}`,
      icon: '/assigned-icon.svg',
      tag: `assigned-${incident.id}`,
      requireInteraction: true, // Keep visible until user interacts
      data: {
        incidentId: incident.id,
      },
    };

    return this.showNotification(title, options);
  }

  // Notify about a contact request created by admin
  notifyContactRequest(contactRequest) {
    const title = `Contact Request: ${contactRequest.incident.title}`;
    const body = contactRequest.message
      ? contactRequest.message.substring(0, 120)
      : `Admin has requested your attention for ${contactRequest.incident.title}.`;

    const options = {
      body,
      icon: '/contact-request-icon.svg',
      tag: `contact-request-${contactRequest.id}`,
      requireInteraction: true,
      data: {
        incidentId: contactRequest.incident.id,
      },
    };

    return this.showNotification(title, options);
  }

  // Notify about an emergency alert from a guest
  notifyEmergencyAlert(alert) {
    const title = `Emergency Alert from ${alert.sender.username}`;
    const body = alert.guest_details
      ? alert.guest_details.substring(0, 120)
      : alert.message || 'A guest has triggered an emergency alert.';

    const options = {
      body,
      icon: '/emergency-alert-icon.svg',
      tag: `emergency-alert-${alert.id}`,
      requireInteraction: true,
      data: {
        alertId: alert.id,
      },
    };

    this.playBuzzerSound();
    return this.showNotification(title, options);
  }

  // Generic notification (for other events)
  notifyEvent(title, body = '', options = {}) {
    const finalOptions = {
      body,
      ...options,
    };

    return this.showNotification(title, finalOptions);
  }

  // Clear all notifications
  clearAll() {
    // Note: Notification API doesn't provide a way to close all notifications
    // This is a placeholder for future enhancement
    this.displayedNotifications.clear();
  }
}

// Export singleton instance
export default new NotificationService();
