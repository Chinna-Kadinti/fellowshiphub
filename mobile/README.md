# FellowshipHub Mobile

This directory contains the bundled Android and iOS application for FellowshipHub.
It is a Capacitor 8 application with a React/Vite user interface. The existing
Next.js application remains the hosted API and PostgreSQL/Prisma backend.

The mobile application preserves the current roles and features:

- Login, registration, seven-day sessions, and logout
- Dashboard, RSVP summary, daily verse, prayer preview, and upcoming meetings
- Meeting list/detail, RSVP, arrival status, check-in, Maps, and volunteers
- Leader meeting creation/deletion and attendance management
- Announcements and leader announcement creation
- Resource search, external resources, and leader resource creation
- Public/private prayer requests, prayed interactions, and request status
- Discussion channels, posting, and leader message deletion
- Reading plans, completion progress, and leader plan creation
- Directory profile/privacy editing and member directory
- Leader attendance, RSVP, prayer, and reading reports

## Architecture

The phone contains the compiled `mobile/dist` SPA. It does not load the web site
inside a remote WebView. The SPA calls the hosted Next.js API at:

```text
VITE_API_URL + /api/mobile/v1
```

Authentication uses a bearer JWT. The token is stored in the iOS Keychain and in
Android encrypted storage. All server-side authorization, privacy rules, and input
validation remain enforced by the Next.js backend.

PostgreSQL cannot run inside the mobile application. A reachable HTTPS deployment
of the FellowshipHub backend is required.

## Free installable deployment

The current free production deployment is available at:

- Mobile PWA: `https://fellowshiphub-mobile.vercel.app`
- Next.js API/web application: `https://fellowshiphub-two.vercel.app`

On Android, open the mobile URL in Chrome and tap the in-app **Install app**
button. Chrome can also expose **Install app** or **Add to Home screen** in its
three-dot menu after the page has been open and used briefly. Do not use an
Incognito tab. On iPhone or iPad, open it in Safari, choose **Share**, then
**Add to Home Screen**. The PWA uses the same mobile UI and API as the Capacitor
applications.

The deployment uses Vercel Hobby and a Neon Free PostgreSQL resource. Free-tier
quota exhaustion can pause or suspend service until the allowance resets; it does
not provide a production uptime guarantee.

## Prerequisites

- Node.js 22.12 or newer for the mobile workspace
- A running FellowshipHub backend and PostgreSQL database
- Android Studio with Android SDK 36 for Android
- macOS with Xcode 26 or newer for iOS
- Apple Developer and Google Play accounts for store distribution

The repository currently uses `com.fellowshiphub.app` as a placeholder application
ID. Replace it with an identifier owned by your organization before signing or
registering the application in either store.

## Configure the backend

Set these values in the deployed Next.js environment:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=use-a-long-random-production-secret
NEXT_PUBLIC_APP_URL=https://fellowshiphub.your-domain.example
COOKIE_SECURE=true
MOBILE_ALLOWED_ORIGINS=capacitor://localhost,https://localhost,http://localhost
```

Keep `capacitor://localhost` for iOS and `https://localhost` for Android. The API
also accepts comma-separated development origins when explicitly configured.

Deploy the backend over HTTPS before building a distributable mobile application.

## Configure and build the mobile bundle

From `mobile`:

```bash
cp .env.example .env
```

Set the public backend origin without a trailing `/api` path:

```env
VITE_API_URL=https://fellowshiphub.your-domain.example
```

Then install, build, and synchronize:

```bash
npm install
npm run typecheck
npm run native:sync
```

`VITE_API_URL` is compiled into the app. Run `native:sync` again after changing it
or after making any mobile UI change. Production builds intentionally stop with
an error when this value is missing or does not use HTTPS.

Do not run `npx cap add` again: both native projects are already present.

## Android

Open the generated project:

```bash
npm run native:android
```

Or build from the command line after Android Studio has installed its JDK and SDK:

```bash
cd android
./gradlew assembleDebug
```

On Windows, use:

```powershell
.\gradlew.bat assembleDebug
```

For a Play Store release, set the final application ID, version, signing keystore,
and release configuration in Android Studio, then generate a signed Android App
Bundle.

## iOS

iOS compilation and signing require macOS:

```bash
npm run native:ios
```

In Xcode, select the final bundle identifier, development team, version/build
number, simulator or device, and signing profile. Archive the application for App
Store Connect from Xcode.

Capacitor uses Swift Package Manager. The sync script normalizes generated package
paths so the checked-in project remains portable between Windows and macOS.

## Native behavior included

- Bottom navigation with a More sheet for all nine destinations
- iOS/Android safe-area and edge-to-edge system-bar handling
- Rotation-aware layouts, native splash screens, and platform icon sets
- Android hardware Back behavior and registered `fellowshiphub://` deep links
- Network-aware query retry behavior
- Native browser presentation for Google Maps and resource URLs
- Keyboard-resizing support for long forms
- Encrypted/Keychain token persistence across cold starts

The generated icon and splash resources are checked in. If the brand artwork is
changed later, regenerate them with a current, security-reviewed release of the
official `@capacitor/assets` tool rather than keeping an asset generator in the
runtime project dependencies.

Custom links such as `fellowshiphub://meetings/MEETING_ID` and
`fellowshiphub://dashboard` open registered in-app destinations. HTTPS links are
accepted by the runtime only from the configured backend origin; universal/app
links still require the final production domain to be registered with Apple and
Google before release.

## Validation commands

```bash
npm run typecheck
npm run build
npm run native:doctor
```

The Next.js backend should also pass:

```bash
npm run build
```

Before a release, test the complete member/admin matrix on a physical Android
device and physical iPhone, including session expiry, offline recovery, external
resources, all meeting actions, private prayer visibility, and logout/account
switching.

## Store submission checklist

Code generation does not provide store accounts, signing identities, privacy
policy/support URLs, screenshots, or production credentials. Those must be supplied
for the organization publishing FellowshipHub.

The existing feature set also contains user registration and user-generated prayer
and discussion content. Review the current Apple and Google requirements for
in-app account deletion, content reporting/moderation, privacy disclosures, and
review credentials before submission. Those product-policy additions were not
invented here because the conversion was required to preserve the current feature
set.
