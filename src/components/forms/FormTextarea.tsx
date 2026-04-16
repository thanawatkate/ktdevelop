import { ChangeEvent, ReactNode, TextareaHTMLAttributes } from "react";

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  containerClassName?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
}

export function FormTextarea({
  label,
  error,
  onChange,
  containerClassName = "",
  labelClassName = "",
  textareaClassName = "",
  errorClassName = "",
  ...textareaProps
}: FormTextareaProps) {
  const baseTextareaClass = "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-600";
  const errorTextareaClass = error ? "border-rose-500 focus:border-rose-600" : "";
  const customTextareaClass = textareaClassName || baseTextareaClass;
  const finalTextareaClass = `${customTextareaClass} ${errorTextareaClass}`.trim();

  const baseLabelClass = "block text-sm font-medium text-slate-900";
  const finalLabelClass = labelClassName || baseLabelClass;

  const baseErrorClass = "mt-1 text-sm text-rose-600";
  const finalErrorClass = errorClassName || baseErrorClass;

  const baseContainerClass = "";
  const finalContainerClass = containerClassName || baseContainerClass;

  return (
    <div className={finalContainerClass}>
      {label ? (
        <label htmlFor={textareaProps.id} className={finalLabelClass}>
          {label}
        </label>
      ) : null}

      <textarea {...textareaProps} onChange={onChange} className={finalTextareaClass} />

      {error ? <p className={finalErrorClass}>{error}</p> : null}
    </div>
  );
}
