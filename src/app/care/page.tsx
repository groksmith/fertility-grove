import { CareGuideScreen } from "./CareGuideScreen";

export default async function CareGuidePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "" } = await searchParams;
  return <CareGuideScreen initialCategory={category} />;
}
