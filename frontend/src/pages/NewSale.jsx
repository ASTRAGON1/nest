import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Printer, CheckCircle, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';  // ✅ ADD THIS
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import { printReceipt, printInvoice } from '../utils/receiptGenerator';
import CustomSelect from '../components/CustomSelect';
import InvoicePromptModal from '../components/InvoicePromptModal';

const NewSale = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { user } = useAuth();  // ✅ ADD THIS
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Cart
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [customerId, setCustomerId] = useState(null);  // ✅ FIX:  null instead of ''
    const [temporaryCustomerName, setTemporaryCustomerName] = useState('');

    // Checkout State
    const [processing, setProcessing] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [isInvoicePromptOpen, setIsInvoicePromptOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch products and customers without user ID filtering
                const [productsRes, customersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);

                const availableProducts = productsRes.data.filter(p => p.quantity > 0);
                setProducts(availableProducts);
                setFilteredProducts(availableProducts);
                setCustomers(customersRes.data);
            } catch (err) {
                console.error('Failed to fetch data', err);
                console.error('API Error Response:', err.response?.data);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            const availableProducts = res.data.filter(p => p.quantity > 0);
            setProducts(availableProducts);
            setFilteredProducts(availableProducts);
        } catch (err) {
            console.error('Failed to fetch products', err);
        }
    };

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
            if (existingItem.quantity >= product.quantity) {
                alert(t(language, 'maxStockReached') || 'Max stock reached');
                return;
            }
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
                if (newQty > item.maxStock) {
                    alert(t(language, 'maxStockReached') || 'Max stock reached');
                    return item;
                }
                return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const change = amountPaid ? (parseFloat(amountPaid) - cartTotal).toFixed(2) : '0.00';

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // ✅ VALIDATE CUSTOMER SELECTED
        if (!customerId || (customerId === 'temp' && !temporaryCustomerName.trim())) {
            alert(t(language, 'customerRequired') || 'Please select a customer or enter a name before completing sale');
            return;
        }

        // ✅ FIX: Validate user exists
        if (!user || !user.id) {
            alert('User not authenticated. Please log in again.');
            navigate('/');
            return;
        }

        setProcessing(true);

        try {
            const finalAmountPaid = amountPaid ? parseFloat(amountPaid) : (paymentMethod === 'Check' ? cartTotal : 0);

            const payload = {
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.unitPrice * item.quantity,
                    // Backend also needs these for SaleItem:
                    name: item.productName,
                    brand: item.brand
                })),
                totalAmount: cartTotal,
                paymentMethod,
                amountPaid: finalAmountPaid,
                customerId: customerId !== 'temp' ? parseInt(customerId) : null,
                temporaryCustomer: customerId === 'temp' ? temporaryCustomerName.trim() : null,
                userId: user.id  // ✅ FIX: From AuthContext
            };

            console.log('Sale payload:', payload);  // Debug

            const res = await api.post('/sales', payload);

            // The backend returns the base sale object. We inject items and customer data
            // into it so the receipt generator has all the details immediately.
            const selectedCustomer = customers.find(c => c.id.toString() === customerId?.toString());
            const enrichedReceipt = {
                ...res.data,
                saleItems: cart.map(item => ({
                    productName: item.productName,
                    name: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.unitPrice * item.quantity
                })),
                customer: {
                    name: customerId === 'temp' ? temporaryCustomerName.trim() : (selectedCustomer ? selectedCustomer.name : 'Walk-in')
                }
            };

            setReceipt(enrichedReceipt);
            setCart([]);
            setAmountPaid('');
            setCustomerId(null);  // ✅ FIX: Reset to null
            setTemporaryCustomerName('');
            fetchProducts(); // Refresh stock
        } catch (err) {
            console.error('Checkout failed', err);
            alert(err.response?.data?.error || t(language, 'checkoutFailed') || 'Checkout failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/sales')} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'newSale') || 'New Sale'}</h1>
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
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">{t(language, 'stock') || 'Stock'}:  {product.quantity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Cart */}
                <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 flex flex-col shrink-0 shadow-lg z-10">
                    {/* Customer Selection */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 block flex items-center gap-1">
                            <User size={14} />
                            {t(language, 'customer') || 'Customer'} <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                            value={customerId || ''}
                            onChange={(value) => setCustomerId(value)}
                            options={[
                                { value: '', label: t(language, 'walkInCustomer') || 'Walk-in Customer' },
                                { value: 'temp', label: t(language, 'temporaryClient') || 'Client Passager' },
                                ...customers.map(c => ({ value: c.id.toString(), label: c.name }))
                            ]}
                            placeholder={t(language, 'selectCustomer') || 'Select Customer'}
                            className={`${(!customerId || (customerId === 'temp' && !temporaryCustomerName.trim())) && cart.length > 0 ? 'border-red-300 ring-2 ring-red-100 dark:ring-red-900/30 rounded-xl' : ''}`}
                        />
                        {customerId === 'temp' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    placeholder={t(language, 'enterClientName') || 'Enter client name...'}
                                    value={temporaryCustomerName}
                                    onChange={(e) => setTemporaryCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                            </div>
                        )}
                        {(!customerId || (customerId === 'temp' && !temporaryCustomerName.trim())) && cart.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                {t(language, 'customerRequired') || 'Customer selection required'}
                            </p>
                        )}
                    </div>

                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <ShoppingCart size={20} />
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
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                            <span>{t(language, 'subtotal') || 'Subtotal'}</span>
                            <span className="font-medium">{cartTotal.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPaymentMethod('Cash')}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border ${paymentMethod === 'Cash' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                            >
                                {t(language, 'cash') || 'Cash'}
                            </button>
                            <button
                                onClick={() => { setPaymentMethod('Check'); setAmountPaid(cartTotal.toFixed(2)); }}
                                className={`py-2 px-3 rounded-lg text-sm font-medium border ${paymentMethod === 'Check' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                            >
                                {t(language, 'check') || 'Check'}
                            </button>
                        </div>

                        {(paymentMethod === 'Cash' || paymentMethod === 'Check') && (
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t(language, 'amountPaid') || 'Amount Paid'}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={amountPaid}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (e.target.value === '' || val <= cartTotal) {
                                                setAmountPaid(e.target.value);
                                            } else {
                                                setAmountPaid(cartTotal.toFixed(2));
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                        placeholder="0.00"
                                        step="0.01"
                                        max={cartTotal}
                                    />
                                </div>
                                {paymentMethod === 'Cash' && amountPaid && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className={parseFloat(change) < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
                                            {parseFloat(change) < 0 ? (t(language, 'remaining') || 'Remaining') : (t(language, 'change') || 'Change')}
                                        </span>
                                        <span className={`font-bold ${parseFloat(change) < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                            {parseFloat(change) < 0 ? Math.abs(parseFloat(change)).toFixed(2) : change}
                                        </span>
                                    </div>
                                )}
                                {paymentMethod === 'Check' && (
                                    <p className="text-xs text-blue-500 dark:text-blue-400">{t(language, 'checkPaymentNote') || 'Payment by check — amount will be collected at the bank.'}</p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>{t(language, 'total') || 'Total'}</span>
                            <span>{cartTotal.toFixed(2)} DH</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || !customerId || processing}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${cart.length === 0 || !customerId || processing
                                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                                : 'bg-[#40A45D] hover:bg-[#368f50]'
                                }`}
                        >
                            {processing ? t(language, 'processing') || 'Processing...' : t(language, 'completeSale') || 'Complete Sale'}
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
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'saleCompleted') || 'Sale Completed!'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 font-mono text-sm">{receipt.receiptNumber}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => printReceipt(receipt, language)}
                                className="w-full py-2 px-4 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium flex items-center justify-center gap-2"
                            >
                                <Printer size={18} />
                                {t(language, 'printReceipt') || 'Print Delivery Note'}
                            </button>
                            <button
                                onClick={() => setIsInvoicePromptOpen(true)}
                                className="w-full py-2 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium flex items-center justify-center gap-2"
                            >
                                <Printer size={18} />
                                {t(language, 'printInvoice') || 'Print Invoice'}
                            </button>
                            <button
                                onClick={() => { setReceipt(null); navigate('/sales'); }}
                                className="w-full py-2 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium"
                            >
                                {t(language, 'backToSales') || 'Back to Sales List'}
                            </button>
                            <button
                                onClick={() => setReceipt(null)}
                                className="w-full py-2 px-4 text-[#40A45D] font-medium hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg"
                            >
                                {t(language, 'startNewSale') || 'Start New Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <InvoicePromptModal
                isOpen={isInvoicePromptOpen}
                onClose={() => setIsInvoicePromptOpen(false)}
                onGenerate={(invoiceData) => {
                    printInvoice(receipt, language, invoiceData);
                }}
            />
        </div>
    );
};

export default NewSale;