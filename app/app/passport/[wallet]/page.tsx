import PassportPageClient from "./PassportPageClient";

interface PageProps {
  params: Promise<{ wallet: string }>;
}

export default async function PassportPage({ params }: PageProps) {
  const { wallet } = await params;
  return <PassportPageClient wallet={wallet} />;
}
