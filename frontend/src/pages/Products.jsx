import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Trash2, Edit, ChevronLeft, ChevronRight, X, AlertTriangle, Download, Upload, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import api, { supplierService } from '../services/api';
// import { t } from '../utils/translations'; // Assuming translation utility exists or I should use it. 
// For now I'll hardcode strings or use a simple mock `t` if context not available, 
// but plan says "Add translations...". I'll use text for now and refactor for translations later 
// or I can import the hook. I'll try to use the hook if I can find it.
// I saw `useLanguage` in `LanguageContext`.
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import CustomSelect from '../components/CustomSelect';
import { PAGINATION_OPTIONS, MIN_STOCK_THRESHOLD } from '../utils/constants';

const Products = () => {
    const { language } = useLanguage();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc, quantity-asc, quantity-desc, name-asc

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(PAGINATION_OPTIONS[0]);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productHistory, setProductHistory] = useState([]);

    // Form State
    const initialFormState = {
        name: '',
        brand: '',
        categoryId: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        minStockLevel: MIN_STOCK_THRESHOLD.toString(),
        description: '',
        supplierId: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchCategories();
        fetchSuppliers();
        fetchProducts();
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch Data
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await supplierService.getAll();
            setSuppliers(data);
        } catch (err) {
            console.error('Failed to fetch suppliers', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetching all products to handle client-side sorting/pagination since API is limited
            const res = await api.get('/products');
            setProducts(res.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch products', err);
            setError(t(language, 'errorFetchingData') || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Derived State (Filter -> Sort -> Paginate)
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.categoryId === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc': return a.sellingPrice - b.sellingPrice;
            case 'price-desc': return b.sellingPrice - a.sellingPrice;
            case 'quantity-asc': return a.quantity - b.quantity;
            case 'quantity-desc': return b.quantity - a.quantity;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'newest': default: return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handlers
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };



    const openAddModal = () => {
        setFormData(initialFormState);
        setFormErrors({});
        setIsAddModalOpen(true);
    };

    const openEditModal = (product) => {
        setFormData({
            ...product,
            categoryId: product.categoryId.toString(),
            supplierId: product.supplierId ? product.supplierId.toString() : ''
        });
        setSelectedProduct(product);
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = t(language, 'fieldRequired') || 'Name is required';
        if (!formData.categoryId) errors.categoryId = t(language, 'fieldRequired') || 'Category is required';
        if (!formData.purchasePrice || formData.purchasePrice <= 0) errors.purchasePrice = t(language, 'fieldRequired') || 'Valid price required';
        if (!formData.sellingPrice || formData.sellingPrice <= 0) errors.sellingPrice = t(language, 'fieldRequired') || 'Valid price required';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (isEditModalOpen) {
                await api.put(`/products/${selectedProduct.id}`, formData);
                setIsEditModalOpen(false);
            } else {
                await api.post('/products', formData);
                setIsAddModalOpen(false);
            }
            fetchProducts();
        } catch (err) {
            console.error('Operation failed', err);
            // alert('Operation failed'); 
        }
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;
        try {
            await api.delete(`/products/${selectedProduct.id}`);
            setIsDeleteModalOpen(false);
            fetchProducts();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const openHistoryModal = async (product) => {
        setSelectedProduct(product);
        try {
            const res = await api.get(`/products/${product.id}/history`);
            setProductHistory(res.data);
            setIsHistoryModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    const formatHistoryAction = (action) => {
        const actions = {
            'created': { label: t(language, 'actionCreated') || 'Created', color: 'bg-green-100 text-green-800' },
            'updated': { label: t(language, 'actionUpdated') || 'Updated', color: 'bg-blue-100 text-blue-800' },
            'stock_added': { label: t(language, 'actionStockAdded') || 'Stock Added', color: 'bg-purple-100 text-purple-800' },
            'stock_reduced': { label: t(language, 'actionStockReduced') || 'Stock Reduced', color: 'bg-orange-100 text-orange-800' },
            'deleted': { label: t(language, 'actionDeleted') || 'Deleted', color: 'bg-red-100 text-red-800' }
        };
        return actions[action] || { label: t(language, action) || action, color: 'bg-gray-100 text-gray-800' };
    };

    const handleExport = async () => {
        try {
            const res = await api.get('/products/data/export');
            const ws = XLSX.utils.json_to_sheet(res.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Products");
            XLSX.writeFile(wb, "products_export.xlsx");
        } catch (err) {
            console.error('Export failed', err);
            alert(t(language, 'exportFailed') || 'Export failed');
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    alert(t(language, 'noDataFound') || 'No data found in file');
                    return;
                }

                await api.post('/products/data/import', { products: data });
                alert(t(language, 'importSuccess') || 'Products imported successfully');
                fetchProducts();
            } catch (err) {
                console.error('Import failed', err);
                alert(t(language, 'importFailed') || 'Import failed');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Helper for Profit Margin
    const calculateMargin = (sell, buy) => {
        if (!sell || !buy) return 0;
        return (((sell - buy) / sell) * 100).toFixed(1);
    };

    // Helper for Quantity Color
    const getQuantityColor = (qty, min = MIN_STOCK_THRESHOLD) => {
        if (qty === 0) return 'text-red-600 bg-red-50';
        if (qty < min) return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'products') || 'Products'}</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'addProduct') || 'Add Product'}
                </button>
            </div>

            <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Download size={18} />
                    {t(language, 'export') || 'Export'}
                </button>
                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Upload size={18} />
                        {t(language, 'import') || 'Import'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchProducts') || 'Search products...'}
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-48">
                        <CustomSelect
                            value={selectedCategory}
                            onChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}
                            options={[
                                { value: 'All', label: t(language, 'allCategories') || 'All Categories' },
                                ...categories.map(cat => ({ value: cat.id.toString(), label: t(language, cat.name) || cat.name }))
                            ]}
                            placeholder={t(language, 'filterByCategory')}
                            icon={Filter}
                        />
                    </div>

                    <div className="w-48">
                        <CustomSelect
                            value={sortBy}
                            onChange={(value) => { setSortBy(value); setCurrentPage(1); }}
                            options={[
                                { value: 'newest', label: t(language, 'newest') || 'Newest' },
                                { value: 'price-asc', label: t(language, 'priceLowToHigh') || 'Price: Low to High' },
                                { value: 'price-desc', label: t(language, 'priceHighToLow') || 'Price: High to Low' },
                                { value: 'quantity-asc', label: t(language, 'quantityLowToHigh') || 'Quantity: Low to High' },
                                { value: 'quantity-desc', label: t(language, 'quantityHighToLow') || 'Quantity: High to Low' },
                                { value: 'name-asc', label: t(language, 'name') || 'Name' }
                            ]}
                            placeholder={t(language, 'sortBy')}
                        />
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center text-gray-400">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <Search size={32} />
                        </div>
                        <p>{t(language, 'noProductsFound') || 'No products found'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'productName') || 'Product Name'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'category') || 'Category'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'price') || 'Price'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'quantity') || 'Stock'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {product.sellingPrice.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuantityColor(product.quantity, product.minStockLevel)}`}>
                                                {product.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="text-gray-400 hover:text-[#40A45D]"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(product)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openHistoryModal(product)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                    title={t(language, 'history') || 'History'}
                                                >
                                                    <History size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t(language, 'showing') || 'Showing'} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t(language, 'to') || 'to'} <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedProducts.length)}</span> {t(language, 'of') || 'of'} <span className="font-medium">{sortedProducts.length}</span> {t(language, 'results') || 'results'}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-400"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-400"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {isEditModalOpen ? (t(language, 'editProduct') || 'Edit Product') : (t(language, 'addNewProduct') || 'Add New Product')}
                            </h2>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'productName') || 'Product Name'} *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"

                                    />
                                    {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'brand') || 'Brand'}</label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"

                                    />
                                </div>

                                <div>
                                    <CustomSelect
                                        label={`${t(language, 'category') || 'Category'} *`}
                                        value={formData.categoryId}
                                        onChange={(value) => setFormData({ ...formData, categoryId: value })}
                                        options={[{ value: '', label: t(language, 'selectCategory') || 'Select Category' }, ...categories.map(cat => ({ value: cat.id.toString(), label: t(language, cat.name) || cat.name }))].filter(opt => opt.value !== '')}
                                        placeholder={t(language, 'selectCategory') || 'Select Category'}
                                    />
                                    {formErrors.categoryId && <p className="text-red-500 text-xs mt-1">{formErrors.categoryId}</p>}
                                </div>

                                <div>
                                    <CustomSelect
                                        label={t(language, 'supplier') || 'Supplier'}
                                        value={formData.supplierId}
                                        onChange={(value) => setFormData({ ...formData, supplierId: value })}
                                        options={[{ value: '', label: t(language, 'noSupplier') || 'No Supplier' }, ...suppliers.map(s => ({ value: s.id.toString(), label: s.name }))]}
                                        placeholder={t(language, 'selectSupplier') || 'Select Supplier'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'quantity') || 'Initial Quantity'}</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'purchasePrice') || 'Purchase Price'} *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        placeholder="0.00"
                                    />
                                    {formErrors.purchasePrice && <p className="text-red-500 text-xs">{formErrors.purchasePrice}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'sellingPrice') || 'Selling Price'} *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        placeholder="0.00"
                                    />
                                    {formErrors.sellingPrice && <p className="text-red-500 text-xs">{formErrors.sellingPrice}</p>}
                                </div>
                            </div>

                            {/* Profit Visual */}
                            {formData.purchasePrice && formData.sellingPrice && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl flex justify-between items-center text-sm">
                                    <span className="text-blue-700 dark:text-blue-300">Estimated Profit Margin:</span>
                                    <span className="font-bold text-blue-800 dark:text-blue-200">
                                        {calculateMargin(formData.sellingPrice, formData.purchasePrice)}%
                                    </span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(language, 'description') || 'Description'}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                                    className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                                >
                                    {t(language, 'cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#368f50] font-medium"
                                >
                                    {isEditModalOpen ? (t(language, 'saveChanges') || 'Save Changes') : (t(language, 'createProduct') || 'Create Product')}
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
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteProduct') || 'Delete Product'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t(language, 'deleteProductConfirm') || 'Are you sure you want to delete this product? This action cannot be undone.'}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                            >
                                {t(language, 'cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                            >
                                {t(language, 'delete') || 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {t(language, 'productHistory') || 'Product History'}: {selectedProduct?.name}
                            </h2>
                            <button
                                onClick={() => { setIsHistoryModalOpen(false); setProductHistory([]); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {productHistory.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    {t(language, 'noHistoryFound') || 'No history found'}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {productHistory.map((entry, idx) => {
                                        const actionInfo = formatHistoryAction(entry.action);
                                        return (
                                            <div key={idx} className="flex gap-4 items-start border-l-2 border-gray-200 pl-4 pb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                                                            {actionInfo.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(entry.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {entry.field && (
                                                        <p className="text-sm text-gray-600">
                                                            <span className="font-medium">{t(language, entry.field) || entry.field}</span>: {entry.oldValue || '-'} → {entry.newValue || '-'}
                                                        </p>
                                                    )}
                                                    {entry.quantity && (
                                                        <p className="text-sm text-gray-500">
                                                            {t(language, 'quantityChange') || 'Quantity change'}: {entry.quantity} {t(language, 'units') || 'units'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
