// Trip Service - CRUD operations for trips and customers
import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

const TRIPS_PATH = PATHS.TRIPS;
const CUSTOMERS_PATH = PATHS.CUSTOMERS;

/**
 * Get all trips
 * @returns {Promise<Array>} Array of trips
 */
export const getAllTrips = async () => {
  try {
    const tripsRef = ref(database, TRIPS_PATH);
    const snapshot = await get(tripsRef);
    
    if (snapshot.exists()) {
      const tripsData = snapshot.val();
      return Object.keys(tripsData).map(key => ({
        id: key,
        ...tripsData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

/**
 * Get trips by driver ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<Array>} Array of trips assigned to driver
 */
export const getTripsByDriver = async (driverId) => {
  try {
    const tripsRef = ref(database, TRIPS_PATH);
    const snapshot = await get(tripsRef);
    
    if (snapshot.exists()) {
      const tripsData = snapshot.val();
      const driverTrips = Object.keys(tripsData)
        .filter(key => tripsData[key].driverId === driverId)
        .map(key => ({
          id: key,
          ...tripsData[key]
        }));
      return driverTrips;
    }
    return [];
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    throw error;
  }
};

/**
 * Get trip by ID
 * @param {string} tripId - Trip ID
 * @returns {Promise<Object>} Trip data
 */
export const getTripById = async (tripId) => {
  try {
    const tripRef = ref(database, `${TRIPS_PATH}/${tripId}`);
    const snapshot = await get(tripRef);
    
    if (snapshot.exists()) {
      return {
        id: tripId,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
};

/**
 * Add new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<string>} Created customer ID
 */
export const addCustomer = async (customerData) => {
  try {
    const customersRef = ref(database, CUSTOMERS_PATH);
    const newCustomerRef = push(customersRef);
    
    await set(newCustomerRef, {
      ...customerData,
      createdAt: Date.now()
    });
    
    return newCustomerRef.key;
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

/**
 * Get all customers
 * @returns {Promise<Array>} Array of customers
 */
export const getAllCustomers = async () => {
  try {
    const customersRef = ref(database, CUSTOMERS_PATH);
    const snapshot = await get(customersRef);
    
    if (snapshot.exists()) {
      const customersData = snapshot.val();
      return Object.keys(customersData).map(key => ({
        id: key,
        ...customersData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

/**
 * Create new trip
 * @param {Object} tripData - Trip data including customer, vehicle, driver info
 * @returns {Promise<string>} Created trip ID
 */
export const createTrip = async (tripData) => {
  try {
    const tripsRef = ref(database, TRIPS_PATH);
    const newTripRef = push(tripsRef);
    
    const trip = {
      ...tripData,
      status: tripData.status || 'Upcoming',
      createdAt: Date.now()
    };
    
    await set(newTripRef, trip);
    return newTripRef.key;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * Update trip
 * @param {string} tripId - Trip ID
 * @param {Object} tripData - Updated trip data
 * @returns {Promise<void>}
 */
export const updateTrip = async (tripId, tripData) => {
  try {
    const tripRef = ref(database, `${TRIPS_PATH}/${tripId}`);
    await update(tripRef, {
      ...tripData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

/**
 * Update trip status
 * @param {string} tripId - Trip ID
 * @param {string} status - New status (Upcoming/Running/Completed)
 * @returns {Promise<void>}
 */
export const updateTripStatus = async (tripId, status) => {
  try {
    const tripRef = ref(database, `${TRIPS_PATH}/${tripId}`);
    await update(tripRef, { 
      status,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    throw error;
  }
};

/**
 * Delete trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<void>}
 */
export const deleteTrip = async (tripId) => {
  try {
    const tripRef = ref(database, `${TRIPS_PATH}/${tripId}`);
    await remove(tripRef);
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

/**
 * Subscribe to trips real-time updates
 * @param {Function} callback - Callback function with trips array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToTrips = (callback) => {
  const tripsRef = ref(database, TRIPS_PATH);
  
  const unsubscribe = onValue(tripsRef, (snapshot) => {
    if (snapshot.exists()) {
      const tripsData = snapshot.val();
      const trips = Object.keys(tripsData).map(key => ({
        id: key,
        ...tripsData[key]
      }));
      callback(trips);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};
