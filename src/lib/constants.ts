import type {
  SalesStage,
  LeadSource,
  CustomerType,
  FreightTerms,
  SampleTrialStatus,
  PackSize,
} from "@/lib/database.types";

export const COMPANY_FACILITY_ADDRESS = "4125 W. Witten Ave";

export const PACK_SIZES: PackSize[] = [
  "16 oz",
  "32 oz",
  "1 Gallon",
  "2 Gallon",
  "5 Gallon",
  "Barrel",
  "Tote",
];

export const SALES_STAGES: SalesStage[] = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Sample/Trial",
  "Quote Submitted",
  "Customer Testing",
  "Negotiation",
  "Won",
  "Lost",
];

export const STAGE_DEFAULT_PROBABILITY: Record<SalesStage, number> = {
  "New Lead": 5,
  Contacted: 10,
  Qualified: 20,
  "Sample/Trial": 30,
  "Quote Submitted": 40,
  "Customer Testing": 50,
  Negotiation: 70,
  Won: 100,
  Lost: 0,
};

export const LEAD_SOURCES: LeadSource[] = [
  "Referral",
  "Trade Show",
  "Website Inquiry",
  "Cold Outreach",
  "Broker",
  "Distributor Inquiry",
  "Existing Customer",
  "Social Media",
  "Other",
];

export const CUSTOMER_TYPES: CustomerType[] = [
  "Retail/Grocery",
  "DTC/E-commerce",
  "Wholesale/Foodservice",
  "Distributor",
  "Broker",
  "Markets/Events",
  "Other",
];

export const FREIGHT_TERMS_OPTIONS: FreightTerms[] = [
  "FOB Origin",
  "FOB Destination",
  "Prepaid & Add",
  "Prepaid (Free Freight)",
  "Collect",
  "Third Party",
];

export const SAMPLE_TRIAL_STATUSES: SampleTrialStatus[] = [
  "Not Required",
  "Requested",
  "Sample Sent",
  "In Trial",
  "Trial Passed",
  "Trial Failed",
  "Approved",
];
