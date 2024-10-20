import CardWrapper from "@/app/ui/dashboard/cards";
import RevenueChart from "@/app/ui/dashboard/revenue-chart";
import LatestInvoices from "@/app/ui/dashboard/latest-invoices";
import {
  fetchRevenue,
  fetchLatestInvoices,
  fetchCardData,
} from "@/app/lib/data";
import { lusitana } from "@/app/ui/fonts";
import { pool } from "@/app/lib/db";
import { Suspense } from "react";
import {
  CardsSkeleton,
  LatestInvoicesSkeleton,
  RevenueChartSkeleton,
} from "@/app/ui/skeletons";

export default async function Page() {
  const client = await pool.connect();
  const fetchPromises = {
    revenue: fetchRevenue(client),
    latestInvoices: fetchLatestInvoices(client),
    cardData: fetchCardData(client),
  };
  Promise.all(Object.values(fetchPromises)).finally(() => client.release());
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper getCardData={() => fetchPromises.cardData} />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart getRevenue={() => fetchPromises.revenue} />
        </Suspense>
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices
            getLatestInvoices={() => fetchPromises.latestInvoices}
          />
        </Suspense>
      </div>
    </main>
  );
}
