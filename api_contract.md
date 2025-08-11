# QuickCourt API Contract

**Base URL:** `/api/v1`

---

## 1. Auth Routes (`/auth`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---|---|---|---|
| POST | `/auth/register` | No | `name` (required), `email` (required), `password` (required), `role` (required: `user` \| `owner`) | — |
| POST | `/auth/login` | No | `email` (required), `password` (required) | — |
| POST | `/auth/logout` | Yes (any) | — | — |
| GET  | `/auth/me` | Yes (any) | — | — |
| POST | `/auth/refresh` | Yes (refresh token) | `refreshToken` (required) | — |
| POST | `/auth/forgot-password` | No | `email` (required) | — |
| POST | `/auth/reset-password` | No | `token` (required), `password` (required) | — |

---

## 2. Venue Routes (`/venues`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/venues` | No | — | `sportType`, `priceMin`, `priceMax`, `venueType`, `rating`, `q`, `page`, `limit`, `sort` |
| GET | `/venues/popular` | No | — | `limit` |
| GET | `/venues/:id` | No | — | — |
| POST | `/venues` | Yes (`owner`) | `name` (required), `description`, `address` (required), `shortLocation`, `locationCoords`, `venueType`, `sports` (array, required), `startingPrice` (required), `amenities` (array), `photos` (array), `operatingHours` | — |
| PUT | `/venues/:id` | Yes (`owner` or `admin`) | Any updatable venue fields | — |
| DELETE | `/venues/:id` | Yes (`owner` or `admin`) | — | — |
| GET | `/venues/:id/gallery` | No | — | — |
| POST | `/venues/:id/photos` | Yes (`owner`) | `photos` (files or URLs, required) | — |
| DELETE | `/venues/:id/photos/:photoId` | Yes (`owner` or `admin`) | — | — |
| GET | `/venues/:id/availability` | No | — | `date` |
| GET | `/venues/:id/reviews` | No | — | `page`, `limit`, `sort` |

---

## 3. Court Routes (`/courts`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/venues/:venueId/courts` | No | — | — |
| GET | `/courts/:id` | No | — | — |
| POST | `/venues/:venueId/courts` | Yes (`owner`) | `name` (required), `sportType` (required), `pricePerHour` (required), `operatingHours`, `metadata` | — |
| PUT | `/courts/:id` | Yes (`owner` or `admin`) | Any updatable court fields | — |
| DELETE | `/courts/:id` | Yes (`owner` or `admin`) | — | — |
| POST | `/courts/:id/block` | Yes (`owner`) | `date` (required), `startTime` (required), `endTime` (required), `reason` | — |
| POST | `/courts/:id/unblock` | Yes (`owner`) | `blockId` (required) | — |
| GET | `/courts/:id/availability` | No | — | `date` |

---

## 4. Time Slot & Availability Routes (`/timeslots`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/timeslots/venue/:venueId` | No | — | `date` |
| POST | `/timeslots/venue/:venueId` | Yes (`owner`) | `courtId` (required), `date` (required), `startTime`, `endTime`, `isRecurring` | — |
| PUT | `/timeslots/:id` | Yes (`owner` or `admin`) | Any updatable timeslot fields | — |
| DELETE | `/timeslots/:id` | Yes (`owner` or `admin`) | — | — |

---

