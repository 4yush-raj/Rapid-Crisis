import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../services/api';
import notificationService from '../services/notificationService';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [seenIncidents, setSeenIncidents] = useState(new Set());
  const [seenContactRequests, setSeenContactRequests] = useState(new Set());
  const [seenEmergencyAlerts, setSeenEmergencyAlerts] = useState(new Set());

  // Request notification permission on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      const permission = await notificationService.requestPermission();
      setPermissionGranted(permission === 'granted');
      setNotificationEnabled(notificationService.isEnabled());
    };

    initializeNotifications();
  }, []);

  // Poll for new incidents every 10 seconds (Windows-optimized interval)
  const checkForNewIncidents = useCallback(async () => {
    if (!notificationEnabled) return;

    try {
      // Get incidents from the last 5 minutes
      const response = await api.get('incidents/recent/?minutes=5');
      const recentIncidents = response.data.incidents || [];

      // Check for incidents we haven't notified about yet
      recentIncidents.forEach((incident) => {
        if (!seenIncidents.has(incident.id)) {
          setSeenIncidents((prev) => new Set([...prev, incident.id]));
          notificationService.notifyNewIncident(incident);
          console.log(`New incident notification shown for: ${incident.title}`);
        }
      });

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Error checking for new incidents:', error);
      // Fail silently - don't notify user of polling errors
    }
  }, [notificationEnabled, seenIncidents]);

  const checkForNewContactRequests = useCallback(async () => {
    if (!notificationEnabled || !user || user.role !== 'staff') return;

    try {
      const response = await api.get('contact_requests/');
      const requests = response.data || [];

      requests.forEach(async (request) => {
        if (!seenContactRequests.has(request.id)) {
          setSeenContactRequests((prev) => new Set([...prev, request.id]));
          notificationService.notifyContactRequest(request);

          // Mark request as read after notifying so staff don't get duplicate popups
          await api.post(`contact_requests/${request.id}/mark_read/`);
        }
      });
    } catch (error) {
      console.error('Error checking for contact requests:', error);
    }
  }, [notificationEnabled, user, seenContactRequests]);

  // Set up polling interval (10 seconds on Windows for optimal performance)
  useEffect(() => {
    if (!notificationEnabled) return;

    const initialTimer = setTimeout(checkForNewIncidents, 2000);
    const pollingInterval = setInterval(checkForNewIncidents, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollingInterval);
    };
  }, [checkForNewIncidents, notificationEnabled]);

  useEffect(() => {
    if (!notificationEnabled) return;

    const initialTimer = setTimeout(checkForNewContactRequests, 2000);
    const pollingInterval = setInterval(checkForNewContactRequests, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollingInterval);
    };
  }, [checkForNewContactRequests, notificationEnabled]);

  const checkForNewEmergencyAlerts = useCallback(async () => {
    if (!notificationEnabled || !user || !['admin', 'staff'].includes(user.role)) return;

    try {
      const response = await api.get('emergency_alerts/');
      const alerts = response.data || [];

      alerts.forEach((alert) => {
        if (!seenEmergencyAlerts.has(alert.id)) {
          setSeenEmergencyAlerts((prev) => new Set([...prev, alert.id]));
          notificationService.notifyEmergencyAlert(alert);
        }
      });
    } catch (error) {
      console.error('Error checking for emergency alerts:', error);
    }
  }, [notificationEnabled, user, seenEmergencyAlerts]);

  useEffect(() => {
    if (!notificationEnabled) return;

    const initialTimer = setTimeout(checkForNewEmergencyAlerts, 2000);
    const pollingInterval = setInterval(checkForNewEmergencyAlerts, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollingInterval);
    };
  }, [checkForNewEmergencyAlerts, notificationEnabled]);

  // Function to manually trigger incident notification (for when user creates incident)
  const notifyNewIncidentCreated = useCallback((incident) => {
    if (!notificationEnabled) return;
    setSeenIncidents((prev) => new Set([...prev, incident.id]));
    notificationService.notifyNewIncident(incident);
  }, [notificationEnabled]);

  // Function to notify about assignment
  const notifyAssignment = useCallback((incident, assignedUser) => {
    if (!notificationEnabled) return;
    notificationService.notifyIncidentAssignment(incident, assignedUser);
  }, [notificationEnabled]);

  // Function to notify about updates
  const notifyUpdate = useCallback((incident, message) => {
    if (!notificationEnabled) return;
    notificationService.notifyIncidentUpdate(incident, message);
  }, [notificationEnabled]);

  return (
    <NotificationContext.Provider
      value={{
        permissionGranted,
        notificationEnabled,
        lastCheckTime,
        notifyNewIncidentCreated,
        notifyAssignment,
        notifyUpdate,
        checkForNewIncidents,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
