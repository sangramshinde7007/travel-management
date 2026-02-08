// Accounts Page - Expense tracking and financial summary
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllExpenses, addExpense, calculateFinancialSummary } from '../../services/expenseService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const Accounts = () => {
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, summary] = await Promise.all([
        getAllExpenses(),
        calculateFinancialSummary()
      ]);
      setExpenses(expensesData);
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
      await addExpense({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date).getTime()
      });

      await loadData();
      setIsModalOpen(false);
      setFormData({
        type: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Accounts & Finance</h1>
            <p className="text-gray-600 mt-1">Track expenses and financial performance</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4 sm:mt-0">
            + Add Expense
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm font-medium">Total Income</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(financialSummary.totalIncome)}</p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-red-100 text-sm font-medium">Total Expenses</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(financialSummary.totalExpenses)}</p>
          </div>

          <div className={`card bg-gradient-to-br ${financialSummary.profit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
            <p className="text-blue-100 text-sm font-medium">{financialSummary.profit >= 0 ? 'Profit' : 'Loss'}</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(Math.abs(financialSummary.profit))}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-sm font-medium">Profit Margin</p>
            <p className="text-3xl font-bold mt-2">{financialSummary.profitMargin}%</p>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense History</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {expense.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -{formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {expenses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No expenses recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Expense" size="medium">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type *</label>
            <select name="type" value={formData.type} onChange={handleChange} required className="input-field">
              <option value="">Select Type</option>
              <option value="fuel">Fuel</option>
              <option value="toll">Toll</option>
              <option value="driver_payment">Driver Payment</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="input-field" placeholder="Enter amount" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required className="input-field" rows="3" placeholder="Enter description"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="input-field" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">Add Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Accounts;