## 5. Booking Routes (`/bookings`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| POST | `/bookings` | Yes (`user`) | `courtId` (required), `venueId` (required), `date` (required), `startTime` (required), `endTime` (required), `paymentMethod`, `meta` | — |
| GET | `/bookings/my` | Yes (`user`) | — | `status`, `dateFrom`, `dateTo`, `page`, `limit` |
| GET | `/bookings/:id` | Yes (owner/admin/user - authorized) | — | — |
| PUT | `/bookings/:id/cancel` | Yes (`user`) | — | — |
| POST | `/bookings/:id/confirm` | Yes (`owner` or system`) | — | — |
| GET | `/bookings/venue/:venueId` | Yes (`owner`) | — | `status`, `dateFrom`, `dateTo`, `page`, `limit` |
| GET | `/bookings/all` | Yes (`admin`) | — | filters, `page`, `limit` |
| PUT | `/bookings/:id/status` | Yes (`owner` or `admin`) | `status` (e.g., `confirmed`, `completed`, `cancelled`) | — |

---

## 6. Payment & Transaction Routes (`/payments`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| POST | `/payments/simulate` | Yes (any) | `bookingId` (required), `amount` (required), `method` | — |
| POST | `/payments/webhook` | No (webhook) | provider payload | — |
| GET | `/payments/booking/:bookingId` | Yes (user/owner/admin authorized) | — | — |
| GET | `/payments/owner/:ownerId` | Yes (`owner` or `admin`) | — | `dateFrom`, `dateTo` |

---

## 7. Review & Rating Routes (`/reviews`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| POST | `/venues/:venueId/reviews` | Yes (`user`) | `rating` (required), `title`, `comment` | — |
| GET | `/venues/:venueId/reviews` | No | — | `page`, `limit`, `sort` |
| PUT | `/reviews/:id` | Yes (`user` or `admin`) | `rating`, `title`, `comment` | — |
| DELETE | `/reviews/:id` | Yes (`user` or `admin`) | — | — |

---

## 8. Profile Routes (`/profile`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/profile` | Yes (any) | — | — |
| PUT | `/profile` | Yes (any) | `name`, `email`, `phone`, `avatar`, `preferences` | — |
| GET | `/profile/bookings` | Yes (any) | — | `page`, `limit`, `status` |
| GET | `/profile/earnings` | Yes (`owner`) | — | `dateFrom`, `dateTo` |
| GET | `/profile/stats` | Yes (`owner`) | — | `period` |

---

## 9. Owner Dashboard Routes (`/owner`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/owner/stats` | Yes (`owner`) | — | `dateFrom`, `dateTo`, `granularity` |
| GET | `/owner/venues` | Yes (`owner`) | — | `page`, `limit` |
| GET | `/owner/venues/:id/bookings` | Yes (`owner`) | — | `status`, `dateFrom`, `dateTo`, `page`, `limit` |
| POST | `/owner/venues/:id/courts` | Yes (`owner`) | court create fields | — |
| PUT | `/owner/courts/:id` | Yes (`owner`) | court update fields | — |
| GET | `/owner/transactions` | Yes (`owner`) | — | `dateFrom`, `dateTo`, `page`, `limit` |

---

## 10. Admin Routes (`/admin`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/admin/stats` | Yes (`admin`) | — | `dateFrom`, `dateTo`, `granularity` |
| GET | `/admin/facilities/pending` | Yes (`admin`) | — | `page`, `limit` |
| GET | `/admin/facilities/:id` | Yes (`admin`) | — | — |
| PATCH | `/admin/facilities/:id/approve` | Yes (`admin`) | `approved` (required boolean), `comments` | — |
| PATCH | `/admin/facilities/:id/reject` | Yes (`admin`) | `comments` (required) | — |
| GET | `/admin/users` | Yes (`admin`) | — | `role`, `status`, `q`, `page`, `limit` |
| PATCH | `/admin/users/:id/ban` | Yes (`admin`) | `reason`, `until` | — |
| PATCH | `/admin/users/:id/unban` | Yes (`admin`) | — | — |
| GET | `/admin/reports` | Yes (`admin`) | — | `type`, `status`, `page`, `limit` |
| POST | `/admin/reports/:id/action` | Yes (`admin`) | `action` (e.g., `remove`, `warn`, `ban`), `notes` | — |

---

## 11. Analytics / Charts Routes (`/analytics`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/analytics/bookings/trends` | Yes (`owner` or `admin`) | — | `dateFrom`, `dateTo`, `granularity` |
| GET | `/analytics/earnings` | Yes (`owner` or `admin`) | — | `dateFrom`, `dateTo`, `granularity` |
| GET | `/analytics/peak-hours` | Yes (`owner` or `admin`) | — | `dateFrom`, `dateTo` |
| GET | `/analytics/most-active-sports` | Yes (`admin`) | — | `dateFrom`, `dateTo`, `limit` |

---

## 12. Reports & Moderation Routes (`/reports`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| POST | `/reports` | Yes (any) | `type` (required), `targetId` (required), `reason` (required), `details` | — |
| GET | `/reports/my` | Yes (any) | — | `page`, `limit` |
| GET | `/reports` | Yes (`admin`) | — | `status`, `type`, `page`, `limit` |
| PUT | `/reports/:id` | Yes (`admin`) | `status`, `notes` | — |

---

## 13. Notifications Routes (`/notifications`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/notifications` | Yes (any) | — | `page`, `limit`, `unread` |
| POST | `/notifications` | Yes (`admin` or `system`) | `userId` (or `role`), `title`, `message`, `meta` | — |
| PUT | `/notifications/:id/read` | Yes (any) | — | — |
| DELETE | `/notifications/:id` | Yes (any) | — | — |

---

## 14. Uploads & Media Routes (`/uploads`)

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| POST | `/uploads` | Yes (owner/admin) | `file` (required), `type` | — |
| GET | `/uploads/:id` | No | — | — |
| DELETE | `/uploads/:id` | Yes (owner/admin) | — | — |

---

## 15. Utility Routes

| Method | Endpoint | Auth | Request Body (fields) | Query Params |
|---|---:|:---:|---|---|
| GET | `/health` | No | — | — |
| GET | `/seed` | Yes (`admin`) | — | — |

---
