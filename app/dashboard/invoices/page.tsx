import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import InvoicesTable from "@/app/ui/invoices/table";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";
import { fetchFilteredInvoices, fetchInvoicesPages } from "@/app/lib/data";
import { pool } from "@/app/lib/db";

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 6;

  const client = await pool.connect();
  const fetchPromises = {
    invoices: fetchFilteredInvoices(client, {
      query,
      currentPage,
      itemsPerPage,
    }),
    totalPages: fetchInvoicesPages(client, {
      query,
      itemsPerPage,
    }),
  };
  Promise.all(Object.values(fetchPromises)).finally(() => client.release());

  async function getTotalPages() {
    return await fetchPromises.totalPages;
  }

  async function getInvoices() {
    return await fetchPromises.invoices;
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <InvoicesTable getInvoices={getInvoices} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Suspense>
          {getTotalPages().then((totalPages) => (
            <Pagination totalPages={totalPages} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}
