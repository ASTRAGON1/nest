import React, { useEffect, useState, useCallback } from 'react';
import { dashboardService, productService } from '../services/api';
import PropTypes from 'prop-types';

import {
    ShoppingCart,
    DollarSign,
    Package,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    Plus,
    BarChart3,
    Clock,
    FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { DATE_RANGES } from '../utils/constants';

const Dashboard = () => {
    const { language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    // Analytics state
    const [dateRange, setDateRange] = useState(DATE_RANGES.MONTH);
    const [salesTrendData, setSalesTrendData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [analyticsMetrics, setAnalyticsMetrics] = useState({
        totalSales: 0,
        totalRevenue: 0,
        avgOrderValue: 0
    });

    // Chart visibility state
    const [visibleSeries, setVisibleSeries] = useState({
        quantity: true,
        revenue: true
    });

    const toggleSeries = useCallback((e) => {
        const { dataKey } = e;
        setVisibleSeries(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey]
        }));
    }, []);

    const getDateRange = useCallback(() => {
        const now = new Date();
        let from, to;

        switch (dateRange) {
            case DATE_RANGES.WEEK:
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case DATE_RANGES.MONTH:
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case DATE_RANGES.QUARTER:
                from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case DATE_RANGES.YEAR:
                from = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                from = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        to = now;
        return { from, to };
    }, [dateRange]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const { from, to } = getDateRange();
            const fromStr = from.toISOString();
            const toStr = to.toISOString();

            const data = await dashboardService.getAnalytics({
                from: fromStr,
                to: toStr
            });

            if (data) {
                setAnalyticsMetrics(data.metrics);
                setSalesTrendData(data.salesTrend);
                setTopProducts(data.topProducts);
            }

        } catch (err) {
            console.error('Analytics fetch error:', err);
        }
    }, [getDateRange]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dashboardService.getSummary();
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(t(language, 'failedToLoadData'));
                setLoading(false);
            }
        };

        fetchData();
    }, [language]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#40A45D]"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center p-8">{error}</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t(language, 'dashboard')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t(language, 'dailyOverview')} {(() => {
                            const date = new Date();
                            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                        })()}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/products"
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        {t(language, 'products')}
                    </Link>
                    <Link
                        to="/sales/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                        <ShoppingCart size={18} />
                        {t(language, 'newSale')}
                    </Link>
                    <Link
                        to="/estimation"
                        className="flex items-center gap-2 px-4 py-2 bg-[#40A45D] text-white rounded-lg hover:bg-[#358a4d] transition-colors shadow-md hover:shadow-lg"
                    >
                        <FileText size={18} />
                        {t(language, 'newEstimation') || 'New Estimation'}
                    </Link>
                </div>
            </div>

            {/* Unpaid Invoices Alert */}
            {stats.unpaidCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg text-red-600 dark:text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800 dark:text-red-200">{t(language, 'unpaidPresent') || 'Unpaid Invoices'}</h3>
                            <p className="text-red-600 dark:text-red-300 text-sm">
                                {t(language, 'youHave') || 'You have'} <span className="font-bold">{stats.unpaidCount}</span> {t(language, 'unpaidInvoices') || 'unpaid invoices'} {t(language, 'totaling') || 'totaling'} <span className="font-bold">{stats.totalDue?.toFixed(2)} {t(language, 'currency')}</span>
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/sales"
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm shadow-sm"
                    >
                        {t(language, 'viewInvoices') || 'View Invoices'}
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t(language, 'totalRevenue')}
                    value={`${stats.revenue?.toFixed(2) || '0.00'} ${t(language, 'currency')}`}
                    icon={DollarSign}
                    trend={null}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    language={language}
                />
                <StatCard
                    title={t(language, 'salesCount')}
                    value={stats.salesCount || 0}
                    icon={ShoppingCart}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    language={language}
                />
                <StatCard
                    title={t(language, 'totalProducts')}
                    value={stats.totalProducts || 0}
                    icon={Package}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    language={language}
                />
                <StatCard
                    title={t(language, 'lowStockItems')}
                    value={stats.lowStockProducts?.length || 0}
                    icon={AlertTriangle}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    language={language}
                />
            </div>

            {/* Analytics Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'analytics') || 'Analytics'}</h2>
                    <div className="flex gap-2">
                        {[
                            { key: DATE_RANGES.WEEK, label: t(language, 'last7Days') || 'Last 7 Days' },
                            { key: DATE_RANGES.MONTH, label: t(language, 'thisMonth') || 'This Month' },
                            { key: DATE_RANGES.QUARTER, label: t(language, 'quarter') || 'Quarter' },
                            { key: DATE_RANGES.YEAR, label: t(language, 'year') || 'Year' }
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setDateRange(opt.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === opt.key
                                    ? 'bg-[#40A45D] text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analytics Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'totalSales') || 'Total Sales'}</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{analyticsMetrics.totalSales}</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                                <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'totalRevenue') || 'Total Revenue'}</p>
                                <p className="text-2xl font-bold text-[#40A45D] mt-1">{analyticsMetrics.totalRevenue.toFixed(2)} {t(language, 'currency')}</p>
                            </div>
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
                                <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'avgOrderValue') || 'Avg Order Value'}</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{analyticsMetrics.avgOrderValue.toFixed(2)} {t(language, 'currency')}</p>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                                <Clock size={24} className="text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Trend Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t(language, 'salesTrend') || 'Sales Trend'}</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={salesTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#40A45D"
                                        strokeWidth={2}
                                        dot={{ fill: '#40A45D', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Selling Products Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t(language, 'topSellingProducts') || 'Top Selling Products'}</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={80} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend onClick={toggleSeries} cursor="pointer" />
                                    <Bar
                                        dataKey="quantity"
                                        fill="#3b82f6"
                                        name={t(language, 'quantitySold') || 'Quantity Sold'}
                                        hide={!visibleSeries.quantity}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#22c55e"
                                        name={t(language, 'revenue') || 'Revenue (DH)'}
                                        hide={!visibleSeries.revenue}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Sales */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-[#40A45D]" />
                            {t(language, 'recentSales')}
                        </h3>
                        <Link to="/sales" className="text-sm text-[#40A45D] hover:underline">{t(language, 'viewAll')}</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                    <th className={`pb-3 ${language === 'ar' ? 'pr-2' : 'pl-2'}`}>{t(language, 'receipt')}</th>
                                    <th className="pb-3">{t(language, 'customer')}</th>
                                    <th className="pb-3">{t(language, 'items')}</th>
                                    <th className="pb-3">{t(language, 'total')}</th>
                                    <th className="pb-3">{t(language, 'time')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.recentSales && stats.recentSales.length > 0 ? (
                                    stats.recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className={`py-4 font-medium text-gray-900 dark:text-white ${language === 'ar' ? 'pr-2' : 'pl-2'}`}>{sale.receiptNumber}</td>
                                            <td className="py-4 text-gray-600 dark:text-gray-300">{sale.customer}</td>
                                            <td className="py-4 text-gray-600 dark:text-gray-300">{sale.items} {t(language, 'items').toLowerCase()}</td>
                                            <td className="py-4 font-bold text-[#40A45D]">{sale.amount?.toFixed(2)} {t(language, 'currency')}</td>
                                            <td className="py-4 text-gray-400 dark:text-gray-500 text-sm">
                                                {new Date(sale.date).toLocaleTimeString('en-US', { hour12: false })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-400">{t(language, 'noSalesToday')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            {t(language, 'lowStockAlerts')}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <LowStockList language={language} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, trend, color, bg, language }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight size={14} />
                        {trend} {t(language, 'vsLastWeek')}
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    trend: PropTypes.string,
    color: PropTypes.string,
    bg: PropTypes.string,
    language: PropTypes.string.isRequired
};

const LowStockList = ({ language }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                const data = await productService.getLowStock();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load low stock", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLowStock();
    }, []);

    if (loading) return <div className="text-center py-4 text-gray-400">{t(language, 'checkingInventory')}</div>;

    if (products.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <p>{t(language, 'stockHealthy')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{product.name}</p>
                        <p className="text-xs text-red-500 dark:text-red-400 font-medium">{product.quantity} {t(language, 'remaining')}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
                        {t(language, 'restock')}
                    </button>
                </div>
            ))}
            {products.length > 5 && (
                <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-[#40A45D] mt-2">
                    {t(language, 'viewAllItems').replace('{count}', products.length)}
                </Link>
            )}
        </div>
    );
};

LowStockList.propTypes = {
    language: PropTypes.string.isRequired
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <p className="font-bold text-gray-800 dark:text-white mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color || entry.fill }}
                            />
                            <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
    label: PropTypes.string
};

export default Dashboard;
