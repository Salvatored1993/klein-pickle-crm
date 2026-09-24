import { createClient } from "@/lib/supabase/server";

export type SalesInvoiceRow = {
  id: string;
  customerCode: string;
  customerName: string;
  invoiceDate: string;
  salespersonCode: string | null;
  salespersonName: string | null;
  total: number;
};

// Flat invoice list with customer names joined in — small enough (a few
// thousand rows) to fetch whole and filter/aggregate by salesperson and
// date range entirely client-side, so both filters combine freely without
// round-tripping to the DB per change.
export async function listSalesInvoicesRaw(): Promise<SalesInvoiceRow[]> {
  const supabase = await createClient();

  const { data: customers, error: customersError } = await supabase
    .from("sales_customers")
    .select("customer_code, customer_name");
  if (customersError) throw customersError;
  const nameByCode = new Map(customers.map((c) => [c.customer_code, c.customer_name]));

  // Supabase/PostgREST caps a single request at 1000 rows by default —
  // this table already exceeds that, so page through it explicitly.
  const PAGE_SIZE = 1000;
  const invoices: {
    id: string;
    customer_code: string;
    invoice_date: string;
    salesperson_code: string | null;
    salesperson_name: string | null;
    total: number;
  }[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select("id, customer_code, invoice_date, salesperson_code, salesperson_name, total")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw error;
    invoices.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return invoices.map((i) => ({
    id: i.id,
    customerCode: i.customer_code,
    customerName: nameByCode.get(i.customer_code) ?? i.customer_code,
    invoiceDate: i.invoice_date,
    salespersonCode: i.salesperson_code,
    salespersonName: i.salesperson_name,
    total: i.total,
  }));
}

export type SalesLineItemRow = {
  invoiceId: string;
  customerCode: string;
  customerName: string;
  invoiceDate: string;
  salespersonCode: string | null;
  salespersonName: string | null;
  productCode: string;
  description: string;
  qty: number;
  uom: string | null;
};

// Flat line-item list (one row per product on an invoice) with the parent
// invoice's customer/date/salesperson denormalized in, so case-count totals
// can be filtered and aggregated client-side the same way dollar totals
// are in listSalesInvoicesRaw — same salesperson/date-range filters apply
// to both without a second round trip per filter change.
export async function listSalesLineItemsRaw(): Promise<SalesLineItemRow[]> {
  const supabase = await createClient();

  const invoices = await listSalesInvoicesRaw();
  const invoiceById = new Map(invoices.map((inv) => [inv.id, inv]));

  const PAGE_SIZE = 1000;
  const items: {
    invoice_id: string;
    product_code: string;
    description: string;
    qty: number;
    uom: string | null;
  }[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from("sales_invoice_items")
      .select("invoice_id, product_code, description, qty, uom")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw error;
    items.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  const rows: SalesLineItemRow[] = [];
  for (const it of items) {
    const inv = invoiceById.get(it.invoice_id);
    if (!inv) continue;
    rows.push({
      invoiceId: inv.id,
      customerCode: inv.customerCode,
      customerName: inv.customerName,
      invoiceDate: inv.invoiceDate,
      salespersonCode: inv.salespersonCode,
      salespersonName: inv.salespersonName,
      productCode: it.product_code,
      description: it.description,
      qty: it.qty,
      uom: it.uom,
    });
  }
  return rows;
}

export type SalesInvoiceWithItems = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  saleType: string;
  salespersonCode: string | null;
  salespersonName: string | null;
  total: number;
  items: {
    productCode: string;
    description: string;
    qty: number;
    uom: string | null;
    price: number | null;
    extension: number;
  }[];
};

export async function getSalesCustomer(customerCode: string) {
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("sales_customers")
    .select("customer_code, customer_name")
    .eq("customer_code", customerCode)
    .single();
  if (customerError) throw customerError;

  const { data: products, error: productsError } = await supabase
    .from("sales_customer_products")
    .select("*")
    .eq("customer_code", customerCode)
    .order("total_extension", { ascending: false });
  if (productsError) throw productsError;

  const { data: invoices, error: invoicesError } = await supabase
    .from("sales_invoices")
    .select("id, invoice_number, invoice_date, sale_type, salesperson_code, salesperson_name, total")
    .eq("customer_code", customerCode)
    .order("invoice_date", { ascending: false });
  if (invoicesError) throw invoicesError;

  const invoiceIds = invoices.map((inv) => inv.id);
  const { data: items, error: itemsError } =
    invoiceIds.length > 0
      ? await supabase
          .from("sales_invoice_items")
          .select("invoice_id, product_code, description, qty, uom, price, extension")
          .in("invoice_id", invoiceIds)
      : { data: [], error: null };
  if (itemsError) throw itemsError;

  const itemsByInvoice = new Map<string, SalesInvoiceWithItems["items"]>();
  for (const it of items) {
    const list = itemsByInvoice.get(it.invoice_id) ?? [];
    list.push({
      productCode: it.product_code,
      description: it.description,
      qty: it.qty,
      uom: it.uom,
      price: it.price,
      extension: it.extension,
    });
    itemsByInvoice.set(it.invoice_id, list);
  }

  const invoicesWithItems: SalesInvoiceWithItems[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceDate: inv.invoice_date,
    saleType: inv.sale_type,
    salespersonCode: inv.salesperson_code,
    salespersonName: inv.salesperson_name,
    total: inv.total,
    items: itemsByInvoice.get(inv.id) ?? [],
  }));

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const dates = invoices.map((inv) => inv.invoice_date).sort();

  return {
    customer: {
      customerCode: customer.customer_code,
      customerName: customer.customer_name,
      invoiceCount: invoices.length,
      totalSales,
      firstInvoiceDate: dates[0] ?? null,
      lastInvoiceDate: dates[dates.length - 1] ?? null,
    },
    products,
    invoices: invoicesWithItems,
  };
}
