/** Terms & Conditions, verbatim from the app (lib/core/constants/legal_text.dart). */
export const TERMS = `# Carlust Automotive Pvt Ltd - Terms & Conditions

## 1. Introduction

Welcome to **Carlust Automotive Pvt Ltd**. These Terms & Conditions govern the rights, responsibilities, and obligations of **Hosts** (Vehicle Owners) and **Guests** (Renters) using our platform. You agree to abide by these terms by accessing or using our services.

## 2. Definitions

- "Host" refers to an individual or entity listing their vehicle for rental on our platform.
- "Guest" refers to an individual renting a vehicle through our platform.
- "Carlust" refers to Carlust Automotive Pvt Ltd.
- "Vehicle" refers to any car listed on our platform.
- "Booking" refers to a confirmed rental agreement between a Guest and a Host.

## 3. Eligibility Criteria

### For Hosts:
- Vehicles must be less than 7 years old and have driven under 70,000 kilometers.
- Vehicles must have valid registration, insurance, and a pollution certificate.
- Hosts must ensure vehicles meet safety and maintenance standards.

### For Guests:
- Guests must be at least 21 years old with a valid driving license.
- Some vehicle categories may require a minimum age of 21 or 25.
- Guests must have a verified identity and pass any background checks as required by Carlust.

## 4. Vehicle Listing & Maintenance (For Hosts)
- Hosts must ensure their vehicle is roadworthy, clean, and well-maintained before every booking.
- Any pre-existing damage or mechanical issues must be reported before listing.
- Hosts must promptly update availability to avoid conflicts.
- Hosts are required to maintain valid insurance coverage at all times.

## 5. Booking & Payments

### For Guests:
- All bookings must be made through the Carlust platform.
- Payments must be completed before vehicle pickup.
- Guests may be required to pay a refundable security deposit, which varies by vehicle type.

### For Hosts:
- Hosts will receive a percentage of the rental fee, based on their agreement with Carlust.
- Earnings will be disbursed on a monthly basis after deduction of any penalties or fees.
- Carlust charges a service fee per transaction.

## 6. Usage Policies (For Guests)
- Guests must return the vehicle in the same condition as received.
- Vehicles cannot be used for commercial purposes (e.g., ridesharing, delivery services) unless explicitly authorized.
- Guests must comply with all traffic laws and regulations.
- Any traffic violations or penalties incurred during the rental period are the Guest's responsibility.

## 7. Fuel Policy
- Vehicles must be returned with the same fuel level as at pickup.
- Fuel costs during the rental are borne by the Guest.
- If the vehicle is returned with a lower fuel level, a refueling charge will apply.

## 8. Damages & Liability

### For Guests:
- Guests are fully responsible for any damages occurring during the rental period.
- In case of an accident, Guests must immediately inform Carlust and the Host.
- If damages exceed the insurance coverage, the Guest must bear additional costs.

### For Hosts:
- Hosts must report any post-rental damages within 24 hours.
- Carlust will facilitate insurance claims where applicable.
- If a Guest is found liable, the Host will be reimbursed as per policy terms.

## 9. Cancellations & Refunds

### For Guests:
- Cancellations made 48 hours before the booking start time are eligible for a full refund.
- Late cancellations may result in a partial refund or no refund.
- No-shows are not eligible for refunds.

### For Hosts:
- Hosts must honor all confirmed bookings.
- Unjustified cancellations can lead to penalties or delisting.
- If a vehicle is unavailable or breaks down, the Host must immediately inform Carlust.

## 10. Dispute Resolution
- Any disputes between Hosts and Guests will be handled by Carlust's dispute resolution team.
- Decisions will be made based on documented evidence and platform policies.
- Both parties must cooperate with Carlust's investigation process.

## 11. Prohibited Activities
- Sub-renting or lending the vehicle to third parties is strictly prohibited.
- Vehicles must not be used for illegal activities.
- Guests must not drive under the influence of alcohol or drugs.
- Tampering with vehicle tracking systems (if installed) is not allowed.

## 12. Platform Conduct & Penalties
- Users must communicate professionally and respectfully.
- Misuse of the platform (fraudulent bookings, fake reviews, etc.) may result in account suspension.
- Repeated policy violations may lead to permanent banning from Carlust.

## 13. Insurance & Coverage
- Vehicles listed on Carlust must have comprehensive insurance.
- In case of theft, accident, or natural disasters, user will be liable.

## 14. Termination & Account Suspension
- Carlust reserves the right to suspend or terminate accounts for policy violations.
- Users found engaging in fraudulent or unethical activities will be permanently removed.
- Appeals for account reactivation must be submitted via official channels.

## 15. Updates & Amendments
- Carlust reserves the right to modify these Terms & Conditions at any time.
- Users will be notified of significant changes via email or platform notifications.
- Continued use of the platform constitutes acceptance of updated policies.

## 16. Contact Information

For any queries, disputes, or support, please contact us:
- Email: carlust0001@gmail.com
- Phone: +91 8000585654
- Website: http://www.carlust.in/

By using Carlust's services, you acknowledge and agree to these Terms & Conditions.`;

/** Pulls one "## N. Title" section (with its subsections) out of the Terms. */
export function termsSection(title: string) {
  const start = TERMS.search(new RegExp(`^## \\d+\\. ${title}`, "m"));
  if (start < 0) return "";
  const rest = TERMS.slice(start);
  const next = rest.slice(3).search(/^## \d+\./m);
  return next < 0 ? rest : rest.slice(0, next + 3);
}
