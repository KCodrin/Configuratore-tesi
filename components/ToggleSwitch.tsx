import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, ...rest }) => {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only peer form-switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        {...rest}
      />
      <div className="w-11 h-6 bg-subtle-light rounded-full peer dark:bg-subtle-dark peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
};

export default ToggleSwitch;
