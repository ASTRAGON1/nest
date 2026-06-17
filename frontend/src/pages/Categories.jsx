import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, X, AlertTriangle, Layers } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const Categories = () => {
    const { language } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Form
    const [categoryName, setCategoryName] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            setFilteredCategories(categories.filter(c => c.name.toLowerCase().includes(lower)));
        } else {
            setFilteredCategories(categories);
        }
    }, [searchTerm, categories]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
            setFilteredCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setFormError(t(language, 'fieldRequired') || 'Required');
            return;
        }

        try {
            await api.post('/categories', { name: categoryName });
            setIsAddModalOpen(false);
            setCategoryName('');
            setFormError('');
            fetchCategories();
        } catch (err) {
            console.error('Add failed', err);
            setFormError('Failed to add category');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setFormError(t(language, 'fieldRequired') || 'Required');
            return;
        }

        try {
            await api.put(`/categories/${selectedCategory.id}`, { name: categoryName });
            setIsEditModalOpen(false);
            setCategoryName('');
            setFormError('');
            fetchCategories();
        } catch (err) {
            console.error('Edit failed', err);
            setFormError('Failed to update category');
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;
        try {
            await api.delete(`/categories/${selectedCategory.id}`);
            setIsDeleteModalOpen(false);
            fetchCategories();
        } catch (err) {
            console.error('Delete failed', err);
            // Assuming API returns 400 for constraint violation with message
            if (err.response && err.response.data && err.response.data.error) {
                alert(err.response.data.error);
            } else {
                alert('Failed to delete category');
            }
        }
    };

    const openEditModal = (cat) => {
        setSelectedCategory(cat);
        setCategoryName(cat.name);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (cat) => {
        setSelectedCategory(cat);
        setIsDeleteModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'categories') || 'Categories'}</h1>
                <button
                    onClick={() => { setCategoryName(''); setFormError(''); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'addCategory') || 'Add Category'}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchCategories') || 'Search categories...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center p-12 text-gray-500">{t(language, 'loading') || 'Loading...'}</div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center p-12 text-gray-400">{t(language, 'noCategoriesFound') || 'No categories found'}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredCategories.map(cat => (
                        <div key={cat.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group flex flex-col justify-between h-40">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400">
                                        <Layers size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="text-gray-400 hover:text-[#40A45D]"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(cat)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{cat.name}</h3>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {cat.productCount} {t(language, 'products') || 'Products'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {isEditModalOpen ? (t(language, 'editCategory') || 'Edit Category') : (t(language, 'addCategory') || 'Add Category')}
                            </h2>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={isEditModalOpen ? handleEdit : handleAdd}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t(language, 'categoryName') || 'Category Name'}</label>
                                    <input
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        autoFocus
                                    />
                                    {formError && <p className="text-red-500 text-xs mt-1">{formError}</p>}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50] font-medium"
                                >
                                    {t(language, 'save') || 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteCategory') || 'Delete Category'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t(language, 'deleteCategoryConfirm') || 'Are you sure you want to delete this category?'}
                        </p>
                        {selectedCategory?.productCount > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-3 rounded-lg text-sm mb-6 text-left flex gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>{t(language, 'categoryHasProductsWarning') || 'Warning: This category contains products. You cannot delete it until products are removed or reassigned.'}</p>
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
                                disabled={selectedCategory?.productCount > 0}
                                className={`px-6 py-2 text-white rounded-lg font-medium ${selectedCategory?.productCount > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
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

export default Categories;
