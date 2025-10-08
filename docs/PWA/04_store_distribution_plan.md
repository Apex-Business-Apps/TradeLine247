# Store Distribution Plan - AutoRepAi PWA

This document outlines the complete packaging and submission process for distributing AutoRepAi as a native app across Microsoft Store (Windows), Google Play (Android), and Apple App Store (iOS/iPadOS).

---

## 1. Microsoft Store (Windows)

### Overview
Package the AutoRepAi PWA using **PWABuilder** to create a Windows app package suitable for Microsoft Store submission.

### Required Assets

#### App Icons
- **Square 44x44**: `public/icons/windows-44x44.png`
- **Square 71x71**: `public/icons/windows-71x71.png`
- **Square 150x150**: `public/icons/windows-150x150.png`
- **Square 310x310**: `public/icons/windows-310x310.png`
- **Wide 310x150**: `public/icons/windows-310x150.png`

#### Store Listing Assets
- **App screenshots** (minimum 1, recommended 4-5):
  - Desktop: 1366x768 or higher
  - Tablet: 768x1024 or higher
- **Promotional images**:
  - Hero image: 1920x1080
  - Store logo: 300x300

#### Metadata
- App name: "AutoRepAi"
- Publisher display name: [Your Company Name]
- Short description (≤200 characters)
- Full description (≤10,000 characters)
- Keywords (up to 7)
- Age rating
- Privacy policy URL
- Support contact information

### Packaging Steps

#### A. Generate Package via PWABuilder
1. Navigate to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter production URL: `https://yourdomain.com`
3. PWABuilder will analyze your PWA and generate a report
4. Click "Build My PWA" → Select "Windows"
5. Configure options:
   - Package ID: `com.autorepaica.app`
   - Publisher: Use your Partner Center publisher ID
   - Version: `1.0.0.0`
   - App name: `AutoRepAi`
6. Download the generated `.msixbundle` package

#### B. Sign the Package
```powershell
# Install Windows SDK if not present
# Sign with your code signing certificate
signtool sign /fd SHA256 /a /f YourCertificate.pfx /p YourPassword AutoRepAi.msixbundle
```

### Partner Center Submission Steps

#### Prerequisites
- Microsoft Partner Center account (one-time $19 registration)
- Valid code signing certificate (or use Partner Center signing)

