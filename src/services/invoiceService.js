// Invoice Service - Generate PDF invoices and upload to Firebase Storage
import jsPDF from 'jspdf';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set, get } from 'firebase/database';
import { storage, database } from '../firebase/config';
import { PATHS } from '../firebase/dbPathConstants';

const INVOICES_PATH = PATHS.INVOICES;

/**
 * Generate invoice PDF from trip data
 * @param {Object} tripData - Trip data with customer, vehicle, driver info
 * @returns {Blob} PDF blob
 */
export const generateInvoicePDF = (tripData) => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAVEL MANAGEMENT', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice', 105, 28, { align: 'center' });
  
  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Invoice No: ${tripData.invoiceNumber}`, 20, 45);
  doc.text(`Date: ${new Date(tripData.createdAt).toLocaleDateString()}`, 20, 52);
  
  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${tripData.customerName}`, 20, 72);
  doc.text(`Phone: ${tripData.customerPhone}`, 20, 79);
  doc.text(`Address: ${tripData.customerAddress}`, 20, 86);
  
  // Trip Details
  doc.setFont('helvetica', 'bold');
  doc.text('Trip Details:', 20, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vehicle: ${tripData.vehicleName} (${tripData.vehicleNumber})`, 20, 107);
  doc.text(`Driver: ${tripData.driverName}`, 20, 114);
  doc.text(`Route: ${tripData.route}`, 20, 121);
  doc.text(`Start Date: ${new Date(tripData.tripStartDate).toLocaleDateString()}`, 20, 128);
  doc.text(`End Date: ${new Date(tripData.tripEndDate).toLocaleDateString()}`, 20, 135);
  doc.text(`Passengers: ${tripData.passengersCount}`, 20, 142);
  
  // Payment Details Table
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details:', 20, 160);
  
  // Table
  const tableY = 170;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, tableY, 170, 10, 'F');
  doc.text('Description', 25, tableY + 7);
  doc.text('Amount', 160, tableY + 7);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Total Rent', 25, tableY + 17);
  doc.text(`₹${tripData.rentAmount.toFixed(2)}`, 160, tableY + 17);
  
  doc.text('Advance Payment', 25, tableY + 27);
  doc.text(`₹${tripData.advancePayment.toFixed(2)}`, 160, tableY + 27);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Remaining Payment', 25, tableY + 37);
  doc.text(`₹${tripData.remainingPayment.toFixed(2)}`, 160, tableY + 37);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 105, 270, { align: 'center' });
  doc.text('For any queries, please contact us.', 105, 275, { align: 'center' });
  
  return doc.output('blob');
};

/**
 * Upload invoice PDF to Firebase Storage
 * @param {Blob} pdfBlob - PDF blob
 * @param {string} invoiceNumber - Invoice number for filename
 * @returns {Promise<string>} Download URL
 */
export const uploadInvoicePDF = async (pdfBlob, invoiceNumber) => {
  try {
    const fileName = `invoices/invoice_${invoiceNumber}_${Date.now()}.pdf`;
    const fileRef = storageRef(storage, fileName);
    
    await uploadBytes(fileRef, pdfBlob);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading invoice:', error);
    throw error;
  }
};

/**
 * Save invoice metadata to database
 * @param {Object} invoiceData - Invoice metadata
 * @returns {Promise<string>} Invoice ID
 */
export const saveInvoiceMetadata = async (invoiceData) => {
  try {
    const invoicesRef = dbRef(database, INVOICES_PATH);
    const newInvoiceRef = push(invoicesRef);
    
    await set(newInvoiceRef, {
      ...invoiceData,
      generatedAt: Date.now()
    });
    
    return newInvoiceRef.key;
  } catch (error) {
    console.error('Error saving invoice metadata:', error);
    throw error;
  }
};

/**
 * Generate and save complete invoice
 * @param {Object} tripData - Complete trip data
 * @param {string} generatedBy - User ID who generated the invoice
 * @returns {Promise<Object>} Invoice data with PDF URL
 */
export const createInvoice = async (tripData, generatedBy) => {
  try {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Prepare trip data with invoice number
    const invoiceData = {
      ...tripData,
      invoiceNumber
    };
    
    // Generate PDF
    const pdfBlob = generateInvoicePDF(invoiceData);
    
    // Upload to Firebase Storage
    const pdfUrl = await uploadInvoicePDF(pdfBlob, invoiceNumber);
    
    // Save metadata to database
    const invoiceId = await saveInvoiceMetadata({
      tripId: tripData.id,
      invoiceNumber,
      pdfUrl,
      generatedBy
    });
    
    return {
      id: invoiceId,
      invoiceNumber,
      pdfUrl,
      pdfBlob // For immediate download
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

/**
 * Get all invoices
 * @returns {Promise<Array>} Array of invoices
 */
export const getAllInvoices = async () => {
  try {
    const invoicesRef = dbRef(database, INVOICES_PATH);
    const snapshot = await get(invoicesRef);
    
    if (snapshot.exists()) {
      const invoicesData = snapshot.val();
      return Object.keys(invoicesData).map(key => ({
        id: key,
        ...invoicesData[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

/**
 * Generate WhatsApp share link
 * @param {string} phoneNumber - Customer phone number
 * @param {string} pdfUrl - Invoice PDF URL
 * @param {string} invoiceNumber - Invoice number
 * @returns {string} WhatsApp share URL
 */
export const generateWhatsAppLink = (phoneNumber, pdfUrl, invoiceNumber) => {
  const message = `Hello! Here is your invoice ${invoiceNumber} for your recent trip. You can download it here: ${pdfUrl}`;
  const encodedMessage = encodeURIComponent(message);
  
  // Remove any non-numeric characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};
