import { Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

class AlertService {
  private static instance: AlertService;
  private alertsEnabled: boolean = false;
  private vibrationEnabled: boolean = false;

  private constructor() {
    this.loadSettings();
    this.setupNotifications();
  }

  private async setupNotifications() {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private async loadSettings() {
    try {
      const alerts = await AsyncStorage.getItem('alertsEnabled');
      const vibration = await AsyncStorage.getItem('vibrationEnabled');
      
      this.alertsEnabled = alerts === 'true';
      this.vibrationEnabled = vibration === 'true';
      console.log('Loaded settings:', { alertsEnabled: this.alertsEnabled, vibrationEnabled: this.vibrationEnabled });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  public async setAlertsEnabled(enabled: boolean) {
    this.alertsEnabled = enabled;
    try {
      await AsyncStorage.setItem('alertsEnabled', enabled.toString());
      console.log('Alerts enabled set to:', enabled);
    } catch (error) {
      console.error('Error saving alerts setting:', error);
    }
  }

  public async setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    try {
      await AsyncStorage.setItem('vibrationEnabled', enabled.toString());
      console.log('Vibration enabled set to:', enabled);
    } catch (error) {
      console.error('Error saving vibration setting:', error);
    }
  }

  public isAlertsEnabled(): boolean {
    return this.alertsEnabled;
  }

  public isVibrationEnabled(): boolean {
    return this.vibrationEnabled;
  }

  public async triggerAlert(level: string, gasType: string, value: number) {
    console.log('Triggering alert:', { level, gasType, value, alertsEnabled: this.alertsEnabled, vibrationEnabled: this.vibrationEnabled });
    
    if (!this.alertsEnabled) {
      console.log('Alerts are disabled, not triggering notification');
      return;
    }

    // Trigger vibration if enabled
    if (this.vibrationEnabled) {
      console.log('Attempting to trigger vibration');
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 500, 500]);
        console.log('Android vibration triggered');
      } else {
        Vibration.vibrate(500);
        console.log('iOS vibration triggered');
      }
    }

    // Send notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Gas Alert: ${gasType}`,
          body: `${gasType} level is ${level} (${value} ppm)`,
          data: { gasType, level, value },
        },
        trigger: null, // Send immediately
      });
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export default AlertService.getInstance(); 