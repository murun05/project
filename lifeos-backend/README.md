# LIFEOS backend

A NestJS + GraphQL + MongoDB backend for the LIFEOS blueprint. Its structure follows the Insurance-AI example
(an API app, a separate batch app, one schema file per collection, DTOs, enums, guards), but the code is written for LIFEOS.

## What it does
- **Accounts:** register and login with a JWT. Every record belongs to one member, and every query filters by that member.
- **Six record types** in one central `life_records` collection: purchase, belonging, food, subscription, document, errand.
- **Connected records** (`record_links`): a purchase can also create a linked belonging, a linked receipt document, return and warranty reminders, and a return errand. The member chooses which, through `PurchaseOptionsInput`.
- **Reminders** are derived from record dates (return, warranty, expiry, renewal, free-trial end) and shown inside a lead window, in the member's own timezone.
- **Safe completion:** finishing an errand never completes anything else. It only returns `suggestedReminderId` so the client can ask first.
- **Renewals and trials:** completing a renewal advances the date by one billing cycle (month ends are clamped, so Jan 31 becomes Feb 28). Handling a trial sets the first payment date as the next renewal.
- **Money** is stored as integer minor units plus a currency code. Amounts are sent as decimal strings.
- **"Do I already own this?"** (`ownershipCheck`, `shoppingList`) checks belongings and food by name.
- **Subscription summary:** monthly and yearly cost per currency, free trials excluded, plus the yearly cost of subscriptions marked unused.
- **Batch app:** hourly job that finds reminders that entered their window, sends them once, and sets `deliveredAt`.

## Run it
Needs Node 22+ and a MongoDB instance.

    cp .env.example .env        # set MONGO_URL and a long random SECRET_TOKEN
    npm install
    npm run start:dev           # API on http://localhost:3007/graphql
    npm run start:dev:batch     # reminder job (or: npm run build && npm run batch:once)
    npm test                    # unit tests (no database needed)

## Example
    mutation { register(input: { email: "me@example.com", password: "a-long-password", displayName: "Me", timezone: "Asia/Seoul" }) { accessToken } }

Send the token as `Authorization: Bearer <token>`, then:

    mutation {
      createRecord(
        input: { type: PURCHASE, title: "Wireless headphones", amount: "129000", currency: "KRW",
                 purchaseDate: "2026-10-20", returnBy: "2026-11-05", warrantyEnd: "2027-10-20" }
        options: { trackInStuff: true, receiptName: "headphones-receipt.pdf", createReturnErrand: true }
      ) { _id title }
    }
    query { myActions { title kind date daysUntil urgent chargeMinor currency } }

`schema.graphql` holds the full generated schema.

## Not done yet
- **Not run against a real MongoDB.** The pure logic (dates, money, reminder rules, validation, matching) is unit-tested, and the GraphQL server, login guard and validation are tested with a fake database. The services that talk to MongoDB have not been run.
- Email or push delivery: the batch job only logs `[would notify ...]`.
- Receipt file upload and storage. A receipt is currently a name only.
- Rate limiting on login, password reset, email verification.
- Calendar (.ics) and data export, receipt scanning, AI features.
- The HTML front end still stores data in the browser and does not call this API yet.
