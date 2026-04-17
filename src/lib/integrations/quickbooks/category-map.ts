const CATEGORY_MAP: Record<string, string> = {
  "Payroll Expenses": "payroll",
  "Employee Benefits": "payroll",
  "Salaries & Wages": "payroll",
  "Rent or Lease": "rent",
  "Utilities": "utilities",
  "Office Expenses": "rent",
  "Dues & Subscriptions": "subscription",
  "Software": "software",
  "Computer & Internet Expenses": "software",
  "Advertising & Marketing": "marketing",
  "Promotional": "marketing",
  "Insurance": "insurance",
  "Legal & Professional Fees": "legal",
  "Travel": "travel",
  "Meals & Entertainment": "meals",
  "Other Expenses": "other",
};

export function mapQuickBooksAccountToCategory(
  accountName: string,
  accountType: string,
  overrides?: Record<string, string>
): string {
  if (overrides?.[accountName]) return overrides[accountName];

  // Direct match
  if (CATEGORY_MAP[accountName]) return CATEGORY_MAP[accountName];

  // Fuzzy match on account name
  const lower = accountName.toLowerCase();
  for (const [pattern, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(pattern.toLowerCase())) return category;
  }

  // Match on account type
  if (accountType === "Expense") return "other";
  if (accountType === "Cost of Goods Sold") return "cogs";

  return "other";
}
