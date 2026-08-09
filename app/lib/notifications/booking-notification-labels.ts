const TRIP_REASON_LABELS: Record<string, string> = {
  vacation: "Vacation",
  family_visit: "Family visit",
  special_occasion: "Special occasion",
  business_remote_work: "Business / remote work",
  other: "Other",
};

const OUTSIDE_VISITORS_LABELS: Record<string, string> = {
  no: "No outside visitors",
  yes: "Yes, outside visitors expected",
  not_sure: "Not sure yet",
};

export function formatTripReasonLabel(dbValue: string): string {
  return TRIP_REASON_LABELS[dbValue] ?? dbValue;
}

export function formatOutsideVisitorsLabel(dbValue: string): string {
  return OUTSIDE_VISITORS_LABELS[dbValue] ?? dbValue;
}

export const RIU_HOUSE_PROPERTY_DISPLAY_NAME = "Riu House";