#### Submission Checklist
1. **Create New App**
   - Go to [Partner Center](https://partner.microsoft.com/dashboard)
   - Apps and Games → New App → Reserve app name "AutoRepAi"

2. **Age Ratings & Certifications**
   - Complete IARC questionnaire
   - Select appropriate age rating (likely PEGI 3 / ESRB Everyone)

3. **Properties**
   - Set category: Business / Productivity
   - Add subcategory if applicable
   - Privacy policy URL: `https://yourdomain.com/privacy`
   - Support contact info

4. **Packages**
   - Upload `.msixbundle` generated from PWABuilder
   - Or upload `.msix` package if using manual packaging

5. **Store Listings**
   - Upload all required assets (icons, screenshots)
   - Enter descriptions, keywords
   - Add localized listings if supporting multiple languages

6. **Pricing & Availability**
   - Set to "Free"
   - Select markets (all markets or specific regions)
   - Set visibility (public, private, or hidden)

7. **Submit for Certification**
   - Review all sections
   - Submit for review (typically 24-48 hours)

### Validation Requirements
- ✅ PWA must have valid HTTPS
- ✅ Service worker registered
- ✅ Valid web manifest with required fields
- ✅ App must launch successfully on Windows 10/11
- ✅ No crashes or major bugs
- ✅ Privacy policy accessible
- ✅ Content complies with Microsoft Store Policies

### Post-Submission
- Monitor certification status in Partner Center
- Address any rejection reasons if applicable
- Once approved, app goes live within 1-2 hours
- Update version by uploading new packages as needed

---

## 2. Google Play (Android)

### Overview
Wrap the AutoRepAi PWA using **Trusted Web Activity (TWA)** via Bubblewrap or PWABuilder to create an Android app package.

### Required Assets

#### App Icons
- **Launcher icon**: 512x512 PNG (adaptive icon recommended)
- **High-res icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG (required for store listing)

#### Store Listing Assets
- **Screenshots** (minimum 2, recommended 4-8):
  - Phone: 320-3840px on long side
  - 7-inch tablet: 1024-7680px
  - 10-inch tablet: 1024-7680px
- **Promotional video** (optional): YouTube URL
- **Promo graphic**: 180x120 PNG (optional)

#### Metadata
- App name: "AutoRepAi"
- Short description: ≤80 characters
- Full description: ≤4000 characters
- Developer name
- Developer email
- Privacy policy URL
- App category: Business

### Packaging Steps

#### A. Generate APK via PWABuilder
1. Go to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter production URL: `https://yourdomain.com`
3. Select "Android" → "Build My PWA"
4. Configure TWA settings:
   - Package ID: `app.autorepaica.twa`
   - App name: `AutoRepAi`
   - Launcher name: `AutoRepAi`
   - Theme color: `#3b82f6`
   - Background color: `#ffffff`
   - Icon URL: `https://yourdomain.com/logo.png`
   - Splash screen: Enable
   - Start URL: `/`
5. Download generated Android project or APK/AAB

#### B. Digital Asset Links (CRITICAL)
1. **Create `assetlinks.json`** in `public/.well-known/`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.autorepaica.twa",
    "sha256_cert_fingerprints": [
      "YOUR_RELEASE_KEY_SHA256_FINGERPRINT"
    ]
  }
}]
```

2. **Generate SHA256 fingerprint**:
```bash
# For upload key
keytool -list -v -keystore your-release-key.jks -alias your-key-alias

