import { ChangeEvent, InputHTMLAttributes } from "react";

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  label?: string;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

export function FormCheckbox({
  label,
  error,
  onChange,
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  ...inputProps
}: FormCheckboxProps) {
  const baseInputClass = "rounded border border-slate-300 text-indigo-600 outline-none transition focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2";
  const customInputClass = inputClassName || baseInputClass;

  const baseLabelClass = "inline-flex items-center gap-2 text-sm font-medium text-slate-900";
  const finalLabelClass = labelClassName || baseLabelClass;

  const baseErrorClass = "mt-1 text-sm text-rose-600";
  const finalErrorClass = errorClassName || baseErrorClass;

  const baseContainerClass = "";
  const finalContainerClass = containerClassName || baseContainerClass;

  return (
    <div className={finalContainerClass}>
      <label className={finalLabelClass}>
        <input type="checkbox" {...inputProps} onChange={onChange} className={customInputClass} />
        {label}
      </label>

      {error ? <p className={finalErrorClass}>{error}</p> : null}
    </div>
  );
}
