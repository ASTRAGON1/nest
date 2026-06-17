import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, PieChart } from 'lucide-react';
import { reportService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const Reports = () => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(false);

    // Filters
    const [range, setRange] = useState('month'); // today, week, month, year

    // Data
    const [salesData, setSalesData] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [profitData, setProfitData] = useState(null);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const getDates = () => {
                    const today = new Date();
                    let from = new Date();
                    let to = new Date();

                    if (range === 'today') {
                        from.setHours(0, 0, 0, 0);
                        to.setHours(23, 59, 59, 999);
                    } else if (range === 'week') {
                        from.setDate(today.getDate() - 7);
                        from.setHours(0, 0, 0, 0);
                        to.setHours(23, 59, 59, 999);
                    } else if (range === 'month') {
                        from.setDate(1); // Start of month
                        from.setHours(0, 0, 0, 0);
                        to.setHours(23, 59, 59, 999);
                    } else if (range === 'year') {
                        from.setMonth(0, 1); // Start of year
                        from.setHours(0, 0, 0, 0);
                        to.setHours(23, 59, 59, 999);
                    }

                    return { from: from.toISOString(), to: to.toISOString() };
                };

                const { from, to } = getDates();
                const dateRange = { from, to };

                if (activeTab === 'sales') {
                    const data = await reportService.getSales(dateRange);
                    setSalesData(data);
                } else if (activeTab === 'inventory') {
                    const data = await reportService.getInventory();
                    setInventoryData(data);
                } else if (activeTab === 'profit') {
                    const data = await reportService.getProfit(dateRange);
                    setProfitData(data);
                }
            } catch (err) {
                console.error('Failed to fetch report', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [activeTab, range]);



    const renderSalesTab = () => {
        if (!salesData) return null;
        const { summary, paymentMethods, bestSellers } = salesData;

        return (
            <div className="space-y-6">
                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalSales') || 'Total Sales'}</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{summary?.totalSales || 0}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalRevenue') || 'Total Revenue'}</p>
                        <h3 className="text-2xl font-bold text-[#40A45D]">{summary?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalProfit') || 'Total Profit'}</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.totalProfit?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'averageOrder') || 'Average Order'}</p>
                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary?.averageOrderValue?.toFixed(2) || '0.00'}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t(language, 'paymentBreakdown') || 'Payment Method Breakdown'}</h3>
                        <div className="space-y-4">
                            {paymentMethods?.map((stat, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{stat.method || 'Unknown'}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-white">{stat.count} {t(language, 'orders') || 'Orders'}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{stat.amount?.toFixed(2) || '0.00'}</div>
                                    </div>
                                </div>
                            )) || <p className="text-gray-400 text-center">{t(language, 'noData')}</p>}
                        </div>
                    </div>

                    {/* Best Sellers */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t(language, 'topProducts') || 'Top Selling Products'}</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {bestSellers?.map((prod, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{prod.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-white">{prod.quantity} Sold</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{prod.revenue?.toFixed(2)} Revenue</div>
                                    </div>
                                </div>
                            )) || <p className="text-gray-400 text-center">{t(language, 'noData')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInventoryTab = () => {
        if (!inventoryData) return null;
        const { summary } = inventoryData;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'totalItems') || 'Total Unique Items'}</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{summary?.totalItems || 0}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'inventoryValue') || 'Total Inventory Value'}</p>
                        <h3 className="text-2xl font-bold text-[#40A45D]">{summary?.totalValue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'lowStock') || 'Low Stock Items'}</p>
                        <h3 className="text-2xl font-bold text-orange-500">{summary?.lowStock || 0}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'outOfStock') || 'Out of Stock'}</p>
                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{summary?.outOfStock || 0}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t(language, 'inventoryDetails') || 'Inventory Details'}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'productName') || 'Product Name'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'category') || 'Category'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'stock') || 'Stock'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'value') || 'Value'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'status') || 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {inventoryData.products.slice(0, 50).map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{p.category || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{p.quantity}</td>
                                        <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{p.totalValue.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            {p.quantity === 0 ? (
                                                <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-bold">{t(language, 'outOfStock') || 'Out of Stock'}</span>
                                            ) : p.quantity <= p.minStockLevel ? (
                                                <span className="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded text-xs font-bold">{t(language, 'lowStock') || 'Low Stock'}</span>
                                            ) : (
                                                <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-bold">{t(language, 'inStock') || 'In Stock'}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderProfitTab = () => {
        if (!profitData) return null;
        const { summary, byCategory, mostProfitable } = profitData;

        return (
            <div className="space-y-6">
                <div className="flex gap-4 mb-4 items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-800 dark:text-blue-300 text-sm">
                    <PieChart size={20} />
                    <p>
                        {t(language, 'profitNote') || 'Profit is calculated as (Selling Price - Purchase Price) * Quantity Sold. It does not account for operating expenses.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'grossRevenue') || 'Gross Revenue'}</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{summary?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'costOfGoods') || 'Cost of Goods'}</p>
                        <h3 className="text-2xl font-bold text-red-500 dark:text-red-400">{summary?.totalCost?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'netProfit') || 'Net Profit'}</p>
                        <h3 className="text-2xl font-bold text-[#40A45D]">{summary?.netProfit?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t(language, 'profitMargin') || 'Profit Margin'}</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.margin?.toFixed(2) || '0.00'}%</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t(language, 'profitByCategory') || 'Profit by Category'}</h3>
                        <div className="space-y-4">
                            {byCategory?.map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.category}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-[#40A45D]">{cat.profit?.toFixed(2)}</div>
                                    </div>
                                </div>
                            )) || <p className="text-gray-400 text-center">{t(language, 'noData')}</p>}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t(language, 'mostProfitableProducts') || 'Most Profitable Products'}</h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {mostProfitable?.map((prod, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2 last:border-0">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{prod.name}</span>
                                    <span className="font-bold text-[#40A45D]">{prod.profit?.toFixed(2)}</span>
                                </div>
                            )) || <p className="text-gray-400 text-center">{t(language, 'noData')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'reports') || 'Reports'}</h1>
            </div>

            {/* Filters & Tabs */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'sales' ? 'bg-[#40A45D] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <TrendingUp size={18} />
                        {t(language, 'salesReport') || 'Sales Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'inventory' ? 'bg-[#40A45D] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <Package size={18} />
                        {t(language, 'inventoryReport') || 'Inventory Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('profit')}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'profit' ? 'bg-[#40A45D] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <DollarSign size={18} />
                        {t(language, 'profitReport') || 'Profit Report'}
                    </button>
                </div>

                {activeTab !== 'inventory' && (
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                            {['today', 'week', 'month', 'year'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${range === r ? 'bg-[#40A45D] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                                >
                                    {t(language, r) || r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center p-12 text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
            ) : (
                <>
                    {activeTab === 'sales' && renderSalesTab()}
                    {activeTab === 'inventory' && renderInventoryTab()}
                    {activeTab === 'profit' && renderProfitTab()}
                </>
            )}
        </div>
    );
};

export default Reports;
