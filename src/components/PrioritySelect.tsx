import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface PrioritySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function PrioritySelect({ value, onChange, options }: PrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }

      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });

      const closeOnScroll = () => setIsOpen(false);
      window.addEventListener('scroll', closeOnScroll, true);

      return () => {
        window.removeEventListener('scroll', closeOnScroll, true);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : '';

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 ${getPriorityClasses(
          value
        )}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayText}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: `${dropdownPosition.width}px`,
            }}
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === option.value
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
