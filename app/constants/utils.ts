import { DisasterType } from "@/config/dbutils";

export const DISASTER_TYPES: DisasterType[] = [
  "FLOOD",
  "EARTHQUAKE",
  "FIRE",
  "ACCIDENT",
  "LANDSLIDE",
  "OTHER",
];
export const getDisasterIcon = (type: DisasterType) => {
  switch (type) {
    case "FLOOD":
      return "tint";
    case "EARTHQUAKE":
      return "bolt";
    case "FIRE":
      return "fire";
    case "ACCIDENT":
      return "car";
    case "LANDSLIDE":
      return "exclamation";
    default:
      return "question-circle";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "#FF9800";
    case "VERIFIED":
      return "#4CAF50";
    case "RESOLVED":
      return "#2196F3";
    case "FALSE_ALARM":
      return "#F44336";
    default:
      return "#9E9E9E";
  }
};

export const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case "Low":
      return "#4CAF50";
    case "Medium":
      return "#FF9800";
    case "High":
      return "#F44336";
    case "Critical":
      return "#8B0000";
    default:
      return "#9E9E9E";
  }
};

export const getDisasterMarkerColor = (type: DisasterType) => {
  switch (type) {
    case "FLOOD":
      return "#2196F3";
    case "EARTHQUAKE":
      return "#FF9800";
    case "FIRE":
      return "#F44336";
    case "ACCIDENT":
      return "#E91E63";
    case "LANDSLIDE":
      return "#795548";
    default:
      return "#9E9E9E";
  }
};

export const formatDate = (date: any) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// {"nanoseconds": 23000000, "seconds": 1778312154, "type": "firestore/timestamp/1.0"}
// Convert the above timestamp into a readable date
export const formatFirebaseTimestamp = (date: any) => {
  return new Date(
    date.seconds * 1000 + date.nanoseconds / 1e6,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate distance between two points in KM using Haversine formula
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
