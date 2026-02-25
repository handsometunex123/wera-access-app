
# Westend Estate Ikota – Access Control PWA

## Overview
Westend Estate Ikota Access Control is a production-grade Progressive Web App (PWA) for secure, role-based access management in residential estates. Built with Next.js, TypeScript, PostgreSQL, Prisma, and TailwindCSS, it provides a modern, mobile-first experience for admins, residents, and estate guards.

## Features
- **Role-based access:** Admin, Main Resident, Dependant, Estate Guard
- **Secure authentication:** 6-digit numeric password, bcrypt hashing, single-device login
- **Access code generation:** Unique, time-limited QR codes for entry/exit
- **Admin dashboard:** Approvals, resident management, audit logs, payment requests
- **Resident dashboard:** Code generation, invite management, notifications, payments
- **Guard panel:** QR/manual code verification, scan history, dark mode
- **Notifications:** Real-time updates for check-ins, payments, broadcasts
- **Audit trail:** Logs all critical actions for security and compliance
- **Responsive UI:** Mobile-first, modern dashboard styling, PWA installable

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Styling:** TailwindCSS
- **Validation:** Zod
- **Password Hashing:** bcrypt
- **QR Code:** QR code generation library

## Folder Structure
```

1. **Initialize Next.js with TypeScript and App Router**
2. **Install dependencies:**
	- Prisma, PostgreSQL, TailwindCSS, Zod, bcrypt, QR code library
3. **Configure Prisma and PostgreSQL:**
	- Define models: User, Invite, AccessCode, Notification, AuditLog, PaymentRequest, SupportTicket, ProfileUpdateRequest
	- Run `prisma migrate`
4. **Set up TailwindCSS**
5. **Implement authentication:**
	- 6-digit numeric password, bcrypt hashing, single-device session
6. **Role-based middleware protection**
7. **Build UI:**
	- Admin, Resident, Guard panels with responsive layouts
8. **Implement notifications, payments, audit trail**
9. **PWA setup:**
	- Add `manifest.json`, service worker, offline caching
10. **Edge case handling:**
	 - Expired/used codes, disabled users, duplicate invites, etc.

## Key Models (Prisma)
**User:**
- id (uuid), estateUniqueId, role (ADMIN, MAIN_RESIDENT, DEPENDANT, ESTATE_GUARD), status, mainResidentId, sessionToken, fullName, email, phone, password (hashed), profileImage, address, createdAt, updatedAt

**AccessCode:**
- 6-digit code, createdById, inviteStart, inviteEnd, usageLimit, usageCount, usageType, status, qrCodeUrl, usedAt
- Invite, Notification, AuditLog, PaymentRequest, SupportTicket, ProfileUpdateRequest

## UI/UX Guidelines
- Mobile-first, responsive design
- Soft shadows, rounded corners, modern dashboard
- Emerald primary color, light gray backgrounds
- Clean code, SOLID principles

## Security & Best Practices
- Enforce single-device login
- Role-based route protection
- Audit logging for all sensitive actions

## Production Checklist
- [ ] Fully responsive and mobile-ready
- [ ] Role-isolated dashboards
- [ ] PWA installable and offline-ready
- [ ] Scalable for multiple estates
---

For detailed implementation steps, see the original project plan below.




Use role-based middleware protection.



Use clean modular architecture.



All UI must be responsive.



Mobile-first design.



Use soft shadows, rounded corners, and modern dashboard styling.



Follow clean code and SOLID principles.



Do not skip edge cases.





STEP 1 — INITIAL SETUP



Initialize Next.js with TypeScript and App Router.



Install Prisma and configure PostgreSQL.



Setup TailwindCSS.



Create base folder structure:



/app

&nbsp; /(auth)

&nbsp; /(admin)

&nbsp; /(resident)

&nbsp; /(guard)

&nbsp; /api

/components

/lib

/prisma

/middleware.ts



Setup Prisma client inside /lib/prisma.ts.





STEP 2 — DATABASE SCHEMA



Create the following Prisma models:



User



Invite



AccessCode



Notification



AuditLog



PaymentRequest



SupportTicket



ProfileUpdateRequest







User must include:



id (uuid)



estateUniqueId (string unique)



role (enum: ADMIN, MAIN\_RESIDENT, DEPENDANT, ESTATE\_GUARD)



status (enum: PENDING, APPROVED, DISABLED, REVOKED)



mainResidentId (nullable for dependants)



sessionToken (nullable)



fullName



email (unique)



phone



password (hashed)



profileImage



address



createdAt



updatedAt



AccessCode must include:



6-digit string code



createdById



inviteStart



inviteEnd



usageLimit



usageCount



usageType (ENTRY\_ONLY, ENTRY\_AND\_EXIT)



status (ACTIVE, USED, EXPIRED)



qrCodeUrl



usedAt





Add the other models



Run prisma migrate.





STEP 3 — AUTH SYSTEM



Implement credentials login.



Password must be exactly 6 numeric digits.



Hash password with bcrypt.



Enforce single device login:



Store sessionToken in User table.



On login, overwrite previous sessionToken.



Middleware must compare sessionToken from JWT with DB.



If mismatch → logout user.



Create:



Login page



Logout button



Force logout other session flow.







STEP 4 — UNIQUE ID GENERATION



Create utility:



If MAIN\_RESIDENT → prefix WERA/MN/



If DEPENDANT → prefix WERA/DP/



If ESTATE\_GUARD → prefix WERA/EG/



Append 5-digit incrementing number.



Store formatted ID in estateUniqueId.







STEP 5 — ROLE-BASED ROUTE PROTECTION



Implement middleware:



Block unauthorized role access.



Block DISABLED and REVOKED users from generating codes.



Allow disabled users to login but restrict functionality.







STEP 6 — ADMIN PANEL UI



Create admin layout with:



Sidebar (fixed)



Topbar



Responsive grid layout



Use Tailwind:



bg-gray-50 background



bg-white cards



shadow-md



rounded-xl



p-6 padding



emerald-600 primary color



Admin Dashboard



Display cards:



Total residents



Total dependants



Total guards



Active codes



Used today



Pending approvals



Use grid:



grid-cols-1 md:grid-cols-2 lg:grid-cols-4



Admin Approvals Page



Tabs:



Residents



Dependants



Guards



Profile Updates



Each row must display:



Profile image



Full name



Unique ID



Main resident (if dependant)



Approve button



Reject button



Approve updates status to APPROVED.

Reject updates status to REJECTED.



Log action in AuditLog.



Admin Resident Management



Features:



Disable resident



Revoke resident



Send onboarding invite (48hr expiry)



Broadcast message



If main resident disabled:



Automatically disable all dependants.





STEP 7 — RESIDENT PANEL UI



Mobile-first layout.



Bottom navigation on mobile.



Color:



Emerald primary



Light gray background



Clean rounded cards



Resident Dashboard



Display:



Quick Generate Code button



Recent codes



Notifications preview



Payment alerts



Quick generate:



Default 1 hour validity



Default usage: ENTRY\_AND\_EXIT



Default usageLimit: 1



Default inviteStart: now



Code Generation Page



Form fields:



Invite start time



Validity duration (30min – 16hrs)



Usage type



Myself or Others



Number of guests (if others)



Generate random 6-digit code.

Ensure uniqueness among ACTIVE codes.



Display:



QR code



Large 6-digit number



Valid from



Valid to



Usage count



Copy button



Require passcode modal confirmation before viewing codes list.



Manage Invites Page



Filter by:



Active



Used



Expired



Month/Year



Display card with:



QR preview



Code



Status badge



Usage progress bar



Resident Profile



Display:



Profile picture



Unique ID



Estate contacts



Support tickets



Dependants list (if main)



Logout



Feedback



Profile updates:



Create ProfileUpdateRequest



Require admin approval.



STEP 8 — ESTATE GUARD PANEL



Dark theme:



bg-slate-900



text-white





Modules:



QR Scan



Manual code entry



Scan history



On verification:



Validate code



Check ACTIVE



Check time window



Increment usageCount



If usageCount reaches limit → mark USED



Create notification for resident



Show modal:



Green success if valid



Red if invalid



Show resident name + code status





STEP 9 — NOTIFICATIONS



Create Notification model.



Trigger when:



Guest checked in



Guest checked out



Admin broadcast



Payment raised



Resident can:



View



Mark as read





STEP 10 — PAYMENT REQUEST MODULE



Admin:



Create payment request for resident



Mark as completed manually



Resident:



View payment



See status badge





STEP 11 — AUDIT TRAIL



Log:



Login



Code generation



Code verification



Approval actions



Disable actions



Payment actions



Admin can:



Filter by date



Filter by user



View metadata JSON





STEP 12 — CODE CLEANUP



Implement cron job:



Delete USED codes older than 10 days.



STEP 13 — PWA SETUP



Add manifest.json



Enable service worker



Make installable



Optimize for mobile



Ensure offline basic caching





STEP 14 — EDGE CASES



Handle:



Expired code



Already used code



Disabled resident generating code



Expired invite link



Duplicate invite



Multiple rapid verification attempts



Guard verifying same code twice



FINAL REQUIREMENTS



Fully responsive.



Secure.



Role-isolated.



Clean UI.



Production-ready.



Scalable to multiple estates.





