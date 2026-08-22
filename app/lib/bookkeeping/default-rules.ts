import type {
  BookkeepingCategoryId,
  CategoryRule,
  ChartOfAccountEntry,
  CompanyProfile,
} from "./types";

export const CATEGORY_LABELS: Record<BookkeepingCategoryId, string> = {
  job_income: "Job / contract income",
  rental_income: "Rental income",
  materials: "Job materials",
  subcontractors: "Subcontractors",
  equipment_rental: "Equipment rental",
  tools: "Tools",
  platform_fees: "Platform / booking fees",
  cleaning: "Cleaning & turnover",
  supplies: "Supplies & amenities",
  repairs_maintenance: "Repairs & maintenance",
  utilities: "Utilities",
  insurance: "Insurance",
  property_management: "Property management",
  mortgage_loan: "Mortgage / loan payments",
  hoa_fees: "HOA / condo fees",
  professional_fees: "Professional fees",
  advertising: "Advertising & marketing",
  vehicle: "Vehicle / auto",
  office_expenses: "Office expenses",
  meals: "Meals & entertainment",
  owner_travel: "Owner travel",
  taxes_licenses: "Taxes & licenses",
  bank_fees: "Bank & card fees",
  transfer: "Internal transfer",
  owner_draw: "Owner draw",
  owner_investment: "Owner investment",
  personal: "Personal (non-business)",
  uncategorized: "Uncategorized",
};

