import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getTripsByDriver } from '../../services/tripService';
import { getAllDrivers } from '../../services/driverService';
import { formatDate, getStatusColor } from '../../utils/formatters';

const DriverDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nextTrip, setNextTrip] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);

  const loadDashboardSummary = React.useCallback(async () => {
    try {
      // 1. Get Driver Record
      const allDrivers = await getAllDrivers();
      const driverRecord = allDrivers.find(d => d.userId === user.uid);
      
      if (driverRecord) {
        setCurrentDriver(driverRecord);

        // 2. Get Next Upcoming/Running Trip
        const tripsData = await getTripsByDriver(driverRecord.id);
        const activeTrip = tripsData
          .sort((a, b) => new Date(a.tripStartDate) - new Date(b.tripStartDate))
          .find(t => t.status === 'Running' || t.status === 'Upcoming');
        
        setNextTrip(activeTrip);

        // 3. Check Attendance
        const today = new Date().toISOString().split('T')[0];
        const marked = localStorage.getItem(`attendance_${user.uid}_${today}`);
        setAttendanceMarked(!!marked);
      }
    } catch (error) {
      console.error('Error loading dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardSummary();
  }, [loadDashboardSummary]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {currentDriver?.name || user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats / Actions */}
          
          {/* Attendance Status Card */}
          <Link to="/driver/attendance" className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Attendance</h3>
            {attendanceMarked ? (
              <div className="text-green-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marked Present
              </div>
            ) : (
              <div className="text-amber-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Not Marked Yet
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">Click to manage attendance &rarr;</p>
          </Link>

          {/* Active Trip Card */}
          <Link to="/driver/trips" className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Activity</h3>
            {nextTrip ? (
              <div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(nextTrip.status)} mb-2 inline-block`}>
                  {nextTrip.status}
                </span>
                <p className="font-medium text-gray-900 truncate">{nextTrip.route}</p>
                <p className="text-sm text-gray-500">{formatDate(nextTrip.tripStartDate)}</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p>No active trips.</p>
                <p className="text-sm mt-1">Check back later.</p>
              </div>
            )}
            <p className="text-sm text-blue-600 mt-2">View all trips &rarr;</p>
          </Link>

          {/* Profile Quick Link */}
          <Link to="/driver/profile" className="card hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500">
             <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                 {currentDriver?.name?.charAt(0).toUpperCase()}
               </div>
               <div>
                 <p className="font-medium text-gray-900">{currentDriver?.name}</p>
                 <p className="text-xs text-gray-500">{currentDriver?.status || 'Status Unknown'}</p>
               </div>
             </div>
             <p className="text-sm text-purple-600 mt-2">View details & vehicle &rarr;</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
