import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Eye, DollarSign, CreditCard, Trash2, AlertTriangle, RotateCcw, Edit3 } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { printReceipt, printInvoice } from '../utils/receiptGenerator';
import DateRangePicker from '../components/DateRangePicker';
import CustomSelect from '../components/CustomSelect';
import { PAYMENT_STATUS, PAYMENT_METHODS, DATE_RANGES } from '../utils/constants';
import { formatDate, getStatusColor } from '../utils/helpers';
import InvoicePromptModal from '../components/InvoicePromptModal';

const Sales = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState('today'); // today, yesterday, week, month, custom
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('All');

    const handleDateRangeChange = ({ start, end }) => {
        setCustomFrom(start ? start.toISOString().split('T')[0] : '');
        setCustomTo(end ? end.toISOString().split('T')[0] : '');
    };
    const [searchTerm, setSearchTerm] = useState('');

    // Stats
    const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0 });

    // Details Modal
    const [selectedSale, setSelectedSale] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Invoice Prompt Modal
    const [isInvoicePromptOpen, setIsInvoicePromptOpen] = useState(false);

    // Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Delete Confirmation Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);

    // Return Modal
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState({}); // { productId: quantity }
    const [returnReason, setReturnReason] = useState('');

    // Toast Notification
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundMethod, setRefundMethod] = useState('');

    // Edit Sale Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editSale, setEditSale] = useState(null);
    const [editItems, setEditItems] = useState([]);
    const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
    const [editAmountPaid, setEditAmountPaid] = useState('');
    const [editProductSearch, setEditProductSearch] = useState('');
    const [editAvailableProducts, setEditAvailableProducts] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            let params = { paymentMethod };
            if (filterStatus !== 'All') params.paymentStatus = filterStatus;
            if (searchTerm) params.search = searchTerm;

            // Calculate dates based on range
            const today = new Date();
            let from, to;

            switch (dateRange) {
                case 'today':
                    from = new Date();
                    from.setHours(0, 0, 0, 0);
                    to = new Date();
                    to.setHours(23, 59, 59, 999);
                    break;
                case 'yesterday':
                    from = new Date();
                    from.setDate(today.getDate() - 1);
                    from.setHours(0, 0, 0, 0);
                    to = new Date();
                    to.setDate(today.getDate() - 1);
                    to.setHours(23, 59, 59, 999);
                    break;
                case DATE_RANGES.WEEK:
                    from = new Date();
                    from.setDate(today.getDate() - 7);
                    from.setHours(0, 0, 0, 0);
                    to = new Date();
                    to.setHours(23, 59, 59, 999);
                    break;
                case DATE_RANGES.MONTH:
                    from = new Date();
                    from.setDate(1); // Start of month
                    from.setHours(0, 0, 0, 0);
                    to = new Date();
                    to.setHours(23, 59, 59, 999);
                    break;
                case 'custom':
                    if (customFrom) from = new Date(customFrom);
                    if (customTo) to = new Date(customTo);
                    break;
                default:
                    break;
            }

            if (from) params.from = from.toISOString();
            if (to) params.to = to.toISOString();



            const res = await api.get('/sales', { params });
            setSales(res.data);

            // Helper to calc total dynamically (Client-side recalculation to handle stale DB data)
            const calculateSaleTotal = (sale) => {
                // If we have items and returns, calc on the fly
                if (sale.saleItems && sale.returns) {
                    return sale.saleItems.reduce((sum, item) => {
                        let returnedQty = 0;
                        if (sale.returns) {
                            sale.returns.forEach(r => {
                                const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                                if (rItem) returnedQty += rItem.quantity;
                            });
                        }
                        const remaining = Math.max(0, item.quantity - returnedQty);
                        return sum + (remaining * item.unitPrice);
                    }, 0);
                }
                // Fallback to DB value
                return sale.totalAmount;
            };

            // Calculate derived stats
            const totalRev = res.data.reduce((sum, sale) => sum + calculateSaleTotal(sale), 0);
            setStats({
                totalSales: res.data.length,
                totalRevenue: totalRev
            });

        } catch (err) {
            console.error('Failed to fetch sales', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, customFrom, customTo, paymentMethod, filterStatus, searchTerm]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const handleRecordPayment = (sale) => {
        setSelectedSale(sale);
        setPaymentAmount(sale.amountDue.toString());
        setIsPaymentModalOpen(true);
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/sales/${selectedSale.id}/payment`, { amount: parseFloat(paymentAmount) });
            setIsPaymentModalOpen(false);
            setPaymentAmount('');
            setSelectedSale(null);
            fetchSales(); // Refresh list
        } catch (err) {
            console.error('Failed to record payment', err);
            alert('Failed to record payment');
        }
    };

    const handleViewDetails = async (saleId) => {
        try {
            const res = await api.get(`/sales/${saleId}`);
            setSelectedSale(res.data);
            setIsDetailsModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch sale details', err);
        }
    };

    const handleDeleteSale = async () => {
        if (!saleToDelete) return;

        try {
            await api.delete(`/sales/${saleToDelete}`);
            setIsDeleteModalOpen(false);
            setSaleToDelete(null);
            fetchSales(); // Refresh list
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete sale');
        }
    };

    const openDeleteModal = (saleId) => {
        setSaleToDelete(saleId);
        setIsDeleteModalOpen(true);
    };

    const handleOpenReturnModal = async (saleId) => {
        try {
            const res = await api.get(`/sales/${saleId}`);
            const sale = res.data;
            setSelectedSale(sale);

            // Calculate refund amount based on returnable items? No, start with 0
            setReturnItems({});
            setReturnReason('');
            setRefundAmount(0);
            setRefundMethod('Cash');
            setIsReturnModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch sale details for return', err);
        }
    };

    const handleReturnItemChange = (productId, qtyStr, unitPrice, maxQty) => {
        let qty = parseInt(qtyStr) || 0;

        // Enforce max quantity
        if (qty < 0) qty = 0;
        if (qty > maxQty) qty = maxQty;

        const newItems = { ...returnItems, [productId]: qty };
        setReturnItems(newItems);

        // Auto-calculate refund amount
        let total = 0;
        Object.entries(newItems).forEach(([pId, q]) => {
            const item = selectedSale.saleItems.find(i => i.productId === parseInt(pId));
            if (item) {
                total += q * item.unitPrice;
            }
        });
        setRefundAmount(total);
    };

    const submitReturn = async (e) => {
        e.preventDefault();
        try {
            const itemsToReturn = Object.entries(returnItems)
                .filter(([_, qty]) => qty > 0)
                .map(([pId, qty]) => ({
                    productId: parseInt(pId),
                    quantity: qty
                }));

            if (itemsToReturn.length === 0) {
                alert(t(language, 'selectItemsToReturn') || 'Please select items to return');
                return;
            }

            await api.post('/returns', {
                saleId: selectedSale.id,
                items: itemsToReturn,
                reason: returnReason,
                refundAmount: parseFloat(refundAmount),
                refundMethod
            });

            setIsReturnModalOpen(false);
            fetchSales(); // Refresh list to update status or remove deleted sale
            showToast(t(language, 'returnProcessed') || 'Return processed successfully', 'success');
        } catch (err) {
            console.error('Failed to process return', err);
            alert(err.response?.data?.error || 'Failed to process return');
        }
    };


    // Helper to calc total dynamically (Client-side recalculation)
    const calculateRowTotal = (sale) => {
        if (sale.saleItems && sale.returns) {
            return sale.saleItems.reduce((sum, item) => {
                let returnedQty = 0;
                if (sale.returns) {
                    sale.returns.forEach(r => {
                        const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                        if (rItem) returnedQty += rItem.quantity;
                    });
                }
                const remaining = Math.max(0, item.quantity - returnedQty);
                return sum + (remaining * item.unitPrice);
            }, 0);
        }
        return sale.totalAmount || 0;
    };

    // Edit Sale Handlers
    const handleOpenEditModal = async (saleId) => {
        try {
            const res = await api.get(`/sales/${saleId}`);
            const sale = res.data;
            setEditSale(sale);
            setEditItems(sale.saleItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                brand: item.brand,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                maxStock: null // Will be loaded
            })));
            setEditPaymentMethod(sale.paymentMethod);
            setEditAmountPaid(sale.amountPaid?.toString() || '0');
            setEditProductSearch('');
            setIsEditModalOpen(true);

            // Load available products
            const prodRes = await api.get('/products');
            setEditAvailableProducts(prodRes.data);
        } catch (err) {
            console.error('Failed to open edit modal', err);
            showToast(t(language, 'errorFetchingData') || 'Failed to fetch data', 'error');
        }
    };

    const handleEditQuantity = (productId, delta) => {
        setEditItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleEditRemoveItem = (productId) => {
        setEditItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleEditAddProduct = (product) => {
        const exists = editItems.find(item => item.productId === product.id);
        if (exists) {
            handleEditQuantity(product.id, 1);
        } else {
            setEditItems(prev => [...prev, {
                productId: product.id,
                productName: product.name,
                brand: product.brand || '',
                quantity: 1,
                unitPrice: product.sellingPrice
            }]);
        }
        setEditProductSearch('');
    };

    const getEditTotal = () => {
        return editItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const submitEditSale = async () => {
        if (editItems.length === 0) {
            showToast(t(language, 'cartEmpty') || 'Cart is empty', 'error');
            return;
        }

        setEditLoading(true);
        try {
            const totalAmount = getEditTotal();
            const paid = parseFloat(editAmountPaid) || 0;

            await api.put(`/sales/${editSale.id}`, {
                items: editItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    name: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                totalAmount,
                subtotal: totalAmount,
                paymentMethod: editPaymentMethod,
                customerId: editSale.customerId,
                amountPaid: paid
            });

            setIsEditModalOpen(false);
            fetchSales();
            showToast(t(language, 'saleUpdated') || 'Sale updated successfully', 'success');
        } catch (err) {
            console.error('Failed to update sale', err);
            showToast(err.response?.data?.error || (t(language, 'updateFailed') || 'Failed to update sale'), 'error');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'sales') || 'Sales'}</h1>
                <button
                    onClick={() => navigate('/sales/new')}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'newSale') || 'New Sale'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalSales') || 'Total Sales'}</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalSales}</h3>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400">
                        <CreditCard size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalRevenue') || 'Total Revenue'}</p>
                        <h3 className="text-2xl font-bold text-[#40A45D]">{stats.totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full text-[#40A45D]">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {['today', 'yesterday', DATE_RANGES.WEEK, DATE_RANGES.MONTH, 'custom'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${dateRange === range
                                    ? 'bg-[#40A45D] text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t(language, range) || range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="w-40">
                            <CustomSelect
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                                options={[
                                    { value: 'All', label: t(language, 'allPaymentMethods') || 'All Methods' },
                                    { value: PAYMENT_METHODS[0], label: t(language, 'cash') || 'Cash' },
                                    { value: PAYMENT_METHODS[1], label: t(language, 'card') || 'Card' }
                                ]}
                                placeholder={t(language, 'paymentMethod')}
                            />
                        </div>
                        <div className="w-40">
                            <CustomSelect
                                value={filterStatus}
                                onChange={setFilterStatus}
                                options={[
                                    { value: 'All', label: t(language, 'allStatuses') || 'All Statuses' },
                                    { value: PAYMENT_STATUS.PAID, label: t(language, 'paid') || 'Paid' },
                                    { value: PAYMENT_STATUS.PARTIALLY_PAID, label: t(language, 'partiallyPaid') || 'Partial' },
                                    { value: PAYMENT_STATUS.UNPAID, label: t(language, 'unpaid') || 'Unpaid' }
                                ]}
                                placeholder={t(language, 'status')}
                            />
                        </div>
                    </div>
                </div>

                {dateRange === 'custom' && (
                    <div className="w-[300px]">
                        <DateRangePicker
                            startDate={customFrom ? new Date(customFrom) : null}
                            endDate={customTo ? new Date(customTo) : null}
                            onChange={handleDateRangeChange}
                            placeholder={t(language, 'selectDateRange') || "Select Date Range"}
                        />
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchReceipt') || 'Search by Receipt Number...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                ) : sales.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {t(language, 'noSalesFound') || 'No sales found'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'receiptNo') || 'Receipt #'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'date') || 'Date'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'customer') || 'Customer'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'total') || 'Total'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'status') || 'Status'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.receiptNumber}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{formatDate(sale.date)}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{sale.customerName}</td>
                                        <td className="px-6 py-4 font-bold text-[#40A45D]">{calculateRowTotal(sale).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.paymentStatus)}`}>
                                                {t(language, sale.paymentStatus) || sale.paymentStatus?.replace('_', ' ')}
                                            </span>
                                            {sale.paymentStatus !== PAYMENT_STATUS.PAID && (
                                                <div className="text-xs text-red-500 font-medium mt-1">
                                                    {t(language, 'due') || 'Due'}: {sale.amountDue?.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewDetails(sale.id)}
                                                className="text-gray-400 hover:text-[#40A45D] transition-colors"
                                                title={t(language, 'viewDetails') || 'View Details'}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {sale.paymentStatus !== PAYMENT_STATUS.PAID && (
                                                <button
                                                    onClick={() => handleRecordPayment(sale)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    title={t(language, 'recordPayment') || 'Record Payment'}
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openDeleteModal(sale.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title={t(language, 'deleteSale') || 'Delete Sale'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(sale.id)}
                                                className="text-gray-400 hover:text-yellow-500 transition-colors"
                                                title={t(language, 'editSale') || 'Edit Sale'}
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenReturnModal(sale.id)}
                                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                                title={t(language, 'returnItems') || 'Return Items'}
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sale Details Modal */}
            {isDetailsModalOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'saleDetails') || 'Sale Details'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSale.receiptNumber}</p>
                            </div>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <div className="sr-only">Close</div>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="flex justify-between mb-4 text-sm text-gray-600 dark:text-gray-300">
                                <span>{t(language, 'date') || 'Date'}: {formatDate(selectedSale.saleDate)}</span>
                                <span>{t(language, 'customer') || 'Customer'}: {selectedSale.customer?.name || selectedSale.temporaryCustomer || 'Walk-in'}</span>
                            </div>

                            <table className="w-full text-sm mb-6">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                                    <tr>
                                        <th className="px-3 py-2 text-left">{t(language, 'item') || 'Item'}</th>
                                        <th className="px-3 py-2 text-center">{t(language, 'qty') || 'Qty'}</th>
                                        <th className="px-3 py-2 text-right">{t(language, 'price') || 'Price'}</th>
                                        <th className="px-3 py-2 text-right">{t(language, 'total') || 'Total'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                                    {selectedSale.saleItems.map(item => {
                                        let returnedQty = 0;
                                        if (selectedSale.returns) {
                                            selectedSale.returns.forEach(r => {
                                                const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                                                if (rItem) returnedQty += rItem.quantity;
                                            });
                                        }
                                        const isReturned = returnedQty > 0;
                                        const finalQty = item.quantity; // Show original sold

                                        return (
                                            <tr key={item.id} className={isReturned ? 'bg-orange-50 dark:bg-orange-900/10' : ''}>
                                                <td className="px-3 py-2">
                                                    <div className="font-medium">{item.productName}</div>
                                                    <div className="text-xs text-gray-400">{item.brand}</div>
                                                    {isReturned && (
                                                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                            {t(language, 'returned')}: {returnedQty}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {finalQty}
                                                </td>
                                                <td className="px-3 py-2 text-right">{item.unitPrice.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    <span className={isReturned ? 'line-through text-gray-400 mr-2 text-xs' : ''}>
                                                        {(item.quantity * item.unitPrice).toFixed(2)}
                                                    </span>
                                                    {isReturned && (
                                                        <span>{((item.quantity - returnedQty) * item.unitPrice).toFixed(2)}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                                    <span>{t(language, 'total') || 'Total'}</span>
                                    <span>
                                        {selectedSale.saleItems.reduce((sum, item) => {
                                            let returnedQty = 0;
                                            if (selectedSale.returns) {
                                                selectedSale.returns.forEach(r => {
                                                    const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                                                    if (rItem) returnedQty += rItem.quantity;
                                                });
                                            }
                                            return sum + ((item.quantity - returnedQty) * item.unitPrice);
                                        }, 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                    <span>{t(language, 'paymentMethod') || 'Payment Method'}</span>
                                    <span>{selectedSale.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
                            <button
                                onClick={() => printReceipt(selectedSale, language)}
                                className="px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 mr-2"
                            >
                                {t(language, 'printReceipt') || 'Print Delivery Note'}
                            </button>
                            <button
                                onClick={() => setIsInvoicePromptOpen(true)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 mr-2"
                            >
                                {t(language, 'printInvoice') || 'Print Invoice'}
                            </button>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-4 py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50]"
                            >
                                {t(language, 'close') || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {/* Payment Modal */}
            {
                isPaymentModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'recordPayment') || 'Record Payment'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSale.receiptNumber}</p>
                            </div>
                            <form onSubmit={submitPayment} className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t(language, 'amountReceived') || 'Amount Received'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        max={selectedSale.amountDue}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {t(language, 'amountDue') || 'Amount Due'}: {selectedSale.amountDue?.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsPaymentModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        {t(language, 'cancel') || 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50]"
                                    >
                                        {t(language, 'save') || 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteSale') || 'Delete Sale'}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {t(language, 'confirmDeleteSale') || 'Are you sure you want to delete this sale? Stock will be restored.'}
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => { setIsDeleteModalOpen(false); setSaleToDelete(null); }}
                                    className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                                >
                                    {t(language, 'cancel') || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleDeleteSale}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                                >
                                    {t(language, 'delete') || 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Return Modal */}
            {
                isReturnModalOpen && selectedSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'processReturn') || 'Process Return'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSale.receiptNumber}</p>
                            </div>

                            <form onSubmit={submitReturn} className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(language, 'selectItemsToReturn') || 'Select Items to Return'}</h3>
                                    <div className="space-y-3">
                                        {selectedSale.saleItems.map(item => {
                                            // Calculate previously returned qty
                                            let returnedQty = 0;
                                            if (selectedSale.returns) {
                                                selectedSale.returns.forEach(r => {
                                                    const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                                                    if (rItem) returnedQty += rItem.quantity;
                                                });
                                            }
                                            const available = item.quantity - returnedQty;

                                            if (available <= 0) return null;

                                            return (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{item.productName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {t(language, 'sold')}: {item.quantity} | {t(language, 'returned')}: {returnedQty} | {t(language, 'available')}: {available}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={available}
                                                            value={returnItems[item.productId] ?? ''}
                                                            onChange={(e) => handleReturnItemChange(item.productId, e.target.value, item.unitPrice, available)}
                                                            placeholder="0"
                                                            className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-center"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {selectedSale.saleItems.every(item => {
                                            let returnedQty = 0;
                                            if (selectedSale.returns) {
                                                selectedSale.returns.forEach(r => {
                                                    const rItem = r.returnItems.find(ri => ri.productId === item.productId);
                                                    if (rItem) returnedQty += rItem.quantity;
                                                });
                                            }
                                            return (item.quantity - returnedQty) <= 0;
                                        }) && (
                                                <div className="text-center text-gray-500 italic py-4">
                                                    {t(language, 'allItemsReturned') || 'All items have been returned'}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t(language, 'returnReason') || 'Reason for Return'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                            placeholder={t(language, 'enterReason') || 'e.g. Defective, Wrong Item'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t(language, 'refundMethod') || 'Refund Method'}
                                        </label>
                                        <CustomSelect
                                            value={refundMethod}
                                            onChange={setRefundMethod}
                                            options={[
                                                { value: 'Cash', label: t(language, 'cash') || 'Cash' },
                                                { value: 'Other', label: t(language, 'other') || 'Other' }
                                            ]}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t(language, 'refundAmount') || 'Refund Amount'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-bold"
                                    />
                                </div>
                            </form>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/30">
                                <button
                                    type="button"
                                    onClick={() => setIsReturnModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {t(language, 'cancel') || 'Cancel'}
                                </button>
                                <button
                                    onClick={submitReturn}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
                                >
                                    {t(language, 'confirmReturn') || 'Confirm Return'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Sale Modal */}
            {isEditModalOpen && editSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'editSale') || 'Edit Sale'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{editSale.receiptNumber}</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Search to add products */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t(language, 'addProduct') || 'Add Product'}</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={editProductSearch}
                                        onChange={(e) => setEditProductSearch(e.target.value)}
                                        placeholder={t(language, 'searchProducts') || 'Search products...'}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                                    />
                                </div>
                                {editProductSearch.length >= 2 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                                        {editAvailableProducts
                                            .filter(p => p.name.toLowerCase().includes(editProductSearch.toLowerCase()))
                                            .slice(0, 8)
                                            .map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleEditAddProduct(product)}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center"
                                                >
                                                    <span className="text-gray-800 dark:text-white">{product.name}</span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">{product.sellingPrice?.toFixed(2)} | {t(language, 'stock')}: {product.quantity}</span>
                                                </button>
                                            ))}
                                        {editAvailableProducts.filter(p => p.name.toLowerCase().includes(editProductSearch.toLowerCase())).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{t(language, 'noProductsFound') || 'No products found'}</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Current items */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(language, 'items') || 'Items'}</h3>
                                {editItems.length === 0 ? (
                                    <div className="text-center text-gray-400 py-6">{t(language, 'cartEmpty') || 'Cart is empty'}</div>
                                ) : (
                                    <div className="space-y-3">
                                        {editItems.map(item => (
                                            <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.productName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.unitPrice?.toFixed(2)} × {item.quantity} = {(item.unitPrice * item.quantity).toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditQuantity(item.productId, -1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-gray-800 dark:text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleEditQuantity(item.productId, 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#40A45D] text-white hover:bg-[#368f50] transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditRemoveItem(item.productId)}
                                                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Payment details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(language, 'paymentMethod') || 'Payment Method'}</label>
                                    <CustomSelect
                                        value={editPaymentMethod}
                                        onChange={setEditPaymentMethod}
                                        options={[
                                            { value: 'Cash', label: t(language, 'cash') || 'Cash' },
                                            { value: 'Card', label: t(language, 'card') || 'Card' },
                                            { value: 'Check', label: t(language, 'check') || 'Check' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(language, 'amountPaid') || 'Amount Paid'}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editAmountPaid}
                                        onChange={(e) => setEditAmountPaid(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Total */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
                                    <span>{t(language, 'total') || 'Total'}</span>
                                    <span className="text-[#40A45D]">{getEditTotal().toFixed(2)}</span>
                                </div>
                                {parseFloat(editAmountPaid) > 0 && parseFloat(editAmountPaid) < getEditTotal() && (
                                    <div className="flex justify-between items-center text-sm text-red-500 mt-1">
                                        <span>{t(language, 'amountDue') || 'Amount Due'}</span>
                                        <span>{(getEditTotal() - parseFloat(editAmountPaid)).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-700/30">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {t(language, 'cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={submitEditSale}
                                disabled={editLoading || editItems.length === 0}
                                className="px-6 py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50] disabled:opacity-50 font-medium shadow-sm"
                            >
                                {editLoading ? (t(language, 'processing') || 'Processing...') : (t(language, 'saveChanges') || 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                        }`}>
                        {toast.type === 'success' && (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <InvoicePromptModal
                isOpen={isInvoicePromptOpen}
                onClose={() => setIsInvoicePromptOpen(false)}
                onGenerate={(invoiceData) => {
                    printInvoice(selectedSale, language, invoiceData);
                }}
            />
        </div>
    );
};

export default Sales;
