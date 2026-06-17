import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const InvoicePromptModal = ({ isOpen, onClose, onGenerate }) => {
    const { language } = useLanguage();
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [clientIce, setClientIce] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate({
            invoiceNumber,
            clientIce: clientIce.trim() === '' ? null : clientIce
        });
        // Reset state after generating
        setInvoiceNumber('');
        setClientIce('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} />
                        {t(language, 'invoiceDetailsPrompt') || 'Please enter Invoice details'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t(language, 'invoiceNumber') || 'Invoice Number'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="INV-2023-001"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t(language, 'clientIce') || 'Client ICE'} <span className="text-gray-400 text-xs">{t(language, 'optional') || '(Optional)'}</span>
                        </label>
                        <input
                            type="text"
                            value={clientIce}
                            onChange={(e) => setClientIce(e.target.value)}
                            placeholder="001234567890001"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                        >
                            {t(language, 'cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={!invoiceNumber.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t(language, 'generate') || 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoicePromptModal;
