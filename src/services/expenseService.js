// Expense Service - Track expenses and calculate financials
import { ref, push, set, get, remove, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

const EXPENSES_PATH = PATHS.EXPENSES;
const TRIPS_PATH = PATHS.TRIPS;

/**
 * Add new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<string>} Created expense ID
 */
export const addExpense = async (expenseData) => {
  try {
    const expensesRef = ref(database, EXPENSES_PATH);
    const newExpenseRef = push(expensesRef);
    
    const expense = {
      ...expenseData,
      date: expenseData.date || Date.now(),
      createdAt: Date.now()
    };
    
    await set(newExpenseRef, expense);
    return newExpenseRef.key;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

/**
 * Get all expenses
 * @returns {Promise<Array>} Array of expenses
 */
export const getAllExpenses = async () => {
  try {
    const expensesRef = ref(database, EXPENSES_PATH);
    const snapshot = await get(expensesRef);
    
    if (snapshot.exists()) {
      const expensesData = snapshot.val();
      return Object.keys(expensesData).map(key => ({
        id: key,
        ...expensesData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

/**
 * Delete expense
 * @param {string} expenseId - Expense ID
 * @returns {Promise<void>}
 */
export const deleteExpense = async (expenseId) => {
  try {
    const expenseRef = ref(database, `${EXPENSES_PATH}/${expenseId}`);
    await remove(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Calculate total income from trips
 * @returns {Promise<number>} Total income
 */
export const calculateTotalIncome = async () => {
  try {
    const tripsRef = ref(database, TRIPS_PATH);
    const snapshot = await get(tripsRef);
    
    if (snapshot.exists()) {
      const tripsData = snapshot.val();
      const totalIncome = Object.values(tripsData).reduce((sum, trip) => {
        return sum + (trip.rentAmount || 0);
      }, 0);
      return totalIncome;
    }
    return 0;
  } catch (error) {
    console.error('Error calculating income:', error);
    throw error;
  }
};

/**
 * Calculate total expenses
 * @returns {Promise<number>} Total expenses
 */
export const calculateTotalExpenses = async () => {
  try {
    const expensesRef = ref(database, EXPENSES_PATH);
    const snapshot = await get(expensesRef);
    
    if (snapshot.exists()) {
      const expensesData = snapshot.val();
      const totalExpenses = Object.values(expensesData).reduce((sum, expense) => {
        return sum + (expense.amount || 0);
      }, 0);
      return totalExpenses;
    }
    return 0;
  } catch (error) {
    console.error('Error calculating expenses:', error);
    throw error;
  }
};

/**
 * Calculate profit/loss
 * @returns {Promise<Object>} Financial summary
 */
export const calculateFinancialSummary = async () => {
  try {
    const income = await calculateTotalIncome();
    const expenses = await calculateTotalExpenses();
    const profit = income - expenses;
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      profit: profit,
      profitMargin: income > 0 ? ((profit / income) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error calculating financial summary:', error);
    throw error;
  }
};

/**
 * Get expenses by date range
 * @param {number} startDate - Start timestamp
 * @param {number} endDate - End timestamp
 * @returns {Promise<Array>} Filtered expenses
 */
export const getExpensesByDateRange = async (startDate, endDate) => {
  try {
    const expenses = await getAllExpenses();
    return expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  } catch (error) {
    console.error('Error fetching expenses by date:', error);
    throw error;
  }
};

/**
 * Subscribe to expenses real-time updates
 * @param {Function} callback - Callback function with expenses array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToExpenses = (callback) => {
  const expensesRef = ref(database, EXPENSES_PATH);
  
  const unsubscribe = onValue(expensesRef, (snapshot) => {
    if (snapshot.exists()) {
      const expensesData = snapshot.val();
      const expenses = Object.keys(expensesData).map(key => ({
        id: key,
        ...expensesData[key]
      }));
      callback(expenses);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};
