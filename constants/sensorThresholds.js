// Threshold values for each sensor to determine gas presence
// These should be calibrated based on your actual sensor readings
export const SENSOR_THRESHOLDS = {
  mq2: {
    threshold: 400,
    gases: ["Smoke", "LPG", "Propane"],
  },
  mq4: {
    threshold: 350,
    gases: ["Methane", "Natural Gas"],
  },
  mq9: {
    threshold: 300,
    gases: ["Carbon Monoxide", "LPG"],
  },
  mq135: {
    threshold: 300,
    gases: ["Ammonia", "NOx", "Alcohol", "CO2"],
  },
};

// Determine alert levels based on sensor readings
export const getAlertLevel = (readings) => {
  if (!readings || Object.keys(readings).length === 0) {
    return "Low";
  }

  const maxValue = Math.max(...Object.values(readings));

  if (maxValue > 700) return "High";
  if (maxValue > 500) return "Medium";
  return "Low";
};

// Determine detected gases based on sensor readings and thresholds
export const detectGases = (readings) => {
  if (!readings) return [];

  const detectedGases = [];

  for (const [sensor, value] of Object.entries(readings)) {
    const sensorKey = sensor.replace("_value", "");

    if (
      SENSOR_THRESHOLDS[sensorKey] &&
      value >= SENSOR_THRESHOLDS[sensorKey].threshold
    ) {
      detectedGases.push(...SENSOR_THRESHOLDS[sensorKey].gases);
    }
  }

  // Remove duplicates
  return [...new Set(detectedGases)];
};
