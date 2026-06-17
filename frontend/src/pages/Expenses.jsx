import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, X, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';
import DateRangePicker from '../components/DateRangePicker';
import CustomSelect from '../components/CustomSelect';

const EXPENSE_TYPES = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Repairs', 'Other'];

const Expenses = () => {
    const { language } = useLanguage();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ byType: [], total: 0 });

    // Filters
    const [dateRange, setDateRange] = useState('month');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [filterType, setFilterType] = useState('All');

    const handleDateRangeChange = ({ start, end }) => {
        setCustomFrom(toLocalISO(start));
        setCustomTo(toLocalISO(end));
    };

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Date Helper to fix timezone issues
    const toLocalISO = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    // Form
    const initialForm = { type: 'Other', amount: '', date: toLocalISO(new Date()), description: '' };
    const [formData, setFormData] = useState(initialForm);
    const [formError, setFormError] = useState('');

    const getDateRange = useCallback(() => {
        const today = new Date();
        let from, to;

        switch (dateRange) {
            case 'today':
                from = new Date();
                from.setHours(0, 0, 0, 0);
                to = new Date();
                to.setHours(23, 59, 59, 999);
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
            case 'year':
                from = new Date(today.getFullYear(), 0, 1);
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

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const { from, to } = getDateRange();
            const params = {};
            if (from) params.from = from.toISOString();
            if (to) params.to = to.toISOString();
            if (filterType !== 'All') params.type = filterType;

            const res = await api.get('/expenses', { params });
            setExpenses(res.data);
        } catch (err) {
            console.error('Failed to fetch expenses', err);
        } finally {
            setLoading(false);
        }
    }, [getDateRange, filterType]);

    const fetchSummary = useCallback(async () => {
        try {
            const { from, to } = getDateRange();
            const params = {};
            if (from) params.from = from.toISOString();
            if (to) params.to = to.toISOString();

            const res = await api.get('/expenses/summary', { params });
            setSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch summary', err);
        }
    }, [getDateRange]);

    useEffect(() => {
        fetchExpenses();
        fetchSummary();
    }, [fetchExpenses, fetchSummary]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.type || !formData.amount || !formData.date) {
            setFormError('Type, amount and date are required');
            return;
        }

        try {
            await api.post('/expenses', formData);
            setIsAddModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchExpenses();
            fetchSummary();
        } catch (err) {
            console.error('Add failed', err);
            setFormError(err.response?.data?.error || 'Failed to add expense');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!formData.type || !formData.amount || !formData.date) {
            setFormError('Type, amount and date are required');
            return;
        }

        try {
            await api.put(`/expenses/${selectedExpense.id}`, formData);
            setIsEditModalOpen(false);
            setFormData(initialForm);
            setFormError('');
            fetchExpenses();
            fetchSummary();
        } catch (err) {
            console.error('Edit failed', err);
            setFormError(err.response?.data?.error || 'Failed to update expense');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/expenses/${selectedExpense.id}`);
            setIsDeleteModalOpen(false);
            setSelectedExpense(null);
            fetchExpenses();
            fetchSummary();
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const openEditModal = (expense) => {
        setSelectedExpense(expense);
        setFormData({
            type: expense.type,
            amount: expense.amount.toString(),
            date: toLocalISO(expense.date),
            description: expense.description || ''
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (expense) => {
        setSelectedExpense(expense);
        setIsDeleteModalOpen(true);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getTypeColor = (type) => {
        const colors = {
            'Rent': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
            'Utilities': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            'Salaries': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
            'Supplies': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
            'Repairs': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
            'Other': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        };
        return colors[type] || colors['Other'];
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(language, 'expenses') || 'Expenses'}</h1>
                <button
                    onClick={() => { setFormData(initialForm); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-[#40A45D] text-white px-4 py-2 rounded-lg hover:bg-[#368f50] transition-colors"
                >
                    <Plus size={20} />
                    {t(language, 'addExpense') || 'Add Expense'}
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t(language, 'totalExpenses') || 'Total Expenses'}</h2>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full text-red-600 dark:text-red-400">
                        <DollarSign size={24} />
                    </div>
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.total.toFixed(2)} {t(language, 'currency')}</p>

            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {['today', 'week', 'month', 'year', 'custom'].map(range => (
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

                    <div className="w-56">
                        <CustomSelect
                            value={filterType}
                            onChange={setFilterType}
                            options={[
                                { value: 'All', label: t(language, 'allTypes') || 'All Types' },
                                ...EXPENSE_TYPES.map(type => ({ value: type, label: t(language, type.toLowerCase()) || type }))
                            ]}
                            placeholder={t(language, 'allTypes') || 'All Types'}
                        />
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
            </div>

            {/* Expenses Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t(language, 'loading') || 'Loading...'}</div>
                ) : expenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        {t(language, 'noExpensesFound') || 'No expenses found'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'date') || 'Date'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'type') || 'Type'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'amount') || 'Amount'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'description') || 'Description'}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">{t(language, 'actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {expenses.map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{formatDate(expense.date)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(expense.type)}`}>
                                                {expense.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-red-600 dark:text-red-400">{expense.amount.toFixed(2)} {t(language, 'currency')}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{expense.description || '-'}</td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(expense)}
                                                className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                                title={t(language, 'edit') || 'Edit'}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(expense)}
                                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                title={t(language, 'delete') || 'Delete'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {isAddModalOpen ? (t(language, 'addExpense') || 'Add Expense') : (t(language, 'editExpense') || 'Edit Expense')}
                            </h2>
                            <button
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormError(''); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={isAddModalOpen ? handleAdd : handleEdit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{formError}</div>
                            )}
                            <div>
                                <CustomSelect
                                    label={`${t(language, 'type') || 'Type'} *`}
                                    value={formData.type}
                                    onChange={(value) => setFormData({ ...formData, type: value })}
                                    options={EXPENSE_TYPES.map(type => ({ value: type, label: t(language, type.toLowerCase()) || type }))}
                                    placeholder={t(language, 'selectType') || "Select Type"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(language, 'amount') || 'Amount'} *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(language, 'date') || 'Date'} *</label>
                                <DateRangePicker
                                    startDate={formData.date ? new Date(formData.date) : null}
                                    endDate={null}
                                    singleDate={true}
                                    onChange={({ start }) => setFormData({ ...formData, date: toLocalISO(start) })}
                                    placeholder={t(language, 'selectDate') || "Select Date"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t(language, 'description') || 'Description'}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40A45D]/20 focus:border-[#40A45D] bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormError(''); }}
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
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t(language, 'deleteExpense') || 'Delete Expense'}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t(language, 'confirmDeleteExpense') || 'Are you sure you want to delete this expense?'}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setSelectedExpense(null); }}
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
        </div>
    );
};

export default Expenses;
