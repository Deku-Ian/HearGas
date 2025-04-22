import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { colors, radius, spacingx, spacingy } from '@/constants/theme';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { scale, verticalScale } from '@/utils/styling';

type GasType = 'CO' | 'CH4' | 'LPG' | 'NH3';
type AlertLevel = 'Low' | 'Medium' | 'High';

interface Detection {
  id: string;
  timestamp: string;
  gas: GasType;
  level: AlertLevel;
  deviceId: string;
}

const gasThumbnails: Record<GasType, any> = {
  CO: require('@/assets/images/CO.png'),
  CH4: require('@/assets/images/CH4.png'),
  LPG: require('@/assets/images/LPG.png'),
  NH3: require('@/assets/images/NH3.png'),
};

const Dashboard = () => {
  const [history, setHistory] = useState<Detection[]>([]);
  const [currentGas, setCurrentGas] = useState<Detection | null>(null);

  // Simulate gas detection every 1 minute
  useEffect(() => {
    const simulateDetection = () => {
      const gases: GasType[] = ['CO', 'CH4', 'LPG', 'NH3'];
      const levels: AlertLevel[] = ['Low', 'Medium', 'High'];
      const gas = gases[Math.floor(Math.random() * gases.length)];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const detection: Detection = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleString(),
        gas,
        level,
        deviceId: 'MASK-001',
      };
      setCurrentGas(detection);
      setHistory(prev => {
        const updated = [detection, ...prev];
        return updated.slice(0, 25); // keep only latest 25
      });
    };

    const interval = setInterval(simulateDetection, 6000); // 6 seconds for demo
    return () => clearInterval(interval);
  }, []);

  const renderAlertColor = (level: AlertLevel) => {
    switch (level) {
      case 'High': return styles.highAlert;
      case 'Medium': return styles.mediumAlert;
      case 'Low': return styles.lowAlert;
    }
  };

  const renderItem = ({ item }: { item: Detection }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.time}>{item.timestamp}</Text>
          <Text style={styles.deviceId}>Device: {item.deviceId}</Text>
          <Text style={styles.gases}>Gas Detected: {item.gas}</Text>
          <Text style={[styles.alertContainer, renderAlertColor(item.level)]}>
            Alert Level: {item.level}
          </Text>
        </View>
        <Image source={gasThumbnails[item.gas]} style={styles.thumbnail} resizeMode="contain" />
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo style={styles.historyTitle}>Gas Detector</Typo>
        {currentGas ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.time}>{currentGas.timestamp}</Text>
                <Text style={styles.deviceId}>Device: {currentGas.deviceId}</Text>
                <Text style={styles.gases}>Gas Detected: {currentGas.gas}</Text>
                <Text style={[styles.alertContainer, renderAlertColor(currentGas.level)]}>
                  Alert Level: {currentGas.level}
                </Text>
              </View>
              <Image
                source={gasThumbnails[currentGas.gas]}
                style={styles.thumbnail}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Waiting for data from mask...</Text>
        )}

        <Typo style={styles.historyTitle}>History</Typo>
        {history.length > 0 ? (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Text style={styles.emptyText}>No gas detections yet.</Text>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._5,
    gap: spacingy._10,
    flex: 1,
  },
  historyTitle: {
    fontSize: verticalScale(18),
    fontWeight: 'bold',
    marginTop: spacingy._10,
    marginBottom: spacingy._10,
  },
  card: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: verticalScale(14),
    fontWeight: 'bold',
    marginBottom: spacingy._10,
  },
  deviceId: {
    fontSize: verticalScale(12),
    color: colors.neutral700,
    marginBottom: spacingy._10,
  },
  gases: {
    fontSize: verticalScale(13),
    marginBottom: spacingy._10,
  },
  alertContainer: {
    fontSize: verticalScale(13),
  },
  highAlert: {
    color: colors.rose,
    fontWeight: 'bold',
  },
  mediumAlert: {
    color: 'orange',
    fontWeight: 'bold',
  },
  lowAlert: {
    color: 'green',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: verticalScale(20),
    fontSize: verticalScale(14),
    color: colors.neutral700,
  },
  thumbnail: {
    width: verticalScale(60),
    height: verticalScale(60),
    marginLeft: spacingx._10,
  },
  list: {
    paddingBottom: spacingy._20,
  },
});
