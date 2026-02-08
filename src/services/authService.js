// Authentication Service
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { ref, set, get, push } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with role
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role from database
    const userRef = ref(database, `${PATHS.USERS}/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        uid: user.uid,
        email: user.email,
        ...userData
      };
    } else {
      throw new Error('User data not found in database');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register new user with role
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @param {string} role - User role (admin or driver)
 * @returns {Promise<Object>} Created user data
 */
export const registerUser = async (email, password, name, role) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save user data to database
    const userData = {
      name,
      email,
      role,
      createdAt: Date.now()
    };
    
    await set(ref(database, `${PATHS.USERS}/${user.uid}`), userData);
    
    return {
      uid: user.uid,
      ...userData
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user with role
 * @returns {Promise<Object|null>} User data or null
 */
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        try {
          const userRef = ref(database, `${PATHS.USERS}/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            resolve({
              uid: user.uid,
              email: user.email,
              ...snapshot.val()
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function with user data
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userRef = ref(database, `${PATHS.USERS}/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          callback({
            uid: user.uid,
            email: user.email,
            ...snapshot.val()
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * Initialize demo data (Admin and Driver)
 * @returns {Promise<void>}
 */
export const initializeDemoData = async () => {
  try {
    // 1. Create Admin User
    try {
      await registerUser('admin@gmail.com', 'Admin123', 'Demo Admin', 'admin');
      console.log('Demo Admin created');
    } catch (error) {
      if (error.code !== 'auth/email-already-in-use') {
        console.error('Error creating demo admin:', error);
      } else {
        console.log('Demo Admin already exists');
      }
    }

    // 2. Create Driver User
    let driverUser;
    
    // Try to create first
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, 'driver@gmail.com', 'Driver123');
      driverUser = userCredential.user;
      
      // Save user data for new user
      await set(ref(database, `${PATHS.USERS}/${driverUser.uid}`), {
        name: 'Demo Driver',
        email: 'driver@gmail.com',
        role: 'driver',
        createdAt: Date.now()
      });
      console.log('Demo Driver created');
    } catch (createError) {
      if (createError.code === 'auth/email-already-in-use') {
        // If driver exists, try to sign in to get UID
        try {
          const loginCredential = await signInWithEmailAndPassword(auth, 'driver@gmail.com', 'Driver123');
          driverUser = loginCredential.user;
          console.log('Demo Driver already exists, logged in to check profile');
        } catch (loginError) {
          console.error('Could not access existing demo driver account:', loginError);
          // Can't proceed
        }
      } else {
        console.error('Error creating demo driver:', createError);
      }
    }

    // 3. Create Driver Profile Record (if we have a user)
    if (driverUser) {
      const driversRef = ref(database, PATHS.DRIVERS);
      const snapshot = await get(driversRef);
      let driverExists = false;
      
      if (snapshot.exists()) {
        const drivers = snapshot.val();
        driverExists = Object.values(drivers).some(d => d.userId === driverUser.uid);
      }
      
      if (!driverExists) {
        const newDriverRef = push(driversRef);
        await set(newDriverRef, {
          name: 'Demo Driver',
          phone: '9876543210',
          licenseNumber: 'DL-DEMO-1234',
          status: 'Available',
          userId: driverUser.uid,
          createdAt: Date.now()
        });
        console.log('Demo Driver profile created');
      }
    }

  } catch (error) {
    console.error('Error initializing demo data:', error);
    throw error;
  }
};
