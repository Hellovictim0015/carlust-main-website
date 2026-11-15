/** Identity verification state from GET /api/kyc/status (backend kycController). */
export type KycStatus = {
  autoAvailable: boolean;
  /** "digilocker" (Setu: one DigiLocker consent) or "otp" (Aadhaar OTP + DL number). */
  flow: "digilocker" | "otp";
  testMode: boolean;
  status: "NOT_VERIFIED" | "VERIFYING" | "VERIFIED";
  method: "AUTO" | "MANUAL" | null;
  reviewReason: string | null;
  aadhaar: { verified: boolean; last4: string | null; name: string | null };
  drivingLicence: { verified: boolean; number: string | null; validTill: string | null; name: string | null };
  documentsUploaded: boolean;
};

export function toKycStatus(d: Record<string, unknown>): KycStatus {
  const a = (d.aadhaar ?? {}) as Record<string, unknown>;
  const l = (d.drivingLicence ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" && v ? v : null);
  const status = d.status === "VERIFIED" || d.status === "VERIFYING" ? d.status : "NOT_VERIFIED";
  return {
    autoAvailable: d.autoAvailable === true,
    flow: d.flow === "digilocker" ? "digilocker" : "otp",
    testMode: d.testMode === true,
    status,
    method: d.method === "AUTO" || d.method === "MANUAL" ? d.method : null,
    reviewReason: s(d.reviewReason),
    aadhaar: { verified: a.verified === true, last4: s(a.last4), name: s(a.name) },
    drivingLicence: { verified: l.verified === true, number: s(l.number), validTill: s(l.validTill), name: s(l.name) },
    documentsUploaded: d.documentsUploaded === true,
  };
}
