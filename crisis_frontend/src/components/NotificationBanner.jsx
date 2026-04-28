import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import notificationService from '../services/notificationService';
import { Bell, Check, AlertCircle, X } from 'lucide-react';

const NotificationBanner = () => {
  const { permissionGranted, notificationEnabled } = useContext(NotificationContext);
  const [showBanner, setShowBanner] = React.useState(!permissionGranted);

  const handleRequestPermission = async () => {
    const permission = await notificationService.requestPermission();
    if (permission === 'granted') {
      setShowBanner(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="notification-banner">
      <div className="notification-banner-content">
        <Bell size={16} color="#3b82f6" />
        <span>
          Enable notifications to get alerts for new incidents.{' '}
          <strong>Recommended for emergency response.</strong>
        </span>
      </div>
      <div className="notification-banner-actions">
        <button className="btn btn-primary btn-small" onClick={handleRequestPermission}>
          Enable
        </button>
        <button className="modal-close" onClick={() => setShowBanner(false)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

const NotificationStatus = () => {
  const { notificationEnabled, lastCheckTime } = useContext(NotificationContext);

  if (!notificationEnabled) {
    return null;
  }

  return (
    <div className="notification-status">
      <Check size={14} />
      <span>Live notifications enabled</span>
      {lastCheckTime && (
        <span>Last check: {lastCheckTime.toLocaleTimeString()}</span>
      )}
    </div>
  );
};

export { NotificationBanner, NotificationStatus };
