import { cn, getUniversityInitials } from "@/lib/utils";

interface UniversityCardProps {
  name: string;
  shortName: string;
  city?: string | null;
  totalPoints?: number;
  selected?: boolean;
  onClick?: () => void;
}

export function UniversityCard({
  name,
  shortName,
  city,
  totalPoints,
  selected,
  onClick,
}: UniversityCardProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all",
        selected
          ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
          : "border-gray-100 bg-white hover:border-gray-200",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
        {getUniversityInitials(shortName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{shortName}</p>
        <p className="text-xs text-gray-500 truncate">{name}</p>
        {city && <p className="text-[10px] text-gray-400">{city}</p>}
      </div>
      {totalPoints != null && (
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-600">
            {totalPoints.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-gray-400">pts</p>
        </div>
      )}
    </Comp>
  );
}
