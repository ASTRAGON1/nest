import React, { useState } from 'react';
import { Calculator as CalculatorIcon, X } from 'lucide-react';

const Calculator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');

    const handleNumber = (num) => {
        setDisplay(prev => prev === '0' ? num : prev + num);
        setEquation(prev => prev + num);
    };

    const handleOperator = (op) => {
        setDisplay('0');
        setEquation(prev => prev + ' ' + op + ' ');
    };

    const handleEqual = () => {
        try {
            // eslint-disable-next-line
            const result = eval(equation.replace('x', '*'));
            setDisplay(String(result));
            setEquation(String(result));
        } catch (error) {
            setDisplay('Error');
            setEquation('');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+'
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-colors duration-200 ${isOpen
                    ? 'bg-[#40A45D] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                title="Calculator"
            >
                <CalculatorIcon size={20} />
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Calculator</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4 text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400 h-4">{equation}</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">{display}</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={handleClear} className="col-span-4 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium">
                            Clear
                        </button>
                        {buttons.map((btn) => (
                            <button
                                key={btn}
                                onClick={() => {
                                    if (btn === '=') handleEqual();
                                    else if (['+', '-', '*', '/'].includes(btn)) handleOperator(btn);
                                    else handleNumber(btn);
                                }}
                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${btn === '='
                                    ? 'bg-[#40A45D] text-white hover:bg-[#368f50]'
                                    : ['+', '-', '*', '/'].includes(btn)
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;
