import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Printer, CheckCircle, FileText } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { printReceipt } from '../utils/receiptGenerator';

const Estimation = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Cart
    const [cart, setCart] = useState([]);

    // Checkout State
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsRes = await api.get('/products');
                const availableProducts = productsRes.data.filter(p => p.quantity > 0);
                setProducts(availableProducts);
                setFilteredProducts(availableProducts);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lowerterm = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lowerterm) ||
                (p.category && p.category.name.toLowerCase().includes(lowerterm))
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                brand: product.brand,
                unitPrice: product.sellingPrice,
                quantity: 1,
                subtotal: product.sellingPrice,
                maxStock: product.quantity
            }]);
        }
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                // Don't enforce maxStock for estimation
                return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    const handleGenerateEstimation = () => {
        if (cart.length === 0) return;

        const estimationReceipt = {
            receiptNumber: `EST-${Date.now().toString().slice(-6)}`,
            createdAt: new Date(),
            saleItems: cart.map(item => ({
                productName: item.productName,
                name: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.unitPrice * item.quantity
            })),
            totalAmount: cartTotal,
        };

        setReceipt(estimationReceipt);
        setCart([]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-[#40A45D]" size={24} />
                        {t(language, 'newEstimation') || 'New Estimation'}
                    </h1>
                </div>
                <div className="w-1/3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(language, 'searchProducts') || 'Search products...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Column:  Products Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 max-h-full">
                    {loading ? (
                        <div className="text-center p-12 text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center p-12 text-gray-500 dark:text-gray-400">{t(language, 'noProductsFound') || 'No products found'}</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                                >
                                    <div className="h-24 w-full bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <div className="text-2xl font-bold capitalize">{product.name.charAt(0)}</div>
                                    </div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 truncate">{product.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.brand}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-[#40A45D]">{product.sellingPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Cart */}
                <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 flex flex-col shrink-0 shadow-lg z-10">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-700/30">
                        <ShoppingCart size={20} className="text-[#40A45D]" />
                        {t(language, 'currentOrder') || 'Current Order'}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                <ShoppingCart size={48} className="opacity-20" />
                                <p>{t(language, 'cartEmpty') || 'Cart is empty'}</p>
                                <p className="text-sm text-center px-8">{t(language, 'cartEmptyDesc') || 'Select products from the list to add them to the order.'}</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800 dark:text-gray-200">{item.productName}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.unitPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium text-gray-800 dark:text-gray-200">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="text-red-400 hover:text-red-500 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>{t(language, 'total') || 'Total'}</span>
                            <span>{cartTotal.toFixed(2)} DH</span>
                        </div>

                        <button
                            onClick={handleGenerateEstimation}
                            disabled={cart.length === 0}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${cart.length === 0
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                                : 'bg-[#40A45D] hover:bg-[#368f50]'
                                }`}
                        >
                            {t(language, 'printEstimation') || 'Print Estimation'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {receipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'estimationCompleted') || 'Estimation Completed!'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 font-mono text-sm">{receipt.receiptNumber}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => printReceipt(receipt, language, true)}
                                className="w-full py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center justify-center gap-2 bg-[#40A45D]/10 text-[#40A45D] border-[#40A45D]/30"
                            >
                                <Printer size={18} />
                                {t(language, 'printEstimation') || 'Print Estimation'}
                            </button>
                            <button
                                onClick={() => { setReceipt(null); navigate('/dashboard'); }}
                                className="w-full py-2 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
                            >
                                {t(language, 'dashboard') || 'Dashboard'}
                            </button>
                            <button
                                onClick={() => setReceipt(null)}
                                className="w-full py-2 px-4 text-[#40A45D] font-medium hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg"
                            >
                                {t(language, 'startNewEstimation') || 'Start New Estimation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estimation;
