import { cn } from "@/shared/utils/cn";

const VARIANTES = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow",
  secondary: "bg-white text-primary border border-primary hover:bg-surface",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow",
  warning: "bg-amber-500 text-white hover:bg-amber-600 shadow",
  ghost: "text-primary hover:bg-surface",
};

const TAMANIOS = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-bold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTES[variant],
        TAMANIOS[size],
        className
      )}
      {...props}
    />
  );
}