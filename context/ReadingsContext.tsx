import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { database } from "@/config/firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Reading {
  mq2_value: number;
  mq4_value: number;
  mq9_value: number;
  mq135_value: number;
  timestamp: number;
  alertLevel: string;
}

interface ReadingsContextType {
  currentReading: Reading | null;
  recentReadings: Reading[];
  updateReadings: (reading: Reading) => void;
  clearReadings: () => void;
}

const ReadingsContext = createContext<ReadingsContextType | undefined>(undefined);
const READINGS_KEY = 'readings_cache_v1';

export const ReadingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentReading, setCurrentReading] = useState<Reading | null>(null);
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(READINGS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setRecentReadings(parsed);
          if (parsed.length > 0) setCurrentReading(parsed[0]);
        }
      } catch (e) {
        console.warn('Failed to load readings from cache', e);
      }
    })();
  }, []);

  // Save to AsyncStorage on change
  useEffect(() => {
    AsyncStorage.setItem(READINGS_KEY, JSON.stringify(recentReadings));
  }, [recentReadings]);

  const updateReadings = (reading: Reading) => {
    setCurrentReading(reading);
    setRecentReadings((prev) => {
      const newReadings = [reading, ...prev];
      return newReadings.slice(0, 30); // Keep last 30 readings
    });
  };

  const clearReadings = () => {
    setCurrentReading(null);
    setRecentReadings([]);
    AsyncStorage.removeItem(READINGS_KEY);
  };

  return (
    <ReadingsContext.Provider
      value={{
        currentReading,
        recentReadings,
        updateReadings,
        clearReadings,
      }}
    >
      {children}
    </ReadingsContext.Provider>
  );
};

export const useReadings = () => {
  const context = useContext(ReadingsContext);
  if (context === undefined) {
    throw new Error('useReadings must be used within a ReadingsProvider');
  }
  return context;
}; 