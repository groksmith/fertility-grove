import { DemoEntry } from "./DemoEntry";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/dashboard" } = await searchParams;
  return <DemoEntry next={next} />;
}
