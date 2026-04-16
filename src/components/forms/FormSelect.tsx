import { ChangeEvent } from "react";

interface FormSelectProps {
  label?: string;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  containerClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  errorClassName?: string;
  options: Array<{ value: string | number; label: string }>;
  value?: string | number;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormSelect({
  label,
  error,
  onChange,
  options,
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
  errorClassName = "",
  ...selectProps
}: FormSelectProps) {
  const baseSelectClass = "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600";
  const errorSelectClass = error ? "border-rose-500 focus:border-rose-600" : "";
  const customSelectClass = selectClassName || baseSelectClass;
  const finalSelectClass = `${customSelectClass} ${errorSelectClass}`.trim();

  const baseLabelClass = "block text-sm font-medium text-slate-900";
  const finalLabelClass = labelClassName || baseLabelClass;

  const baseErrorClass = "mt-1 text-sm text-rose-600";
  const finalErrorClass = errorClassName || baseErrorClass;

  const baseContainerClass = "";
  const finalContainerClass = containerClassName || baseContainerClass;

  return (
    <div className={finalContainerClass}>
      {label ? (
        <label htmlFor={selectProps.id} className={finalLabelClass}>
          {label}
        </label>
      ) : null}

      <select {...(selectProps as any)} onChange={onChange} className={finalSelectClass}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? <p className={finalErrorClass}>{error}</p> : null}
    </div>
  );
}
