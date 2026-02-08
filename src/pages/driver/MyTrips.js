import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { getTripsByDriver, updateTripStatus } from '../../services/tripService';
import { updateVehicleStatus } from '../../services/vehicleService';
import { updateDriverStatus, getAllDrivers } from '../../services/driverService';
import { getAllVehicles } from '../../services/vehicleService';
import { formatDate, getStatusColor, formatPhone, formatCurrency } from '../../utils/formatters';

const MyTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  const loadTrips = React.useCallback(async () => {
    try {
      const allDrivers = await getAllDrivers();
      const driverRecord = allDrivers.find(d => d.userId === user.uid);
      
      if (driverRecord) {
        const tripsData = await getTripsByDriver(driverRecord.id);
        const sortedTrips = tripsData.sort((a, b) => {
          const statusOrder = { 'Running': 1, 'Upcoming': 2, 'Completed': 3, 'Cancelled': 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        setTrips(sortedTrips);

         // Fetch vehicle if needed for modal display
         if (driverRecord.assignedVehicle) {
            const allVehicles = await getAllVehicles();
            const vehicle = allVehicles.find(v => v.id === driverRecord.assignedVehicle);
            setAssignedVehicle(vehicle);
         }
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleUpdateTripStatus = async (trip, newStatus) => {
    try {
      if (!window.confirm(`Are you sure you want to mark this trip as ${newStatus}?`)) return;

      await updateTripStatus(trip.id, newStatus);

      if (newStatus === 'Running') {
        if (trip.vehicleId) await updateVehicleStatus(trip.vehicleId, 'On Trip');
        if (trip.driverId) await updateDriverStatus(trip.driverId, 'On Trip');
      } else if (newStatus === 'Completed') {
        if (trip.vehicleId) await updateVehicleStatus(trip.vehicleId, 'Available');
        if (trip.driverId) await updateDriverStatus(trip.driverId, 'Available');
      }

      await loadTrips();
    } catch (error) {
      console.error('Error updating trip status:', error);
      alert('Failed to update trip status');
    }
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedTrip(null);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Trips</h1>
        
        <div className="card">
          <div className="space-y-4">
            {trips.map((trip) => (
              <div key={trip.id} className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 transition-all shadow-sm hover:shadow-md bg-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                       {trip.route}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-gray-900">{trip.customerName}</span> • {formatPhone(trip.customerPhone)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(trip.status)} mt-2 md:mt-0 self-start md:self-center`}>
                    {trip.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(trip.tripStartDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(trip.tripEndDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Passengers</p>
                    <p className="text-sm font-semibold text-gray-900">{trip.passengersCount}</p>
                  </div>
                   <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                    <p className="text-sm font-semibold text-gray-900 truncate" title={trip.fromLocation || trip.route?.split(' to ')[0]}>
                      {trip.fromLocation || trip.route?.split(' to ')[0] || 'N/A'}
                    </p>
                  </div>
                   <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Drop</p>
                    <p className="text-sm font-semibold text-gray-900 truncate" title={trip.toLocation || trip.route?.split(' to ')[1]}>
                      {trip.toLocation || trip.route?.split(' to ')[1] || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleViewTrip(trip)}
                    className="text-gray-600 hover:text-primary-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  {trip.status === 'Upcoming' && (
                    <button
                      onClick={() => handleUpdateTripStatus(trip, 'Running')}
                      className="btn-primary text-sm px-6"
                    >
                      Start Trip
                    </button>
                  )}
                  {trip.status === 'Running' && (
                    <button
                      onClick={() => handleUpdateTripStatus(trip, 'Completed')}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                    >
                       Complete Trip
                    </button>
                  )}
                  {trip.status === 'Completed' && (
                     <span className="text-sm text-green-600 font-medium flex items-center px-4">
                       ✓ Completed
                     </span>
                  )}
                </div>
              </div>
            ))}

            {trips.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="mt-2 text-sm text-gray-500">No trips assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* View Trip Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
          title="Trip Details"
          size="medium"
        >
          {selectedTrip && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTrip.route}</h3>
                  <p className="text-gray-500 text-sm mt-1">Trip ID: <span className="font-mono bg-gray-100 px-1 rounded">{selectedTrip.id}</span></p>
                </div>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(selectedTrip.status)}`}>
                  {selectedTrip.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Name</label>
                    <p className="font-medium text-gray-900">{selectedTrip.customerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-blue-600 font-semibold">Phone</label>
                    <p className="font-medium text-gray-900">{formatPhone(selectedTrip.customerPhone)}</p>
                  </div>
                </div>
              </div>

              {/* Trip Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date & Time</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{formatDate(selectedTrip.tripStartDate)}</p>
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date & Time</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{formatDate(selectedTrip.tripEndDate)}</p>
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Location</label>
                   <p className="text-base text-gray-900 mt-1 bg-gray-50 p-2 rounded border border-gray-200">
                     {selectedTrip.fromLocation || selectedTrip.route?.split(' to ')[0] || 'Not specified'}
                   </p>
                </div>
                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Drop Location</label>
                   <p className="text-base text-gray-900 mt-1 bg-gray-50 p-2 rounded border border-gray-200">
                     {selectedTrip.toLocation || selectedTrip.route?.split(' to ')[1] || 'Not specified'}
                   </p>
                </div>
              </div>

              {/* Vehicle & Passengers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Passengers</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">{selectedTrip.passengersCount} Person(s)</p>
                </div>
                <div className="md:col-span-2">
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Vehicle</label>
                   <p className="text-lg font-medium text-gray-900 mt-1">
                     {assignedVehicle ? `${assignedVehicle.vehicleName} (${assignedVehicle.vehicleNumber})` : 'Vehicle info not loaded'}
                   </p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Payment Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Total Rent</label>
                    <p className="text-lg font-bold text-primary-700">{formatCurrency(selectedTrip.rentAmount)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Advance Paid</label>
                    <p className="text-lg font-medium text-green-600">{formatCurrency(selectedTrip.advancePayment)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold">Balance Due</label>
                    <p className="text-lg font-medium text-red-600">
                      {formatCurrency((selectedTrip.rentAmount || 0) - (selectedTrip.advancePayment || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedTrip.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <label className="text-xs font-bold text-yellow-800 uppercase tracking-wider">Trip Notes</label>
                  <p className="text-sm text-yellow-900 mt-1">{selectedTrip.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t mt-6">
                <button
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default MyTrips;
