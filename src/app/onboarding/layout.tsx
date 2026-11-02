import { Toaster } from "@/components/ui";

export const metadata = { title: "Getting started · Fertility Grove" };

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ground">
      {children}
      <Toaster />
    </div>
  );
}
