// Vehicle Management Page - CRUD operations for vehicles
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import { addVehicle, updateVehicle, deleteVehicle, subscribeToVehicles } from '../../services/vehicleService';
import { getStatusColor } from '../../utils/formatters';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleName: '',
    vehicleNumber: '',
    vehicleType: '',
    status: 'Available'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToVehicles((vehiclesData) => {
      setVehicles(vehiclesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        vehicleName: vehicle.vehicleName,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        vehicleName: '',
        vehicleNumber: '',
        vehicleType: '',
        status: 'Available'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, formData);
      } else {
        await addVehicle(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVehicle(selectedVehicle.id);
      setIsDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="text-gray-600 mt-1">Manage your fleet of vehicles</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary mt-4 sm:mt-0"
          >
            + Add Vehicle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Vehicles</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">{vehicles.length}</span>
              <div className="p-2 bg-blue-200 rounded-lg">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Available</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {vehicles.filter(v => v.status === 'Available').length}
              </span>
              <div className="p-2 bg-green-200 rounded-lg">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">On Trip</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {vehicles.filter(v => v.status === 'On Trip').length}
              </span>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vehicle.vehicleName}</h3>
                  <p className="text-sm text-gray-600">{vehicle.vehicleNumber}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-900">{vehicle.vehicleType}</span></p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(vehicle)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="flex-1 btn-danger text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No vehicles found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Name *
            </label>
            <input
              type="text"
              name="vehicleName"
              value={formData.vehicleName}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="e.g., Toyota Innova"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="e.g., MH 12 AB 1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Select Type</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Mini Bus">Mini Bus</option>
              <option value="Bus">Bus</option>
              <option value="Tempo Traveller">Tempo Traveller</option>
            </select>
          </div>



          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {selectedVehicle ? 'Update' : 'Add'} Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${selectedVehicle?.vehicleName}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default VehicleManagement;
