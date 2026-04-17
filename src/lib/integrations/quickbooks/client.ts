import { getValidAccessToken } from "./token-manager";

function baseUrl(): string {
  return process.env.QUICKBOOKS_ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

export class QuickBooksClient {
  constructor(private integrationId: string) {}

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const { accessToken, realmId } = await getValidAccessToken(this.integrationId);
    const url = `${baseUrl()}/v3/company/${realmId}/${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
    if (body) headers["Content-Type"] = "application/json";

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      // Force token refresh and retry once
      const fresh = await getValidAccessToken(this.integrationId);
      const retry = await fetch(url, {
        method,
        headers: { ...headers, Authorization: `Bearer ${fresh.accessToken}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) throw new Error(`QB API error: ${retry.status}`);
      return retry.json();
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`QB API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    return res.json();
  }

  async query<T = any>(sql: string): Promise<T> {
    return this.request("GET", `query?query=${encodeURIComponent(sql)}`);
  }

  async getInvoices(since?: Date): Promise<any[]> {
    const where = since
      ? `WHERE TxnDate >= '${since.toISOString().slice(0, 10)}'`
      : `WHERE TxnDate >= '${twelveMonthsAgo()}'`;
    const result = await this.query<any>(`SELECT * FROM Invoice ${where} MAXRESULTS 1000`);
    return result?.QueryResponse?.Invoice ?? [];
  }

  async getPayments(since?: Date): Promise<any[]> {
    const where = since
      ? `WHERE TxnDate >= '${since.toISOString().slice(0, 10)}'`
      : `WHERE TxnDate >= '${twelveMonthsAgo()}'`;
    const result = await this.query<any>(`SELECT * FROM Payment ${where} MAXRESULTS 1000`);
    return result?.QueryResponse?.Payment ?? [];
  }

  async getSalesReceipts(since?: Date): Promise<any[]> {
    const where = since
      ? `WHERE TxnDate >= '${since.toISOString().slice(0, 10)}'`
      : `WHERE TxnDate >= '${twelveMonthsAgo()}'`;
    const result = await this.query<any>(`SELECT * FROM SalesReceipt ${where} MAXRESULTS 1000`);
    return result?.QueryResponse?.SalesReceipt ?? [];
  }

  async getBills(since?: Date): Promise<any[]> {
    const where = since
      ? `WHERE TxnDate >= '${since.toISOString().slice(0, 10)}'`
      : `WHERE TxnDate >= '${twelveMonthsAgo()}'`;
    const result = await this.query<any>(`SELECT * FROM Bill ${where} MAXRESULTS 1000`);
    return result?.QueryResponse?.Bill ?? [];
  }

  async getPurchases(since?: Date): Promise<any[]> {
    const where = since
      ? `WHERE TxnDate >= '${since.toISOString().slice(0, 10)}'`
      : `WHERE TxnDate >= '${twelveMonthsAgo()}'`;
    const result = await this.query<any>(`SELECT * FROM Purchase ${where} MAXRESULTS 1000`);
    return result?.QueryResponse?.Purchase ?? [];
  }

  async getAccounts(): Promise<any[]> {
    const result = await this.query<any>("SELECT * FROM Account MAXRESULTS 1000");
    return result?.QueryResponse?.Account ?? [];
  }

  async getCompanyInfo(): Promise<any> {
    const result = await this.query<any>("SELECT * FROM CompanyInfo");
    return result?.QueryResponse?.CompanyInfo?.[0] ?? null;
  }

  async getCDC(entities: string[], since: Date): Promise<any> {
    const { accessToken, realmId } = await getValidAccessToken(this.integrationId);
    const url = `${baseUrl()}/v3/company/${realmId}/cdc?entities=${entities.join(",")}&changedSince=${since.toISOString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`CDC request failed: ${res.status}`);
    return res.json();
  }
}

function twelveMonthsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
