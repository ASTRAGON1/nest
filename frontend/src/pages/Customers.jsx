import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, Phone, User, MapPin, AlertTriangle, History } from 'lucide-react';
import { customerService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const Customers = () => {
    const { language } = useLanguage();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [purchaseHistory, setPurchaseHistory] = useState([]);

    // Form
    const initialForm = { name: '', phone: '', address: '', notes: '' };
    const [formData, setFormData] = useState(initialForm);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            setFilteredCustomers(customers.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                (c.phone && c.phone.includes(lower))
            ));
        } else {
            setFilteredCustomers(customers);
        }
    }, [searchTerm, customers]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerService.getAll();
            setCustomers(data);
            setFilteredCustomers(data);
        } catch (err) {
            console.error('Failed to fetch customers', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (customerId) => {
        try {
            const data = await customerService.getPurchases(customerId);
            setPurchaseHistory(data);
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            setFormError(t(language, 'fieldRequired') || 'Name and Phone required');
            return;
        }

        try {
            await customerService.create(formData);
            setIsAddModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchCustomers();
        } catch (err) {
            console.error('Add failed', err);
            setFormError(err.response?.data?.error || 'Failed to add customer');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            setFormError(t(language, 'fieldRequired') || 'Name and Phone required');
            return;
        }

        try {
            await customerService.update(selectedCustomer.id, formData);
            setIsEditModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchCustomers();
        } catch (err) {
            console.error('Edit failed', err);
            setFormError('Failed to update customer');
        }
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        try {
            await customerService.delete(selectedCustomer.id);
            setIsDeleteModalOpen(false);
            fetchCustomers();
        } catch (err) {
            console.error('Delete failed', err);
            if (err.response && err.response.data && err.response.data.error) {
                alert(err.response.data.error);
            } else {
                alert('Failed to delete customer');
            }
        }
    };

    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            address: customer.address || '',
            notes: customer.notes || ''
        });
        setIsEditModalOpen(true);
    };

    const openHistoryModal = (customer) => {
        setSelectedCustomer(customer);
        fetchHistory(customer.id);
        setIsHistoryModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'customers') || 'Customers'}</h1>
                <button
                    onClick={() => { setFormData(initialForm); setFormError(''); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'addCustomer') || 'Add Customer'}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchCustomers') || 'Search by name or phone...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">{t(language, 'noCustomersFound') || 'No customers found'}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'name') || 'Name'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'phone') || 'Phone'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'salesCount') || 'Sales'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{customer.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                {customer.salesCount} {t(language, 'orders') || 'Orders'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => openHistoryModal(customer)}
                                                    className="text-gray-400 hover:text-blue-500"
                                                    title={t(language, 'viewHistory') || "View History"}
                                                >
                                                    <History size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(customer)}
                                                    className="text-gray-400 hover:text-[#40A45D]"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedCustomer(customer); setIsDeleteModalOpen(true); }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {isEditModalOpen ? (t(language, 'editCustomer') || 'Edit Customer') : (t(language, 'addCustomer') || 'Add Customer')}
                            </h2>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={isEditModalOpen ? handleEdit : handleAdd} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'name') || 'Name'} *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'phone') || 'Phone'} *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'address') || 'Address'}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'notes') || 'Notes'}</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    rows="3"
                                ></textarea>
                            </div>

                            {formError && <p className="text-red-500 text-xs">{formError}</p>}

                            <button
                                type="submit"
                                className="w-full py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50] font-medium"
                            >
                                {isEditModalOpen ? (t(language, 'saveChanges') || 'Save Changes') : (t(language, 'addCustomer') || 'Add Customer')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'purchaseHistory') || 'Purchase History'}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.name}</p>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {purchaseHistory.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400">{t(language, 'noHistoryFound') || 'No purchase history found.'}</p>
                            ) : (
                                <div className="space-y-4">
                                    {purchaseHistory.map(sale => (
                                        <div key={sale.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-gray-800 dark:text-white">{sale.receiptNumber}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {(() => {
                                                        const date = new Date(sale.saleDate);
                                                        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleTimeString('en-US', { hour12: false })}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="mb-2">
                                                <ul className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                    {sale.saleItems?.map((item, idx) => (
                                                        <li key={idx} className="flex justify-between">
                                                            <span>{item.productName} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                                                            <span>{typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : parseFloat(item.unitPrice).toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-500 dark:text-gray-400">{sale.saleItems?.length || 0} {t(language, 'items') || 'Items'}</span>
                                                <span className="font-bold text-[#40A45D]">{sale.totalAmount.toFixed(2)} MAD</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                {t(language, 'close') || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteCustomer') || 'Delete Customer'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t(language, 'deleteCustomerConfirm') || 'Are you sure you want to delete this customer?'}
                        </p>
                        {selectedCustomer?.salesCount > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-3 rounded-lg text-sm mb-6 text-left flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>{t(language, 'customerHasSalesWarning') || 'Warning: This customer has associated sales records. You cannot delete them.'}</p>
                            </div>
                        )}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                            >
                                {t(language, 'cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={selectedCustomer?.salesCount > 0}
                                className={`px-6 py-2 text-white rounded-lg font-medium ${selectedCustomer?.salesCount > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {t(language, 'delete') || 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
