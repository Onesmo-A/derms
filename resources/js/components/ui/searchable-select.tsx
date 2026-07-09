import { ChevronDown, Search, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type SearchableSelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
    helper?: string;
};

type Props = {
    value: string;
    onValueChange: (value: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
};

export function SearchableSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    emptyText = 'No matching options',
    className,
    disabled = false,
    required = false,
    name,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement | null>(null);

    const selected = options.find((option) => option.value === value);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return options;
        }

        return options.filter((option) => {
            const haystack = `${option.label} ${option.value} ${option.helper ?? ''}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [options, query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
        }
    }, [open]);

    const choose = (optionValue: string) => {
        onValueChange(optionValue);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className={cn('relative', className)}>
            {name && <input type="hidden" name={name} value={value} />}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition',
                    'focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20',
                    disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-300 hover:bg-slate-50'
                )}
            >
                <span className={cn('truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
                    {selected?.label ?? placeholder}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                    {selected && !disabled ? <X className="h-4 w-4" /> : null}
                    <ChevronDown className={cn('h-4 w-4 transition', open ? 'rotate-180' : '')} />
                </span>
            </button>

            {open && !disabled && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-auto p-1 scrollbar-hover">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-slate-400">{emptyText}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => choose(option.value)}
                                    className={cn(
                                        'flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
                                        option.value === value
                                            ? 'bg-[#0F4C81]/10 text-[#0F4C81]'
                                            : 'text-slate-700 hover:bg-slate-50',
                                        option.disabled ? 'cursor-not-allowed opacity-50' : ''
                                    )}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">{option.label}</span>
                                        {option.helper && (
                                            <span className="mt-0.5 block truncate text-xs text-slate-400">{option.helper}</span>
                                        )}
                                    </span>
                                    {option.value === value && (
                                        <span className="rounded-full bg-[#0F4C81] px-2 py-0.5 text-[10px] font-bold text-white">
                                            Selected
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
