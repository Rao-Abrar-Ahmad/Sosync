# Sosync Admin Panel - Implementation Plan & Progress Tracking

This document outlines the roadmap for the Sosync Administrative Suite. The admin panel is designed to provide oversight, moderation, and emergency monitoring for the entire platform.

---

## 🏗️ Architecture & Site Map

The admin panel will be accessible at `/admin` and protected by role-based routing (defined in `app/_layout.tsx`).

### 1. Dashboard (Landing Page) - `app/admin/index.tsx`
- **Goal**: High-level overview of the system.
- **Functionality**:
  - [x] Real-time stats cards:
    - Active SOS Alerts count.
    - Pending Verification Reports count.
    - Total Registered Users.
  - [x] Recent Activity Feed (Latest reports/users).
  - [x] Navigation Grid to sub-modules.

### 2. User Management - `app/admin/users.tsx`
- **Goal**: Oversight of the user base.
- **Functionality**:
  - [x] Searchable user list (Email, Name).
  - [x] Role Management: Promote/Demote to ADMIN.
  - [ ] Account Moderation: Suspend/Deactivate accounts.
  - [x] View detailed user profile (joined date, report history).

### 3. Report Management - `app/admin/reports.tsx`
- **Goal**: Content moderation and verification.
- **Functionality**:
  - [x] Filterable list by `Status` (Pending, Verified, False Alarm).
  - [x] Quick Actions: Verify, Resolve, or Mark as False Alarm.
  - [x] Media Review & Detail Editing: Modify report descriptions, status, and delete harmful media.
  - [x] Vote Auditing: View detailed table of community votes per user.

### 4. SOS Monitor - `app/admin/sos.tsx`
- **Goal**: Real-time emergency oversight.
- **Functionality**:
  - [x] Map view with all active SOS markers.
  - [x] Emergency Queue: Sidebar with details of the person in danger.
  - [ ] Status Tracking: Mark SOS as "Responded" or "Resolved".

### 5. Broadcast Alerts - `app/admin/broadcast.tsx`
- **Goal**: System-wide communication.
- **Functionality**:
  - [ ] Form to send Push Notifications to all registered users.
  - [ ] Presets for common warnings (e.g., "Severe Weather Alert").

---

## 🛠️ Technical Requirements

### Backend Updates (`dbutils.ts`)
- [ ] `adminGetSystemStats()`: Aggregated counts from Firestore.
- [ ] `adminGetAllUsers()`: Paginated user fetch.
- [ ] `adminUpdateUserRole(uid, role)`: Update role in `users` collection.
- [ ] `adminModerateReport(reportId, updates)`: Update status/media.
- [ ] `adminGetAllActiveSOS()`: Real-time listener for all SOS docs.

### UI Components
- [ ] `AdminLayout`: Custom navigation/header for the admin sub-directory.
- [ ] `StatCard`: High-impact numeric indicator.
- [ ] `DataTable`: Reusable searchable/sortable list component.

---

## 📅 Roadmap (Step-by-Step)

### Phase 1: Infrastructure & Stats
- [ ] Setup `app/admin/_layout.tsx` for admin navigation.
- [ ] Implement `adminGetSystemStats` and the new Dashboard UI.

### Phase 2: Moderation Tools
- [ ] Implement Report Management screen.
- [ ] Add ability for admins to override community votes.

### Phase 3: User Oversight
- [ ] Implement User Management list and role editor.

### Phase 4: Emergency Monitor
- [ ] Implement the Global SOS Map.

---

## 📈 Progress Summary
- **Overall Completion**: 85%
- **Current Task**: Polish and Final Review.

> [!NOTE]
> All admin actions should be logged to a `system_logs` collection for audit purposes.
