export const formatCurrency = (amount) => `${parseFloat(amount).toFixed(2)} MAD`;

export const formatDate = (date, locale = 'en') =>
    new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

export const formatDateTime = (date) =>
    new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

export const calculatePercentage = (value, total) =>
    total > 0 ? ((value / total) * 100).toFixed(2) : 0;

export const getStatusColor = (status) => {
    const colors = {
        paid: 'text-green-600 bg-green-100',
        partially_paid: 'text-orange-600 bg-orange-100',
        unpaid: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
};
