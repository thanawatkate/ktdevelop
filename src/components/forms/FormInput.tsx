import { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

export function FormInput({
  label,
  error,
  icon,
  onChange,
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  ...inputProps
}: FormInputProps) {
  const baseInputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-indigo-600";
  const errorInputClass = error ? "border-rose-500 focus:border-rose-600 bg-rose-50 focus:bg-rose-50" : "";
  const customInputClass = inputClassName || baseInputClass;
  const finalInputClass = `${customInputClass} ${errorInputClass}`.trim();

  const baseLabelClass = "block text-sm font-medium text-slate-900";
  const finalLabelClass = labelClassName || baseLabelClass;

  const baseErrorClass = "mt-1 text-sm text-rose-600";
  const finalErrorClass = errorClassName || baseErrorClass;

  const baseContainerClass = "";
  const finalContainerClass = containerClassName || baseContainerClass;

  return (
    <div className={finalContainerClass}>
      {label ? (
        <label htmlFor={inputProps.id} className={finalLabelClass}>
          {label}
        </label>
      ) : null}

      <div className={icon ? "relative" : ""}>
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            {icon}
          </span>
        ) : null}

        <input
          {...inputProps}
          onChange={onChange}
          className={`${finalInputClass}${icon ? " pl-10" : ""}`}
        />
      </div>

      {error ? <p className={finalErrorClass}>{error}</p> : null}
    </div>
  );
}
