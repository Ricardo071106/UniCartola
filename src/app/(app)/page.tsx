import { HomeDashboardShell } from "./home-dashboard";
import { parseSeries, parseSport } from "@/lib/queries/standings";

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sport = parseSport(params.sport);
  const series = parseSeries(params.series);

  return <HomeDashboardShell sport={sport} series={series} />;
}
