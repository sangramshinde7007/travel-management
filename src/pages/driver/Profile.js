import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getAllDrivers } from '../../services/driverService';
import { getAllVehicles } from '../../services/vehicleService';
import { formatDate, getStatusColor, formatPhone } from '../../utils/formatters';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  const loadProfileData = React.useCallback(async () => {
    try {
      // 1. Get Driver Record
      const allDrivers = await getAllDrivers();
      const driverRecord = allDrivers.find(d => d.userId === user.uid);
      
      if (driverRecord) {
        setCurrentDriver(driverRecord);
        
        // 2. Get Assigned Vehicle
        if (driverRecord.assignedVehicle) {
          const allVehicles = await getAllVehicles();
          const vehicle = allVehicles.find(v => v.id === driverRecord.assignedVehicle);
          setAssignedVehicle(vehicle);
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Driver Profile Card */}
          <div className="card h-full">
             <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(currentDriver?.status || 'Available')}`}>
                  {currentDriver?.status || 'Available'}
                </span>
             </div>
             {currentDriver ? (
               <div className="space-y-6">
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Name</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{currentDriver.name}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Phone Number</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{formatPhone(currentDriver.phone)}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Email Address</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{user?.email}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">License Number</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{currentDriver.licenseNumber}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Joined Date</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{formatDate(currentDriver.createdAt)}</p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
                 Profile data not found. Please contact an administrator.
               </div>
             )}
          </div>

          {/* Assigned Vehicle Card */}
          <div className="card h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">Assigned Vehicle</h3>
            {assignedVehicle ? (
               <div className="space-y-6">
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Vehicle Name</label>
                   <p className="text-lg font-bold text-primary-700 mt-1">{assignedVehicle.vehicleName}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Number Plate</label>
                   <p className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-lg font-bold text-gray-900 mt-1 inline-block border border-gray-300">
                     {assignedVehicle.vehicleNumber}
                   </p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Type</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{assignedVehicle.type}</p>
                 </div>
                 <div>
                   <label className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Current Status</label>
                   <div className="mt-1">
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(assignedVehicle.status)}`}>
                        {assignedVehicle.status}
                     </span>
                   </div>
                 </div>
                 
                 <div className="pt-6 mt-4 border-t">
                    <p className="text-sm text-gray-500 italic">
                      To change vehicle assignment, please contact the administrator.
                    </p>
                 </div>
               </div>
            ) : (
              <div className="bg-yellow-50 text-yellow-800 p-8 rounded-lg text-center border-2 border-yellow-100 border-dashed">
                <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="font-medium">No vehicle currently assigned.</p>
                <p className="text-sm mt-1">Please ask an admin to assign a vehicle to you.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
