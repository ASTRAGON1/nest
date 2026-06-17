import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Eye, X } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import DateRangePicker from '../components/DateRangePicker';

const Returns = () => {
    const { language } = useLanguage();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateRange, setDateRange] = useState('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const handleDateRangeChange = ({ start, end }) => {
        setCustomFrom(start ? start.toISOString().split('T')[0] : '');
        setCustomTo(end ? end.toISOString().split('T')[0] : '');
    };

    // Details Modal
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const getDateRange = useCallback(() => {
        const today = new Date();
        let from, to;

        switch (dateRange) {
            case 'today':
                from = new Date();
                from.setHours(0, 0, 0, 0);
                to = new Date();
                break;
            case 'week':
                from = new Date();
                from.setDate(today.getDate() - 7);
                from.setHours(0, 0, 0, 0);
                to = new Date();
                to.setHours(23, 59, 59, 999);
                break;
            case 'month':
                from = new Date();
                from.setDate(1);
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

        return { from, to };
    }, [dateRange, customFrom, customTo]);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = getDateRange();
            const params = {};
            if (from) params.from = from.toISOString();
            if (to) params.to = to.toISOString();

            const res = await api.get('/returns', { params });
            setReturns(res.data);
        } catch (err) {
            console.error('Failed to fetch returns', err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const openDetailsModal = (returnRecord) => {
        setSelectedReturn(returnRecord);
        setIsDetailsModalOpen(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const totalRefunds = returns.reduce((sum, r) => sum + r.refundAmount, 0);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'returns') || 'Returns & Refunds'}</h1>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t(language, 'totalReturns') || 'Total Returns'}</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{returns.length}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t(language, 'totalRefunded') || 'Total Refunded'}</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalRefunds.toFixed(2)} {t(language, 'currency')}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full text-orange-600 dark:text-orange-400">
                        <RotateCcw size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2">
                        {['today', 'week', 'month', 'custom'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                    ? 'bg-[#40A45D] text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t(language, range) || range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
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
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                ) : returns.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {t(language, 'noReturnsFound') || 'No returns found'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'date') || 'Date'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'receipt') || 'Receipt'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'customer') || 'Customer'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'reason') || 'Reason'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'refundAmount') || 'Refund'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'method') || 'Method'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {returns.map(returnRecord => (
                                    <tr key={returnRecord.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{formatDate(returnRecord.createdAt)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{returnRecord.sale?.receiptNumber || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{returnRecord.sale?.customer?.name || 'Walk-in'}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{returnRecord.reason}</td>
                                        <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400">{returnRecord.refundAmount.toFixed(2)} {t(language, 'currency')}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                {returnRecord.refundMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => openDetailsModal(returnRecord)}
                                                className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                title={t(language, 'viewDetails') || 'View Details'}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {isDetailsModalOpen && selectedReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t(language, 'returnDetails') || 'Return Details'}</h2>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'receipt') || 'Receipt'}</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedReturn.sale?.receiptNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'date') || 'Date'}</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(selectedReturn.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'refundAmount') || 'Refund'}</p>
                                    <p className="font-bold text-orange-600 dark:text-orange-400">{selectedReturn.refundAmount.toFixed(2)} {t(language, 'currency')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'method') || 'Method'}</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedReturn.refundMethod}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t(language, 'reason') || 'Reason'}</p>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{selectedReturn.reason}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t(language, 'returnedItems') || 'Returned Items'}</p>
                                <div className="space-y-2">
                                    {selectedReturn.returnItems?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-gray-800 dark:text-gray-200">
                                            <span>{item.product?.name || `Product #${item.productId}`}</span>
                                            <span className="text-gray-500 dark:text-gray-400">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;
