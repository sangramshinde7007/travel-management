// Driver Management Page - CRUD operations for drivers
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import { addDriver, updateDriver, deleteDriver, subscribeToDrivers } from '../../services/driverService';
import { getAllVehicles } from '../../services/vehicleService';
import { registerUser } from '../../services/authService'; // Import registerUser
import { formatPhone, formatDate, getStatusColor } from '../../utils/formatters';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Delete Modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // View Modal (New)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewDriver, setViewDriver] = useState(null);
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    salary: '',
    assignedVehicle: ''
  });

  useEffect(() => {
    loadData();
  }, []);
  
  // ... existing loadData ...

  const loadData = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      setVehicles(vehiclesData);

      const unsubscribe = subscribeToDrivers((driversData) => {
        setDrivers(driversData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setSelectedDriver(driver);
      setFormData({
        name: driver.name,
        email: driver.email || '',
        password: '',
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        salary: driver.salary,
        assignedVehicle: driver.assignedVehicle || ''
      });
    } else {
      setSelectedDriver(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        licenseNumber: '',
        salary: '',
        assignedVehicle: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };
  
  // View Modal Handlers
  const handleOpenViewModal = (driver) => {
    setViewDriver(driver);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewDriver(null);
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
      const driverData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        salary: parseFloat(formData.salary),
        assignedVehicle: formData.assignedVehicle || null
      };

      if (selectedDriver) {
        // Update existing driver
        await updateDriver(selectedDriver.id, driverData);
      } else {
        // Create new driver account
        const user = await registerUser(formData.email, formData.password, formData.name, 'driver');
        await addDriver({
          ...driverData,
          userId: user.uid
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving driver:', error);
      let msg = 'Failed to save driver';
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use';
      alert(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDriver(selectedDriver.id);
      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Failed to delete driver');
    }
  };

  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return 'Not Assigned';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicleName} (${vehicle.vehicleNumber})` : 'Unknown Vehicle';
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600 mt-1">Manage your drivers and assignments</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary mt-4 sm:mt-0"
          >
            + Add Driver
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Drivers</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">{drivers.length}</span>
              <div className="p-2 bg-blue-200 rounded-lg">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Available</h3>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {drivers.filter(d => !d.status || d.status === 'Available').length}
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
                {drivers.filter(d => d.status === 'On Trip').length}
              </span>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">License Number</th>
                <th className="px-6 py-3 text-left">Salary</th>
                <th className="px-6 py-3 text-left">Assigned Vehicle</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.id} className="table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold">
                          {driver.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-xs text-gray-500">{driver.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status || 'Available')}`}>
                      {driver.status || 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatPhone(driver.phone)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {driver.licenseNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    ₹{driver.salary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {getVehicleName(driver.assignedVehicle)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenViewModal(driver)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenModal(driver)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {drivers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No drivers found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Driver Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Driver Details"
        size="medium"
      >
        {viewDriver && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">
                   {viewDriver.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewDriver.name}</h3>
                  <p className="text-gray-500">{viewDriver.email}</p>
                </div>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(viewDriver.status || 'Available')}`}>
                {viewDriver.status || 'Available'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <p className="text-lg font-medium text-gray-900 mt-1">{formatPhone(viewDriver.phone)}</p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">License Number</label>
                <p className="text-lg font-medium text-gray-900 mt-1">{viewDriver.licenseNumber}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Salary</label>
                <p className="text-lg font-medium text-gray-900 mt-1">₹{viewDriver.salary?.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Vehicle</label>
                <p className="text-lg font-medium text-gray-900 mt-1">{getVehicleName(viewDriver.assignedVehicle)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</label>
                <p className="text-lg font-medium text-gray-900 mt-1">
                  {viewDriver.createdAt ? formatDate(viewDriver.createdAt) : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</label>
                <p className="text-sm font-mono text-gray-600 mt-1 bg-gray-100 p-2 rounded truncate">
                  {viewDriver.userId || 'Not Linked'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <button
                onClick={handleCloseViewModal}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDriver ? 'Edit Driver' : 'Add New Driver'}
        size="medium"
       >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Driver name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Driver email for login"
              disabled={selectedDriver}
            />
          </div>

          {!selectedDriver && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Login password"
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="10-digit phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number *
            </label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="License number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Salary *
            </label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Salary amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Vehicle
            </label>
            <select
              name="assignedVehicle"
              value={formData.assignedVehicle}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Not Assigned</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleName} ({vehicle.vehicleNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {selectedDriver ? 'Update' : 'Add'} Driver
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Driver"
        message={`Are you sure you want to delete ${selectedDriver?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default DriverManagement;

