import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isWithinInterval } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/translations';

const DateRangePicker = ({
    startDate,
    endDate,
    onChange,
    placeholder = "Select Date Range",
    singleDate = false
}) => {
    const { language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoverDate, setHoverDate] = useState(null);
    const wrapperRef = useRef(null);

    const locale = language === 'ar' ? ar : enUS;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onDateClick = (day) => {
        if (singleDate) {
            onChange({ start: day, end: day });
            setIsOpen(false);
            return;
        }

        if (!startDate || (startDate && endDate)) {
            onChange({ start: day, end: null });
        } else {
            // Check if clicked date is before start date
            if (day < startDate) {
                onChange({ start: day, end: startDate });
            } else {
                onChange({ start: startDate, end: day });
            }
            setIsOpen(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        const dateFormat = "MMMM yyyy";
        return (
            <div className="flex justify-between items-center mb-4 px-2">
                <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ChevronLeft size={20} className={language === 'ar' ? "rotate-180" : ""} />
                </button>
                <div className="font-semibold text-gray-800 dark:text-white capitalize">
                    {format(currentMonth, dateFormat, { locale })}
                </div>
                <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ChevronRight size={20} className={language === 'ar' ? "rotate-180" : ""} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const dateFormat = "eeeee"; // 'M', 'T', 'W'...
        const days = [];
        let startDate = startOfWeek(currentMonth, { locale });

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 capitalize text-center py-2" key={i}>
                    {format(addDays(startDate, i), dateFormat, { locale })}
                </div>
            );
        }

        return <div className="grid grid-cols-7 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDateWeek = startOfWeek(monthStart, { locale });
        const endDateWeek = endOfWeek(monthEnd, { locale });

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDateWeek;
        let formattedDate = "";

        while (day <= endDateWeek) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;

                const isSelected = startDate && isSameDay(day, startDate);
                const isEndSelected = endDate && isSameDay(day, endDate);
                const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
                const isHovered = !endDate && startDate && hoverDate && isWithinInterval(day, { start: Math.min(startDate, hoverDate), end: Math.max(startDate, hoverDate) });

                // Styles
                let cellClass = "relative h-9 w-9 flex items-center justify-center text-sm rounded-full cursor-pointer transition-all duration-200 ";
                const textClass = "z-10 ";

                if (!isSameMonth(day, monthStart)) {
                    cellClass += "text-gray-300 dark:text-gray-600";
                } else if (isSelected || isEndSelected) {
                    cellClass += "bg-[#40A45D] text-white shadow-md shadow-green-200 dark:shadow-none font-semibold";
                } else if (isInRange) {
                    cellClass += "bg-green-50 dark:bg-green-900/30 text-[#40A45D] dark:text-green-400 rounded-none first:rounded-l-full last:rounded-r-full";
                } else {
                    cellClass += "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
                }

                if (isHovered && !isEndSelected && !isSelected) {
                    cellClass += " bg-green-50 dark:bg-green-900/30";
                }

                days.push(
                    <div
                        className={`flex justify-center items-center ${isInRange ? 'bg-green-50 dark:bg-green-900/30' : ''} ${isSelected ? 'rounded-l-full bg-green-50 dark:bg-green-900/30' : ''} ${isEndSelected ? 'rounded-r-full bg-green-50 dark:bg-green-900/30' : ''}`}
                        key={day}
                        onClick={() => onDateClick(cloneDay)}
                        onMouseEnter={() => setHoverDate(cloneDay)}
                    >
                        <div className={cellClass}>
                            <span className={textClass}>{formattedDate}</span>
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 my-1" key={day}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="py-2">{rows}</div>;
    };

    const formatDateDisplay = () => {
        if (!startDate) return placeholder;
        if (singleDate) return format(startDate, 'dd MMM yyyy', { locale });
        if (startDate && !endDate) return `${format(startDate, 'dd MMM yyyy', { locale })} - ...`;
        return `${format(startDate, 'dd MMM yyyy', { locale })} - ${format(endDate, 'dd MMM yyyy', { locale })}`;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${isOpen ? 'border-[#40A45D] ring-2 ring-[#40A45D]/10' : 'border-gray-200 dark:border-gray-700 shadow-sm'}`}
            >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <CalendarIcon size={18} className="text-gray-400" />
                    <span className={`text-sm ${!startDate ? 'text-gray-400' : 'font-medium'}`}>
                        {formatDateDisplay()}
                    </span>
                </div>
                {(startDate || endDate) && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange({ start: null, end: null });
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 w-[320px] origin-top animate-in fade-in zoom-in-95 duration-200">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={() => {
                                onChange({ start: new Date(), end: singleDate ? new Date() : null });
                                if (singleDate) setIsOpen(false);
                            }}
                            className="text-xs font-semibold text-[#40A45D] hover:underline px-2 py-1"
                        >
                            {t(language, 'today') || 'Today'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
