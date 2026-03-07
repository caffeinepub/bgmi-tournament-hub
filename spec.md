# BGMI Tournament Hub

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- **Tournament Listings Page**: Public page showing all active/upcoming tournaments with name, prize pool, entry fee, slot count, and status.
- **Registration Flow**: "Join Tournament" button opens a multi-step form: (1) Player details (Name, Email, Phone, BGMI In-game ID), (2) Payment screen with UPI QR code image and payment screenshot upload.
- **Room ID Reveal**: After admin verifies payment, the Room ID and Password are shown to the registered player on their profile/my-registrations page.
- **Admin Panel**: Protected admin route where the admin can:
  - Create/edit/delete tournaments (name, prize pool, entry fee, max slots, UPI QR image, start time)
  - View all registrations per tournament (player info + payment screenshot)
  - Verify/reject payments
  - Set Room ID and Password per tournament (visible only to verified players)
- **Slot Limit Enforcement**: Join button auto-disables when max slots are filled.
- **Player Auth**: Players log in with Internet Identity to track their registrations.
- **Admin Auth**: Admin role gated -- only designated admin principal can access admin panel.

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan
1. Select components: authorization (role-based access for admin vs player), blob-storage (payment screenshot uploads, UPI QR image uploads)
2. Generate Motoko backend with:
   - Tournament CRUD (admin only)
   - Registration creation with slot enforcement
   - Payment verification (admin only sets status: Pending/Verified/Rejected)
   - Room ID/Password storage per tournament (admin sets, only revealed to verified players)
   - Blob storage integration for screenshots and QR images
3. Frontend:
   - Public home page: tournament cards grid
   - Tournament detail page with join flow (multi-step: form -> payment upload)
   - My Registrations page (player view, shows room ID if verified)
   - Admin panel: tournament management, registrations table with verify/reject actions
   - Dark gaming UI with neon green/cyan accents, glowing effects
