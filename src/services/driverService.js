// Driver Service - CRUD operations for drivers
import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

const DRIVERS_PATH = PATHS.DRIVERS;
const ATTENDANCE_PATH = PATHS.ATTENDANCE;

/**
 * Get all drivers
 * @returns {Promise<Array>} Array of drivers
 */
export const getAllDrivers = async () => {
  try {
    const driversRef = ref(database, DRIVERS_PATH);
    const snapshot = await get(driversRef);
    
    if (snapshot.exists()) {
      const driversData = snapshot.val();
      return Object.keys(driversData).map(key => ({
        id: key,
        ...driversData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

/**
 * Get driver by ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Object>} Driver data
 */
export const getDriverById = async (driverId) => {
  try {
    const driverRef = ref(database, `${DRIVERS_PATH}/${driverId}`);
    const snapshot = await get(driverRef);
    
    if (snapshot.exists()) {
      return {
        id: driverId,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching driver:', error);
    throw error;
  }
};

/**
 * Add new driver
 * @param {Object} driverData - Driver data
 * @returns {Promise<string>} Created driver ID
 */
export const addDriver = async (driverData) => {
  try {
    const driversRef = ref(database, DRIVERS_PATH);
    const newDriverRef = push(driversRef);
    
    const driver = {
      ...driverData,
      assignedVehicle: driverData.assignedVehicle || null,
      status: 'Available', // Default status
      createdAt: Date.now()
    };
    
    await set(newDriverRef, driver);
    return newDriverRef.key;
  } catch (error) {
    console.error('Error adding driver:', error);
    throw error;
  }
};

/**
 * Update driver
 * @param {string} driverId - Driver ID
 * @param {Object} driverData - Updated driver data
 * @returns {Promise<void>}
 */
export const updateDriver = async (driverId, driverData) => {
  try {
    const driverRef = ref(database, `${DRIVERS_PATH}/${driverId}`);
    await update(driverRef, {
      ...driverData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
};

/**
 * Update driver status
 * @param {string} driverId - Driver ID
 * @param {string} status - New status (Available/On Trip)
 * @returns {Promise<void>}
 */
export const updateDriverStatus = async (driverId, status) => {
  try {
    const driverRef = ref(database, `${DRIVERS_PATH}/${driverId}`);
    await update(driverRef, { status });
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw error;
  }
};

/**
 * Delete driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<void>}
 */
export const deleteDriver = async (driverId) => {
  try {
    const driverRef = ref(database, `${DRIVERS_PATH}/${driverId}`);
    await remove(driverRef);
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
};

/**
 * Mark driver attendance
 * @param {string} driverId - Driver ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} status - Attendance status (Present/Absent/Leave)
 * @param {string} notes - Optional notes
 * @returns {Promise<void>}
 */
export const markAttendance = async (driverId, date, status, notes = '') => {
  try {
    const attendanceRef = ref(database, `${ATTENDANCE_PATH}/${driverId}/${date}`);
    await set(attendanceRef, {
      status,
      notes,
      markedAt: Date.now()
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

/**
 * Get driver attendance for a specific month
 * @param {string} driverId - Driver ID
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Object>} Attendance data
 */
export const getDriverAttendance = async (driverId, month) => {
  try {
    const attendanceRef = ref(database, `${ATTENDANCE_PATH}/${driverId}`);
    const snapshot = await get(attendanceRef);
    
    if (snapshot.exists()) {
      const allAttendance = snapshot.val();
      // Filter by month
      const monthAttendance = {};
      Object.keys(allAttendance).forEach(date => {
        if (date.startsWith(month)) {
          monthAttendance[date] = allAttendance[date];
        }
      });
      return monthAttendance;
    }
    return {};
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

/**
 * Subscribe to drivers real-time updates
 * @param {Function} callback - Callback function with drivers array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDrivers = (callback) => {
  const driversRef = ref(database, DRIVERS_PATH);
  
  const unsubscribe = onValue(driversRef, (snapshot) => {
    if (snapshot.exists()) {
      const driversData = snapshot.val();
      const drivers = Object.keys(driversData).map(key => ({
        id: key,
        ...driversData[key]
      }));
      callback(drivers);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};
