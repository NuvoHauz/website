import type { BookkeepingCategoryId, CategoryRule } from "./types";

export const CATEGORY_LABELS: Record<BookkeepingCategoryId, string> = {
  rental_income: "Rental income",
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
  owner_travel: "Owner travel",
  taxes_licenses: "Taxes & licenses",
  bank_fees: "Bank & card fees",
  transfer: "Internal transfer",
  owner_draw: "Owner draw",
  personal: "Personal (non-business)",
  uncategorized: "Uncategorized",
};

export const CATEGORY_OPTIONS = (
  Object.keys(CATEGORY_LABELS) as BookkeepingCategoryId[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }));

/** Default vacation-rental patterns for NuvoHauz / short-term rental books. */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
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
    id: "income-booking",
    categoryId: "rental_income",
    patterns: ["booking.com", "bookingcom"],
    amountSign: "positive",
    priority: 90,
  },
  {
    id: "fee-airbnb",
    categoryId: "platform_fees",
    patterns: ["airbnb", "abnb"],
    amountSign: "negative",
    priority: 95,
    questionPrompt:
      "Airbnb outflow — is this a host fee/payout adjustment, or a personal stay charge?",
  },
  {
    id: "cleaning",
    categoryId: "cleaning",
    patterns: ["clean", "turnover", "maid", "housekeep"],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "supplies-amazon",
    categoryId: "supplies",
    patterns: ["amazon", "amzn", "walmart", "target", "home depot", "lowes"],
    amountSign: "negative",
    priority: 40,
    questionPrompt:
      "Retail purchase — was this for the rental property, or personal?",
  },
  {
    id: "repairs",
    categoryId: "repairs_maintenance",
    patterns: ["repair", "plumber", "electric", "hvac", "locksmith", "handyman"],
    amountSign: "negative",
    priority: 85,
  },
  {
    id: "utilities",
    categoryId: "utilities",
    patterns: [
      "ice",
      "utility",
      "electric",
      "agua",
      "water",
      "internet",
      "fiber",
      "kolbi",
      "cable",
      "gas co",
    ],
    amountSign: "negative",
    priority: 80,
  },
  {
    id: "insurance",
    categoryId: "insurance",
    patterns: ["insur", "policy", "premium"],
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
    id: "hoa",
    categoryId: "hoa_fees",
    patterns: ["hoa", "condo assoc", "association fee"],
    amountSign: "negative",
    priority: 85,
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
    patterns: ["facebook ads", "meta ads", "google ads", "adwords", "boost"],
    amountSign: "negative",
    priority: 75,
  },
  {
    id: "travel",
    categoryId: "owner_travel",
    patterns: ["airline", "united", "delta", "american air", "uber", "lyft", "hotel"],
    amountSign: "negative",
    priority: 35,
    questionPrompt:
      "Travel charge — was this travel to/for the rental property, or personal?",
  },
  {
    id: "taxes",
    categoryId: "taxes_licenses",
    patterns: ["irs", "tax payment", "municipality", "license", "permiso"],
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
];
