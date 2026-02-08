// Trip Management Page - Create and manage trips/bookings
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllTrips, createTrip, updateTrip, addCustomer, getAllCustomers } from '../../services/tripService';
import { getAllVehicles, updateVehicleStatus } from '../../services/vehicleService';
import { getAllDrivers, updateDriverStatus } from '../../services/driverService';
import { createInvoice, generateWhatsAppLink } from '../../services/invoiceService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/formatters';

// Sync Status Logic (Moved outside component)
const syncVehicleStatus = async (vehicleId, currentTrips) => {
  try {
    if (!vehicleId) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Find if any trip is currently running for this vehicle
    const activeTrip = currentTrips.find(t => {
      if (t.vehicleId !== vehicleId) return false;
      if (t.status === 'Cancelled') return false;
      
      const start = new Date(t.tripStartDate).setHours(0,0,0,0);
      const end = new Date(t.tripEndDate).setHours(23,59,59,999);
      
      return today >= start && today <= end;
    });

    const newStatus = activeTrip ? 'On Trip' : 'Available';
 
    await updateVehicleStatus(vehicleId, newStatus);
    
  } catch (error) {
    console.error('Error syncing vehicle status:', error);
  }
};

const syncDriverStatus = async (driverId, currentTrips) => {
  try {
    if (!driverId) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const activeTrip = currentTrips.find(t => {
      if (t.driverId !== driverId) return false;
      if (t.status === 'Cancelled') return false;
      
      const start = new Date(t.tripStartDate).setHours(0,0,0,0);
      const end = new Date(t.tripEndDate).setHours(23,59,59,999);
      
      return today >= start && today <= end;
    });

    const newStatus = activeTrip ? 'On Trip' : 'Available';
 
    await updateDriverStatus(driverId, newStatus);
    
  } catch (error) {
    console.error('Error syncing driver status:', error);
  }
};

const syncAllStatuses = async (vehiclesList, driversList, tripsList) => {
  // Sync Vehicles
  for (const vehicle of vehiclesList) {
    await syncVehicleStatus(vehicle.id, tripsList);
  }
  // Sync Drivers
  for (const driver of driversList) {
    await syncDriverStatus(driver.id, tripsList);
  }
};

