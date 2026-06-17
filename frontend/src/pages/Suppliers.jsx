import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, Phone, User, AlertTriangle, Truck } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const Suppliers = () => {
    const { language } = useLanguage();
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Form
    const initialForm = { name: '', contactPerson: '', phone: '', address: '' };
    const [formData, setFormData] = useState(initialForm);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            setFilteredSuppliers(suppliers.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                (s.contactPerson && s.contactPerson.toLowerCase().includes(lower)) ||
                (s.phone && s.phone.includes(lower))
            ));
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [searchTerm, suppliers]);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
            setFilteredSuppliers(res.data);
        } catch (err) {
            console.error('Failed to fetch suppliers', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            setFormError(t(language, 'fieldRequired') || 'Name and Phone required');
            return;
        }

        try {
            await api.post('/suppliers', formData);
            setIsAddModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchSuppliers();
        } catch (err) {
            console.error('Add failed', err);
            setFormError('Failed to add supplier');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) {
            setFormError(t(language, 'fieldRequired') || 'Name and Phone required');
            return;
        }

        try {
            await api.put(`/suppliers/${selectedSupplier.id}`, formData);
            setIsEditModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchSuppliers();
        } catch (err) {
            console.error('Edit failed', err);
            setFormError('Failed to update supplier');
        }
    };

    const handleDelete = async () => {
        if (!selectedSupplier) return;
        try {
            await api.delete(`/suppliers/${selectedSupplier.id}`);
            setIsDeleteModalOpen(false);
            fetchSuppliers();
        } catch (err) {
            console.error('Delete failed', err);
            if (err.response && err.response.data && err.response.data.error) {
                alert(err.response.data.error);
            } else {
                alert('Failed to delete supplier');
            }
        }
    };

    const openEditModal = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            contactPerson: supplier.contactPerson || '',
            phone: supplier.phone,
            address: supplier.address || ''
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'suppliers') || 'Suppliers'}</h1>
                <button
                    onClick={() => { setFormData(initialForm); setFormError(''); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'addSupplier') || 'Add Supplier'}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchSuppliers') || 'Search suppliers...'}
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
                ) : filteredSuppliers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">{t(language, 'noSuppliersFound') || 'No suppliers found'}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'companyName') || 'Company Name'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'contactPerson') || 'Contact Person'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'phone') || 'Phone'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'products') || 'Products'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredSuppliers.map(supplier => (
                                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400">
                                                <Truck size={18} />
                                            </div>
                                            {supplier.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{supplier.contactPerson || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{supplier.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                {supplier._count?.products || supplier.productsCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => openEditModal(supplier)}
                                                    className="text-gray-400 hover:text-[#40A45D] dark:hover:text-[#40A45D]"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedSupplier(supplier); setIsDeleteModalOpen(true); }}
                                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
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
                                {isEditModalOpen ? (t(language, 'editSupplier') || 'Edit Supplier') : (t(language, 'addSupplier') || 'Add Supplier')}
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
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'companyName') || 'Company Name'} *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'contactPerson') || 'Contact Person'}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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


                            {formError && <p className="text-red-500 text-xs">{formError}</p>}

                            <button
                                type="submit"
                                className="w-full py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50] font-medium"
                            >
                                {isEditModalOpen ? (t(language, 'saveChanges') || 'Save Changes') : (t(language, 'addSupplier') || 'Add Supplier')}
                            </button>
                        </form>
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
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteSupplier') || 'Delete Supplier'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t(language, 'deleteSupplierConfirm') || 'Are you sure you want to delete this supplier?'}
                        </p>
                        {(selectedSupplier?._count?.products > 0 || selectedSupplier?.productsCount > 0) && (
                            <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-3 rounded-lg text-sm mb-6 text-left flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>{t(language, 'supplierHasProductsWarning') || 'Warning: This supplier has associated products. You cannot delete them.'}</p>
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
                                disabled={selectedSupplier?._count?.products > 0 || selectedSupplier?.productsCount > 0}
                                className={`px-6 py-2 text-white rounded-lg font-medium ${(selectedSupplier?._count?.products > 0 || selectedSupplier?.productsCount > 0) ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
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

export default Suppliers;
