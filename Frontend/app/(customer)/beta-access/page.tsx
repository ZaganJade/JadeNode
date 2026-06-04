import { BetaAccessRequestForm } from "@/features/auth/components/beta-access-request-form";

export const metadata = {
  title: "Beta Access — JadeNode",
  description: "Ajukan akses beta untuk dapat melakukan checkout di JadeNode Marketplace.",
};

export default function BetaAccessPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <BetaAccessRequestForm />
    </div>
  );
}