# Copy the SHA256 fingerprint (remove colons)
```

3. **Verify accessibility**:
   - Ensure `https://yourdomain.com/.well-known/assetlinks.json` is publicly accessible
   - Test with [Statement List Generator](https://developers.google.com/digital-asset-links/tools/generator)

#### C. Sign the APK/AAB
```bash
# Build release bundle (recommended over APK)
./gradlew bundleRelease

# Sign with jarsigner
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your-release-key.jks \
  app/build/outputs/bundle/release/app-release.aab \
  your-key-alias

# Or use Android Studio: Build → Generate Signed Bundle/APK
```

### Google Play Console Submission Steps

#### Prerequisites
- Google Play Developer account ($25 one-time fee)
- Signed `.aab` (Android App Bundle) or `.apk`
- Digital Asset Links configured and verified

#### Submission Checklist
1. **Create New App**
   - Go to [Google Play Console](https://play.google.com/console)
   - All apps → Create app
   - App name: "AutoRepAi"
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

2. **Store Listing**
   - Upload app icon (512x512)
   - Upload feature graphic (1024x500)
   - Upload minimum 2 screenshots per form factor
   - Enter short description (≤80 chars)
   - Enter full description (≤4000 chars)
   - Set app category: Business
   - Add developer contact: email, website, privacy policy

3. **Content Rating**
   - Complete IARC questionnaire
   - Submit for rating (automated, instant)

4. **App Content**
   - Privacy policy URL
   - Ads: Select "No, my app does not contain ads" (or Yes if applicable)
   - App access: Full access or restricted
   - Target audience: Select age groups
   - Data safety: Complete data collection disclosure

5. **Release**
   - **Internal Testing** (recommended first):
     - Create internal testing release
     - Upload signed `.aab`
     - Add testers by email
     - Test thoroughly

   - **Closed Testing** (optional):
     - Create closed alpha/beta track
     - Add larger tester group
     - Collect feedback

   - **Production**:
     - Create production release
     - Upload final signed `.aab`
     - Set rollout percentage (start with 20%, then 50%, 100%)
     - Review and confirm

6. **Pricing & Distribution**
   - Set countries/regions
   - Confirm content guidelines compliance
   - Submit for review

### Validation Requirements
- ✅ Valid Digital Asset Links configured
- ✅ TWA opens fullscreen without browser UI
- ✅ HTTPS domain verified
- ✅ APK/AAB signed with release keystore
- ✅ Target Android 13 (API 33) or higher
- ✅ Privacy policy accessible
- ✅ Content complies with Google Play Policies
- ✅ No crashes on target devices

### Post-Submission
- Review process: 3-7 days (sometimes faster)
- Address any policy violations if flagged
- Once approved, app is live on Google Play
- Monitor Play Console for crashes, ANRs, and reviews
- Update by uploading new AAB to production track

---

## 3. Apple App Store (iOS/iPadOS)

### Overview
Wrap the AutoRepAi PWA with a **native iOS shell using Capacitor** to create an iOS app suitable for App Store submission.

### Required Assets

#### App Icons (all required sizes)
- **App Store**: 1024x1024 PNG (no alpha, no rounded corners)
- **iPhone**:
  - 60x60@2x (120x120)
  - 60x60@3x (180x180)
- **iPad**:
  - 76x76@2x (152x152)
  - 83.5x83.5@2x (167x167)
- **Settings**: 29x29@2x, 29x29@3x
- **Spotlight**: 40x40@2x, 40x40@3x

#### Store Listing Assets
- **Screenshots** (required for each device type):
  - iPhone 6.7": 1290x2796 (3 minimum)
  - iPhone 6.5": 1242x2688 (3 minimum)
  - iPad Pro 12.9": 2048x2732 (3 minimum)
- **App Previews** (optional): Video previews up to 30s
- **Promotional text**: ≤170 characters (optional)

#### Metadata
- App name: "AutoRepAi" (≤30 characters)
- Subtitle: ≤30 characters
- Description: ≤4000 characters
- Keywords: ≤100 characters (comma-separated)
- Support URL
- Marketing URL (optional)
- Privacy policy URL (required)

### Packaging Steps with Capacitor

#### A. Initialize Capacitor (if not done)
```bash
# Already configured in capacitor.config.ts
# Ensure production build points to bundled assets

# Update capacitor.config.ts for production:
# Remove or comment out server.url
# Ensure webDir: 'dist'
```

**Production `capacitor.config.ts`**:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8c580ccbd2ed4900a1daf3b4f211efc8',
  appName: 'AutoRepAi',
  webDir: 'dist',
  // server block removed for production
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false
    }
  }
};

export default config;
```

#### B. Build iOS App
```bash
# 1. Build web assets
npm run build

# 2. Add iOS platform (if not added)
npx cap add ios

# 3. Sync assets to iOS
npx cap sync ios

# 4. Open Xcode
npx cap open ios
```

#### C. Configure in Xcode
1. **Signing & Capabilities**:
   - Select your Team
   - Ensure Bundle Identifier matches App ID: `app.lovable.8c580ccbd2ed4900a1daf3b4f211efc8`
   - Enable automatic signing or configure manual provisioning

2. **App Icons**:
   - Add all icon sizes to `App/App/Assets.xcassets/AppIcon.appiconset`

3. **Info.plist**:
   - Set `CFBundleDisplayName`: "AutoRepAi"
   - Add usage descriptions if using device features:
     - `NSCameraUsageDescription`: "To upload vehicle photos"
     - `NSLocationWhenInUseUsageDescription`: "To find nearby dealers"

4. **Build Settings**:
   - Deployment target: iOS 13.0 or higher
   - Supported devices: iPhone, iPad

#### D. Archive and Upload
```bash
# In Xcode:
# 1. Select "Any iOS Device" as build target
# 2. Product → Archive
# 3. Once archive completes, Organizer opens
# 4. Select archive → Distribute App → App Store Connect
# 5. Follow wizard: Upload, Automatically manage signing
# 6. Wait for upload to complete
```

### App Store Connect Submission Steps

#### Prerequisites
- Apple Developer Program membership ($99/year)
- App ID created in Developer Portal
- Provisioning profiles configured
- Archived and uploaded build in App Store Connect

#### Submission Checklist
1. **Create App in App Store Connect**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - My Apps → + → New App
   - Platform: iOS
   - Name: "AutoRepAi"
   - Primary language: English (U.S.)
   - Bundle ID: Select `app.lovable.8c580ccbd2ed4900a1daf3b4f211efc8`
   - SKU: `autorepaica-001` (unique identifier for your records)
   - User access: Full Access

2. **App Information**
   - Privacy Policy URL: `https://yourdomain.com/privacy`
   - Category: Primary (Business), Secondary (Productivity)
   - Content Rights: Check if contains third-party content

