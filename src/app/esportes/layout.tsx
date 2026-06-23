import { EsportesShell } from "@/components/esportes/EsportesShell";

export default function EsportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EsportesShell>{children}</EsportesShell>;
}