const TripManagement = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [viewTrip, setViewTrip] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    vehicleId: '',
    driverId: '',
    tripStartDate: '',
    tripEndDate: '',
    fromLocation: '',
    toLocation: '',
    passengersCount: '',
    rentAmount: '',
    advancePayment: ''
  });
  const [filterStatus, setFilterStatus] = useState('All');

  const loadData = React.useCallback(async () => {
    try {
      const [tripsData, vehiclesData, driversData, customersData] = await Promise.all([
        getAllTrips(),
        getAllVehicles(),
        getAllDrivers(),
        getAllCustomers()
      ]);
      setTrips(tripsData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setCustomers(customersData);
      
      // Auto-sync vehicle and driver statuses on load
      syncAllStatuses(vehiclesData, driversData, tripsData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (trip = null) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (trip) {
      setSelectedTrip(trip);
      const [from, to] = trip.fromLocation ? [trip.fromLocation, trip.toLocation] : (trip.route || '').split(' to ');

      setFormData({
        customerName: trip.customerName,
        customerPhone: trip.customerPhone,
        customerAddress: trip.customerAddress,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        tripStartDate: formatDate(trip.tripStartDate, 'input'),
        tripEndDate: formatDate(trip.tripEndDate, 'input'),
        fromLocation: from || trip.route || '',
        toLocation: to || '',
        passengersCount: trip.passengersCount,
        rentAmount: trip.rentAmount,
        advancePayment: trip.advancePayment
      });
    } else {
      setSelectedTrip(null);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        vehicleId: '',
        driverId: '',
        tripStartDate: today,
        tripEndDate: today,
        fromLocation: '',
        toLocation: '',
        passengersCount: '',
        rentAmount: '',
        advancePayment: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (trip) => {
    setViewTrip(trip);
    setIsViewModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Helper to calculate status
  const calculateStatus = (startStr, endStr) => {
    if (!startStr || !endStr) return 'Upcoming';
    
    // Create dates at midnight for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const startDate = new Date(startStr);
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    
    const endDate = new Date(endStr);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

    if (today > end) return 'Completed';
    if (today >= start && today <= end) return 'Running';
    return 'Upcoming';
  };

  // Check Availability Logic
  const isResourceAvailable = (id, type) => {
    if (!formData.tripStartDate || !formData.tripEndDate) return true; // Show all if no dates
    
    const start = new Date(formData.tripStartDate).getTime();
    const end = new Date(formData.tripEndDate).setHours(23, 59, 59, 999);

    return !trips.some(t => {
      // Ignore current trip if editing
      if (selectedTrip && t.id === selectedTrip.id) return false;
      if (t.status === 'Cancelled') return false;

      // Check resource match
      const resourceId = type === 'vehicle' ? t.vehicleId : t.driverId;
      if (resourceId !== id) return false;

      // Check Overlap
      // Trip A (t) vs Trip B (new)
      // Overlap if: StartA <= EndB AND EndA >= StartB
      return (t.tripStartDate <= end && t.tripEndDate >= start);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const rentAmount = parseFloat(formData.rentAmount);
      const advancePayment = parseFloat(formData.advancePayment);
      const remainingPayment = rentAmount - advancePayment;

      // Add customer if new
      let customerId = null;
      const existingCustomer = customers.find(c => c.phone === formData.customerPhone);
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        customerId = await addCustomer({
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.customerAddress
        });
      }

      // Determine Status
      const calculatedStatus = calculateStatus(formData.tripStartDate, formData.tripEndDate);
      const routeString = `${formData.fromLocation} to ${formData.toLocation}`;

      const tripData = {
        customerId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        tripStartDate: new Date(formData.tripStartDate).getTime(),
        tripEndDate: new Date(formData.tripEndDate).getTime(),
        fromLocation: formData.fromLocation,
        toLocation: formData.toLocation,
        route: routeString,
        passengersCount: parseInt(formData.passengersCount),
        rentAmount,
        advancePayment,
        remainingPayment,
        status: calculatedStatus
      };

      if (selectedTrip) {
        await updateTrip(selectedTrip.id, tripData);
      } else {
        await createTrip(tripData);
      }
      
      // Reload logic will fetch new trips, but let's optimize/wait
      // We need to sync status based on the NEW data.
      // Since we don't have the new trip ID immediately if createTrip returns void (it actually returns ref key but we await).
      // Safest is to reload all data then sync.
      
      // Reload data first to get the latest trips
      // We can't call loadData() and then sync because loadData updates state which is async.
      // So we must fetch manually here or chain it.
      
      const newTrips = await getAllTrips();
      // Sync the specific vehicle and driver involved
      await syncVehicleStatus(formData.vehicleId, newTrips);
      await syncDriverStatus(formData.driverId, newTrips);
      
      // If editing and vehicle/driver changed, sync the old ones too
      if (selectedTrip) {
        if (selectedTrip.vehicleId !== formData.vehicleId) {
          await syncVehicleStatus(selectedTrip.vehicleId, newTrips);
        }
        if (selectedTrip.driverId !== formData.driverId) {
          await syncDriverStatus(selectedTrip.driverId, newTrips);
        }
      }
      
      // Refresh UI
      // We already fetched newTrips, so we can set it
      setTrips(newTrips);
      // Also refresh vehicles and drivers to see new status
      const [newVehicles, newDrivers] = await Promise.all([
        getAllVehicles(),
        getAllDrivers()
      ]);
      setVehicles(newVehicles);
      setDrivers(newDrivers);
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Failed to save trip');
    }
  };

  const handleGenerateInvoice = async (trip) => {
    try {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const driver = drivers.find(d => d.id === trip.driverId);

      const invoiceData = {
        ...trip,
        vehicleName: vehicle?.vehicleName || 'N/A',
        vehicleNumber: vehicle?.vehicleNumber || 'N/A',
        driverName: driver?.name || 'N/A'
      };

      const invoice = await createInvoice(invoiceData, user.uid);
      
      const url = window.URL.createObjectURL(invoice.pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      const whatsappUrl = generateWhatsAppLink(trip.customerPhone, invoice.pdfUrl, invoice.invoiceNumber);
      window.open(whatsappUrl, '_blank');

      alert('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    }
  };

  const filteredTrips = filterStatus === 'All' 
    ? trips 
    : trips.filter(t => t.status === filterStatus);

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.vehicleName : 'N/A';
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'N/A';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
            <p className="text-gray-600 mt-1">Create and manage bookings</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary mt-4 sm:mt-0">
            + Create Trip
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {['All', 'Upcoming', 'Running', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Trips Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Route</th>
                <th className="px-6 py-3 text-left">Vehicle</th>
                <th className="px-6 py-3 text-left">Start Date</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrips.map((trip) => (
                <tr key={trip.id} className="table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{trip.customerName}</div>
                    <div className="text-sm text-gray-500">{trip.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{trip.route}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getVehicleName(trip.vehicleId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(trip.tripStartDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(trip.rentAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenViewModal(trip)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenModal(trip)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleGenerateInvoice(trip)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTrips.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No trips found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedTrip ? 'Edit Trip' : 'Create New Trip'} size="large">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone *</label>
              <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} required className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Address *</label>
              <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleChange} required className="input-field" />
            </div>

            {/* Dates Section (First to trigger filters) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input type="date" name="tripStartDate" value={formData.tripStartDate} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input type="date" name="tripEndDate" value={formData.tripEndDate} onChange={handleChange} required className="input-field" />
            </div>

            {/* Vehicles & Drivers (Filtered) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle (Available) *</label>
              <select name="vehicleId" value={formData.vehicleId} onChange={handleChange} required className="input-field">
                <option value="">Select Vehicle</option>
                {vehicles.map(v => {
                  const available = isResourceAvailable(v.id, 'vehicle');
                  // Always show selected vehicle even if conflict (to allow keeping it)
                  if (!available && v.id !== formData.vehicleId) return null;
                  return (
                    <option key={v.id} value={v.id} disabled={!available && v.id !== formData.vehicleId}>
                      {v.vehicleName} ({v.vehicleNumber})
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver (Available) *</label>
              <select name="driverId" value={formData.driverId} onChange={handleChange} required className="input-field">
                <option value="">Select Driver</option>
                {drivers.map(d => {
                  const available = isResourceAvailable(d.id, 'driver');
                  if (!available && d.id !== formData.driverId) return null;
                  return (
                    <option key={d.id} value={d.id} disabled={!available && d.id !== formData.driverId}>
                      {d.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Route Section (Split) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Location *</label>
              <input type="text" name="fromLocation" value={formData.fromLocation} onChange={handleChange} required className="input-field" placeholder="e.g. Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Location *</label>
              <input type="text" name="toLocation" value={formData.toLocation} onChange={handleChange} required className="input-field" placeholder="e.g. Pune" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passengers *</label>
              <input type="number" name="passengersCount" value={formData.passengersCount} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rent Amount *</label>
              <input type="number" name="rentAmount" value={formData.rentAmount} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Advance Payment *</label>
              <input type="number" name="advancePayment" value={formData.advancePayment} onChange={handleChange} required className="input-field" />
            </div>
            {/* Status Field Removed - Auto Calculated */}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">{selectedTrip ? 'Update' : 'Create'} Trip</button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Trip Details" size="medium">
        {viewTrip && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Customer</p>
                <p className="font-medium">{viewTrip.customerName}</p>
                <p className="text-sm text-gray-600">{viewTrip.customerPhone}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewTrip.status)}`}>
                  {viewTrip.status}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Journey</p>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <span className="font-medium">{viewTrip.fromLocation || viewTrip.route?.split(' to ')[0] || 'Start'}</span>
                <span className="text-gray-400">→</span>
                <span className="font-medium">{viewTrip.toLocation || viewTrip.route?.split(' to ')[1] || 'End'}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>{formatDate(viewTrip.tripStartDate)}</span>
                <span>{formatDate(viewTrip.tripEndDate)}</span>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Vehicle</p>
                <p className="font-medium">{getVehicleName(viewTrip.vehicleId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Driver</p>
                <p className="font-medium">{getDriverName(viewTrip.driverId)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Payment Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Rent</span>
                  <span className="font-medium">{formatCurrency(viewTrip.rentAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Advance Paid</span>
                  <span>- {formatCurrency(viewTrip.advancePayment)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Balance Due</span>
                  <span>{formatCurrency(viewTrip.remainingPayment)}</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripManagement;