3. **Pricing & Availability**
   - Price: Free
   - Availability: All countries/regions (or select specific)

4. **App Privacy**
   - Complete privacy questionnaire
   - Declare data collection practices
   - Specify how data is used (analytics, functionality, etc.)

5. **Prepare for Submission**
   - **Version**: 1.0.0
   - **Build**: Select uploaded build from TestFlight
   - **Screenshots**: Upload all required sizes
   - **Promotional text** (optional)
   - **Description**: Full app description
   - **Keywords**: Comma-separated, ≤100 chars
   - **Support URL**: `https://yourdomain.com/support`
   - **Marketing URL** (optional)

6. **App Review Information**
   - Contact name, phone, email
   - Demo account (if login required):
     - Username: `demo@autorepaica.com`
     - Password: [secure test password]
   - Notes: Any special instructions for reviewers

7. **Version Release**
   - Automatic release after approval
   - Or manual release (you control when to publish)

8. **Submit for Review**
   - Review all sections for completeness
   - Click "Submit for Review"

### Validation Requirements
- ✅ App built with Xcode and uploaded via Transporter or Xcode
- ✅ All required icon sizes provided
- ✅ Screenshots for all required device sizes
- ✅ Privacy policy accessible and accurate
- ✅ App functions correctly without crashes
- ✅ No references to other platforms (Android, Windows)
- ✅ Complies with [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- ✅ TestFlight beta testing recommended before submission

### Post-Submission
- Review process: 24-48 hours (average)
- Monitor status in App Store Connect
- Address rejection reasons if applicable:
  - Common issues: Missing privacy policy, crashes, guideline violations
- Once approved, app goes live (or scheduled release)
- Update by uploading new builds and creating new versions

---

## General Best Practices

### Pre-Submission Testing
- Test on real devices for each platform
- Validate all features work correctly
- Ensure offline functionality (PWA features)
- Test in-app links and navigation
- Verify performance metrics

### Compliance
- **Privacy Policy**: Must be accessible, accurate, and platform-specific
- **Age Ratings**: Consistent across all stores
- **Content Guidelines**: Comply with each store's policies
- **Accessibility**: Support screen readers and accessibility features

### Maintenance
- Monitor each store's dashboard for:
  - Crash reports
  - User reviews
  - Performance metrics
- Respond to user feedback promptly
- Release updates regularly
- Track analytics across platforms

### Marketing
- Cross-promote on website
- Use store badges on landing pages
- Submit press releases upon launch
- Monitor app ranking and optimize metadata (ASO - App Store Optimization)

---

## Quick Reference Links

### Microsoft Store
- [PWABuilder](https://www.pwabuilder.com/)
- [Partner Center](https://partner.microsoft.com/dashboard)
- [Store Policies](https://docs.microsoft.com/en-us/windows/uwp/publish/store-policies)

### Google Play
- [PWABuilder](https://www.pwabuilder.com/)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [Play Console](https://play.google.com/console)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Play Policies](https://play.google.com/about/developer-content-policy/)

### Apple App Store
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Developer Portal](https://developer.apple.com/)
- [Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## Conclusion

Each platform has distinct requirements and processes, but all three stores provide a pathway to distribute AutoRepAi as a native app experience. Following this plan ensures compliance and a smooth submission process for Windows, Android, and iOS users.
