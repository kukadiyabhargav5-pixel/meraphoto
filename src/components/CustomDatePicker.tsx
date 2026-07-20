import React from 'react';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';

interface CustomDatePickerProps extends Omit<ReactDatePickerProps, 'onChange'> {
  type?: 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export default function CustomDatePicker({ 
  type = 'date', 
  value, 
  onChange, 
  className = "form-input", 
  required,
  ...props 
}: CustomDatePickerProps) {
  
  // Convert string value to Date object for react-datepicker
  // Time inputs are usually "HH:mm"
  // Date inputs are usually "YYYY-MM-DD"
  const parsedDate = value 
    ? (type === 'time' ? new Date(`2000-01-01T${value}:00`) : new Date(`${value}T00:00:00`)) 
    : null;

  const handleChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      return;
    }
    
    if (type === 'time') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    } else {
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  return (
    <div className="relative w-full group">
      <DatePicker
        selected={parsedDate}
        onChange={handleChange}
        showTimeSelect={type === 'time'}
        showTimeSelectOnly={type === 'time'}
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="Time"
        dateFormat={type === 'time' ? 'HH:mm' : 'yyyy-MM-dd'}
        className={`${className} !pl-10 cursor-pointer transition-all duration-300 group-hover:border-[#c5a880] group-hover:shadow-[0_0_0_3px_rgba(197,168,128,0.15)]`}
        required={required}
        placeholderText={type === 'time' ? "Select time" : "Select date"}
        {...props}
      />
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors duration-300 group-hover:text-[#c5a880]">
        {type === 'time' ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
      </div>
    </div>
  );
}
