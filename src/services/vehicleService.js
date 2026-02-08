// Vehicle Service - CRUD operations for vehicles
import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

const VEHICLES_PATH = PATHS.VEHICLES;

/**
 * Get all vehicles
 * @returns {Promise<Array>} Array of vehicles
 */
export const getAllVehicles = async () => {
  try {
    const vehiclesRef = ref(database, VEHICLES_PATH);
    const snapshot = await get(vehiclesRef);
    
    if (snapshot.exists()) {
      const vehiclesData = snapshot.val();
      return Object.keys(vehiclesData).map(key => ({
        id: key,
        ...vehiclesData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

/**
 * Get vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Object>} Vehicle data
 */
export const getVehicleById = async (vehicleId) => {
  try {
    const vehicleRef = ref(database, `${VEHICLES_PATH}/${vehicleId}`);
    const snapshot = await get(vehicleRef);
    
    if (snapshot.exists()) {
      return {
        id: vehicleId,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
};

/**
 * Add new vehicle
 * @param {Object} vehicleData - Vehicle data
 * @returns {Promise<string>} Created vehicle ID
 */
export const addVehicle = async (vehicleData) => {
  try {
    const vehiclesRef = ref(database, VEHICLES_PATH);
    const newVehicleRef = push(vehiclesRef);
    
    const vehicle = {
      ...vehicleData,
      status: vehicleData.status || 'Available',
      createdAt: Date.now()
    };
    
    await set(newVehicleRef, vehicle);
    return newVehicleRef.key;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

/**
 * Update vehicle
 * @param {string} vehicleId - Vehicle ID
 * @param {Object} vehicleData - Updated vehicle data
 * @returns {Promise<void>}
 */
export const updateVehicle = async (vehicleId, vehicleData) => {
  try {
    const vehicleRef = ref(database, `${VEHICLES_PATH}/${vehicleId}`);
    await update(vehicleRef, {
      ...vehicleData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

/**
 * Delete vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<void>}
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    const vehicleRef = ref(database, `${VEHICLES_PATH}/${vehicleId}`);
    await remove(vehicleRef);
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

/**
 * Update vehicle status
 * @param {string} vehicleId - Vehicle ID
 * @param {string} status - New status (Available/On Trip)
 * @returns {Promise<void>}
 */
export const updateVehicleStatus = async (vehicleId, status) => {
  try {
    const vehicleRef = ref(database, `${VEHICLES_PATH}/${vehicleId}`);
    await update(vehicleRef, { status });
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    throw error;
  }
};

/**
 * Subscribe to vehicles real-time updates
 * @param {Function} callback - Callback function with vehicles array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToVehicles = (callback) => {
  const vehiclesRef = ref(database, VEHICLES_PATH);
  
  const unsubscribe = onValue(vehiclesRef, (snapshot) => {
    if (snapshot.exists()) {
      const vehiclesData = snapshot.val();
      const vehicles = Object.keys(vehiclesData).map(key => ({
        id: key,
        ...vehiclesData[key]
      }));
      callback(vehicles);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};
