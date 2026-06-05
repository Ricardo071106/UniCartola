import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: string;
  emoji?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  gradient = "from-[#1e3a5f] to-[#2d5a8e]",
  emoji,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg",
        gradient
      )}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative">
        {emoji && <span className="text-3xl mb-2 block">{emoji}</span>}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/80 max-w-md">{subtitle}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
