import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { markAttendance, getAllDrivers } from '../../services/driverService';

const Attendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);

  const loadDriverAndCheckAttendance = React.useCallback(async () => {
    try {
      const allDrivers = await getAllDrivers();
      const driverRecord = allDrivers.find(d => d.userId === user.uid);
      if (driverRecord) setCurrentDriver(driverRecord);

      const today = new Date().toISOString().split('T')[0];
      const marked = localStorage.getItem(`attendance_${user.uid}_${today}`);
      setAttendanceMarked(!!marked);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDriverAndCheckAttendance();
  }, [loadDriverAndCheckAttendance]);

  const handleMarkAttendance = async (status) => {
    try {
      if (currentDriver) {
        const today = new Date().toISOString().split('T')[0];
        await markAttendance(currentDriver.id, today, status);
        localStorage.setItem(`attendance_${user.uid}_${today}`, status);
        setAttendanceMarked(true);
        alert(`Attendance marked as ${status}`);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Daily Attendance</h1>

        <div className="card max-w-2xl mx-auto text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Mark Today's Attendance</h3>
          <p className="text-gray-500 mb-8">Please mark your attendance for today ({new Date().toLocaleDateString()}).</p>
          
          {attendanceMarked ? (
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-lg font-medium">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Attendance Marked Successfully
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleMarkAttendance('Present')} 
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark Present
              </button>
              <button 
                onClick={() => handleMarkAttendance('Leave')} 
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 flex items-center justify-center gap-2 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark Leave
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
