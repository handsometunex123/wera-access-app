# WERA Access Admin Panel TODO

## Completed
- [x] Admin invite flow (API, email, UI)
- [x] Invite tracking (view, resend, revoke, pagination)
- [x] User access management (disable/revoke, cascading, UI, pagination)
- [x] Pagination for all list endpoints and UIs
- [x] Admin code generation (API, UI, QR, audit logging)
- [x] Access code management (list, search, revoke, details, QR)
- [x] User management (list, search, filter, disable/revoke, details)

## In Progress / Next
- [x] Resident/Guard registration approval flow
- [x] Resident/Guard profile update requests (approve/reject)
- [x] Notification management (send, view, mark as read)
- [x] Payment request management (view, approve, reject)
- [x] Support ticket management (view, respond, close)
- [x] Audit log viewing (filter by user, action, date)
- [x] Admin dashboard (stats, recent activity)
- [ ] Error handling and user feedback improvements
- [ ] Security review and access control hardening
- [ ] Documentation and onboarding guide

---

- Each module should have API endpoints, UI, and error handling.
- All lists should support pagination and filtering.
- All actions should be logged in the audit log.
- Test each feature after implementation.