export const CATEGORY_OPTIONS = (
  Object.keys(CATEGORY_LABELS) as BookkeepingCategoryId[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export function emptyCategoryTotals(): Record<BookkeepingCategoryId, number> {
  const totals = {} as Record<BookkeepingCategoryId, number>;
  for (const key of Object.keys(CATEGORY_LABELS) as BookkeepingCategoryId[]) {
    totals[key] = 0;
  }
  return totals;
}

/** Shared pattern library; company profiles can override / extend. */
export const SHARED_CATEGORY_RULES: CategoryRule[] = [
  {
    id: "income-deposit",
    categoryId: "job_income",
    patterns: ["customer payment", "invoice payment", "square", "stripe", "venmo", "zelle"],
    amountSign: "positive",
    priority: 70,
    questionPrompt:
      "Incoming payment — is this job income for Alfa Renovations, a transfer, or something else?",
  },
  {
    id: "materials-bigbox",
    categoryId: "materials",
    patterns: [
      "home depot",
      "lowes",
      "lowe's",
      "menards",
      "sherwin",
      "floor and decor",
      "building supply",
      "lumber",
    ],
    amountSign: "negative",
    priority: 90,
  },
  {
    id: "materials-amazon",
    categoryId: "materials",
    patterns: ["amazon", "amzn"],
    amountSign: "negative",
    priority: 45,
    questionPrompt:
      "Amazon purchase — job materials/tools for Alfa Renovations, office, or personal?",
  },
  {
    id: "subcontractors",
    categoryId: "subcontractors",
    patterns: ["subcontractor", "sub payment", "1099", "electrical contractor", "plumbing co"],
    amountSign: "negative",
    priority: 85,
    questionPrompt: "Is this a subcontractor/job labor payment?",
  },
  {
    id: "equipment",
    categoryId: "equipment_rental",
    patterns: ["united rentals", "sunbelt", "equipment rental", "tool rental"],
    amountSign: "negative",
    priority: 90,
  },
  {
    id: "tools",
    categoryId: "tools",
    patterns: ["harbor freight", "northern tool", "milwaukee tool", "dewalt"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "vehicle",
    categoryId: "vehicle",
    patterns: [
      "shell",
      "chevron",
      "exxon",
      "mobil",
      "bp ",
      "gas station",
      "fuel",
      "parking",
      "toll",
    ],
    amountSign: "negative",
    priority: 75,
  },
  {
    id: "office",
    categoryId: "office_expenses",
    patterns: ["staples", "office depot", "ups store", "fedex", "postage", "usps"],
    amountSign: "negative",
    priority: 70,
  },
  {
    id: "meals",
    categoryId: "meals",
    patterns: ["restaurant", "cafe", "coffee", "doordash", "uber eats", "grubhub"],
    amountSign: "negative",
    priority: 40,
    questionPrompt: "Meal charge — business meal with client/crew, or personal?",
  },
  {
    id: "income-airbnb",
    categoryId: "rental_income",
    patterns: ["airbnb", "abnb"],
    amountSign: "positive",
    priority: 100,
  },
  {
    id: "income-vrbo",
    categoryId: "rental_income",
    patterns: ["vrbo", "homeaway"],
    amountSign: "positive",
    priority: 100,
  },
  {
    id: "cleaning",
    categoryId: "cleaning",
    patterns: ["clean", "turnover", "maid", "housekeep"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "repairs",
    categoryId: "repairs_maintenance",
    patterns: ["repair", "plumber", "electric", "hvac", "locksmith", "handyman"],
    amountSign: "negative",
    priority: 70,
  },
  {
    id: "utilities",
    categoryId: "utilities",
    patterns: [
      "utility",
      "electric",
      "agua",
      "water",
      "internet",
      "fiber",
      "kolbi",
      "cable",
      "comcast",
      "att ",
    ],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "insurance",
    categoryId: "insurance",
    patterns: ["insur", "policy", "premium", "progressive", "geico", "state farm"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "mortgage",
    categoryId: "mortgage_loan",
    patterns: ["mortgage", "loan payment", "escrow"],
    amountSign: "negative",
    priority: 90,
  },
  {
    id: "professional",
    categoryId: "professional_fees",
    patterns: ["cpa", "accountant", "attorney", "lawyer", "notary", "legal"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "ads",
    categoryId: "advertising",
    patterns: ["facebook ads", "meta ads", "google ads", "adwords", "boost", "angi", "thumbtack"],
    amountSign: "negative",
    priority: 75,
  },
  {
    id: "travel",
    categoryId: "owner_travel",
    patterns: ["airline", "united", "delta", "american air", "uber", "lyft", "hotel"],
    amountSign: "negative",
    priority: 35,
    questionPrompt: "Travel/rideshare — business for the company, or personal?",
  },
  {
    id: "taxes",
    categoryId: "taxes_licenses",
    patterns: ["irs", "tax payment", "franchise tax", "license", "permit", "permiso"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "bank-fees",
    categoryId: "bank_fees",
    patterns: ["service fee", "monthly fee", "overdraft", "wire fee", "atm fee"],
    amountSign: "negative",
    priority: 70,
  },
  {
    id: "transfer",
    categoryId: "transfer",
    patterns: ["transfer", "xfer", "online transfer", "payment thank you"],
    amountSign: "any",
    priority: 60,
    questionPrompt:
      "Looks like a transfer or card payment — confirm this is between your own accounts?",
  },
  {
    id: "owner-draw",
    categoryId: "owner_draw",
    patterns: ["owner draw", "owner distribution", "owner payout"],
    amountSign: "negative",
    priority: 90,
  },
  {
    id: "owner-invest",
    categoryId: "owner_investment",
    patterns: ["owner investment", "owner contribution", "capital contribution"],
    amountSign: "positive",
    priority: 90,
  },
];

/** Chart of Accounts names as used when categorizing inside the Alfa Renovations QBO file. */
export const ALFA_RENOVATIONS_COA: ChartOfAccountEntry[] = [
  {
    categoryId: "job_income",
    qboAccountName: "Job Income",
    accountType: "Income",
    accountNumber: "4000",
    plSection: "income",
  },
  {
    categoryId: "materials",
    qboAccountName: "Job Materials",
    accountType: "Cost of Goods Sold",
    accountNumber: "5000",
    plSection: "cogs",
  },
  {
    categoryId: "subcontractors",
    qboAccountName: "Subcontractors",
    accountType: "Cost of Goods Sold",
    accountNumber: "5100",
    plSection: "cogs",
  },
  {
    categoryId: "equipment_rental",
    qboAccountName: "Equipment Rental",
    accountType: "Cost of Goods Sold",
    accountNumber: "5200",
    plSection: "cogs",
  },
  {
    categoryId: "tools",
    qboAccountName: "Tools",
    accountType: "Expense",
    accountNumber: "6100",
    plSection: "expense",
  },
  {
    categoryId: "vehicle",
    qboAccountName: "Automobile Expense",
    accountType: "Expense",
    accountNumber: "6200",
    plSection: "expense",
  },
  {
    categoryId: "office_expenses",
    qboAccountName: "Office Expenses",
    accountType: "Expense",
    accountNumber: "6300",
    plSection: "expense",
  },
  {
    categoryId: "meals",
    qboAccountName: "Meals and Entertainment",
    accountType: "Expense",
    accountNumber: "6400",
    plSection: "expense",
  },
  {
    categoryId: "advertising",
    qboAccountName: "Advertising & Marketing",
    accountType: "Expense",
    accountNumber: "6500",
    plSection: "expense",
  },
  {
    categoryId: "insurance",
    qboAccountName: "Insurance",
    accountType: "Expense",
    accountNumber: "6600",
    plSection: "expense",
  },
  {
    categoryId: "utilities",
    qboAccountName: "Utilities",
    accountType: "Expense",
    accountNumber: "6700",
    plSection: "expense",
  },
  {
    categoryId: "professional_fees",
    qboAccountName: "Legal & Professional Fees",
    accountType: "Expense",
    accountNumber: "6800",
    plSection: "expense",
  },
  {
    categoryId: "bank_fees",
    qboAccountName: "Bank Charges & Fees",
    accountType: "Expense",
    accountNumber: "6900",
    plSection: "expense",
  },
  {
    categoryId: "taxes_licenses",
    qboAccountName: "Taxes & Licenses",
    accountType: "Expense",
    accountNumber: "6950",
    plSection: "expense",
  },
  {
    categoryId: "owner_travel",
    qboAccountName: "Travel",
    accountType: "Expense",
    accountNumber: "6450",
    plSection: "expense",
  },
  {
    categoryId: "supplies",
    qboAccountName: "Supplies",
    accountType: "Expense",
    accountNumber: "6150",
    plSection: "expense",
  },
  {
    categoryId: "repairs_maintenance",
    qboAccountName: "Repairs and Maintenance",
    accountType: "Expense",
    accountNumber: "6550",
    plSection: "expense",
  },
  {
    categoryId: "transfer",
    qboAccountName: "Ask My Accountant",
    accountType: "Expense",
    accountNumber: "8000",
    plSection: "other",
  },
  {
    categoryId: "owner_draw",
    qboAccountName: "Owner's Draw",
    accountType: "Equity",
    plSection: "other",
  },
  {
    categoryId: "owner_investment",
    qboAccountName: "Owner's Investment",
    accountType: "Equity",
    plSection: "other",
  },
  {
    categoryId: "personal",
    qboAccountName: "Personal (Owner)",
    accountType: "Equity",
    plSection: "other",
  },
  {
    categoryId: "uncategorized",
    qboAccountName: "Uncategorized Expense",
    accountType: "Expense",
    plSection: "other",
  },
  // Kept for multi-entity / NuvoHauz rental books when needed
  {
    categoryId: "rental_income",
    qboAccountName: "Rental Income",
    accountType: "Income",
    plSection: "income",
  },
  {
    categoryId: "platform_fees",
    qboAccountName: "Platform Fees",
    accountType: "Expense",
    plSection: "expense",
  },
  {
    categoryId: "cleaning",
    qboAccountName: "Cleaning",
    accountType: "Expense",
    plSection: "expense",
  },
  {
    categoryId: "property_management",
    qboAccountName: "Property Management",
    accountType: "Expense",
    plSection: "expense",
  },
  {
    categoryId: "mortgage_loan",
    qboAccountName: "Mortgage Payment",
    accountType: "Other",
    plSection: "other",
  },
  {
    categoryId: "hoa_fees",
    qboAccountName: "HOA Fees",
    accountType: "Expense",
    plSection: "expense",
  },
];

export const ALFA_RENOVATIONS_PROFILE: CompanyProfile = {
  id: "alfa-renovations",
  name: "Alfa Renovations",
  accountingSystem: "quickbooks_online",
  chartOfAccounts: ALFA_RENOVATIONS_COA,
  rules: SHARED_CATEGORY_RULES,
};

export const COMPANY_PROFILES: CompanyProfile[] = [ALFA_RENOVATIONS_PROFILE];

export const DEFAULT_COMPANY_ID = ALFA_RENOVATIONS_PROFILE.id;

export function getCompanyProfile(companyId?: string): CompanyProfile {
  const found = COMPANY_PROFILES.find((profile) => profile.id === companyId);
  return found ?? ALFA_RENOVATIONS_PROFILE;
}

export function resolveQboAccountName(
  profile: CompanyProfile,
  categoryId: BookkeepingCategoryId,
): string {
  const entry = profile.chartOfAccounts.find((row) => row.categoryId === categoryId);
  return entry?.qboAccountName ?? CATEGORY_LABELS[categoryId];
}

export function getCoaEntry(
  profile: CompanyProfile,
  categoryId: BookkeepingCategoryId,
): ChartOfAccountEntry | undefined {
  return profile.chartOfAccounts.find((row) => row.categoryId === categoryId);
}

/** @deprecated Use SHARED_CATEGORY_RULES — kept for existing imports. */
export const DEFAULT_CATEGORY_RULES = SHARED_CATEGORY_RULES;
