# Get The App Page Specification

This document provides the complete specification for the `/get-the-app` public page, including content, platform detection logic, store badges, FAQ, and required assets.

---

## Page Overview

**URL**: `https://yourdomain.com/get-the-app`

**Purpose**: Provide platform-specific installation instructions for AutoRepAi, guiding users to download from the appropriate app store or install the PWA directly.

**Key Features**:
- Automatic platform detection
- Platform-specific installation guidance
- Store badges linking to app listings
- FAQ section addressing common questions
- Privacy and support links

---

## Page Layout

### Header Section
- Logo: AutoRepAi logo (link to homepage)
- Navigation: Minimal (Home, Get The App, Support, Privacy)

### Hero Section
**Headline**: "Get AutoRepAi on Any Device"

**Subheadline**: "Experience the full power of AutoRepAi with our native apps for Windows, Android, and iOS—or install directly from your browser."

**Visual**: Hero image showing AutoRepAi running on multiple devices (desktop, tablet, phone)

---

## Platform Detection & Guidance

### Detection Logic

Detect user's platform on page load using JavaScript:

```javascript
function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  
  return 'unknown';
}
```

**Behavior**:
- Highlight the detected platform tile
- Show platform-specific "Recommended for You" badge
- Scroll to detected platform section on load
- Allow users to select other platforms manually

---

## Platform Tiles

Display three primary platform tiles (cards) with consistent structure:

### 1. Windows Tile

**Icon**: Windows logo
**Title**: "For Windows"
**Description**: "Download AutoRepAi from the Microsoft Store for a seamless Windows experience."

**CTA Button**: "Get on Microsoft Store"
- Link: `https://www.microsoft.com/store/apps/[YOUR_APP_ID]`
- Opens in new tab
- Button style: Primary (blue background, white text)

**Alternative Method**:
"Or install directly from your browser:"
1. Open AutoRepAi in Microsoft Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install" to add to your desktop

**Visual**: Screenshot of AutoRepAi on Windows desktop

---

### 2. Android Tile

**Icon**: Google Play logo
**Title**: "For Android"
**Description**: "Get AutoRepAi on Google Play for your Android phone or tablet."

**CTA Button**: "Get it on Google Play"
- Link: `https://play.google.com/store/apps/details?id=app.autorepaica.twa`
- Opens in new tab
- Button style: Primary (blue background, white text)

**Alternative Method**:
"Or install directly from your browser:"
1. Open AutoRepAi in Chrome
2. Tap the menu (⋮) and select "Install app" or "Add to Home screen"
3. Follow the prompts to install

**Visual**: Screenshot of AutoRepAi on Android phone

---

### 3. iOS/iPadOS Tile

**Icon**: Apple App Store logo
**Title**: "For iPhone & iPad"
**Description**: "Download AutoRepAi from the App Store for iOS and iPadOS."

**CTA Button**: "Download on the App Store"
- Link: `https://apps.apple.com/app/autorepaica/[YOUR_APP_ID]`
- Opens in new tab
- Button style: Primary (blue background, white text)
- Show "Coming Soon" badge if not yet published

**Alternative Method (iOS/iPadOS)**:
"Or add to your Home Screen:"
1. Open AutoRepAi in Safari
2. Tap the Share button (□↑)
3. Select "Add to Home Screen"
4. Tap "Add" to install

**Visual**: Screenshot of AutoRepAi on iPhone

---

## Additional Platform Support

### macOS (Secondary Tile)
**Icon**: macOS/Safari logo
**Title**: "For macOS"
**Description**: "Install AutoRepAi directly from Safari on your Mac."

**Instructions**:
1. Open AutoRepAi in Safari
2. Click the Share button in the toolbar
3. Select "Add to Dock"
4. AutoRepAi will be available as a desktop app

**Visual**: Small screenshot of AutoRepAi on macOS

---

### Linux (Secondary Tile)
**Icon**: Linux penguin or Chrome logo
**Title**: "For Linux"
**Description**: "Install AutoRepAi as a PWA using Chrome or Edge."

**Instructions**:
1. Open AutoRepAi in Chrome or Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install" to add to your applications

---

## FAQ Section

### Q1: Why don't I see an "Install" button on this page?

**A**: AutoRepAi is a Progressive Web App (PWA) that installs directly from your browser. The installation process varies by platform:
- **Desktop** (Windows, macOS, Linux): Look for an install icon (⊕) in your browser's address bar when you visit AutoRepAi.
- **Android**: Use the "Add to Home screen" option in Chrome's menu, or download from Google Play.
- **iOS/iPadOS**: Use Safari's "Add to Home Screen" feature via the Share menu, or download from the App Store.

---

### Q2: What's the difference between the store version and browser installation?

**A**: Both versions provide the same AutoRepAi experience. The key differences:
- **Store versions** (Microsoft Store, Google Play, App Store): 
  - Easier discovery and installation
  - Automatic updates managed by the store
  - Better integration with OS features
  
- **Browser installation** (PWA):
  - Instant installation without visiting a store
  - Always up-to-date (updates happen when you use the app)
  - Same features and performance

Choose whichever method is most convenient for you!

---

### Q3: Will the app work offline?

**A**: Yes! AutoRepAi is designed to work offline. Once installed, you can access key features even without an internet connection. Data will sync automatically when you're back online.

---

### Q4: Is AutoRepAi free?

**A**: Yes, AutoRepAi is free to download and use. [Add pricing model details if applicable, e.g., "Some advanced features require a subscription."]

---

### Q5: Which browsers support PWA installation?

**A**: AutoRepAi can be installed as a PWA on:
- **Windows**: Microsoft Edge, Google Chrome
- **macOS**: Safari (14+), Google Chrome, Microsoft Edge
- **Android**: Google Chrome, Microsoft Edge, Samsung Internet
- **iOS/iPadOS**: Safari (15.4+)

Other browsers may support PWA installation but are not officially tested.

---

### Q6: How do I uninstall AutoRepAi?

**A**: 
- **Windows**: Right-click the app in Start Menu → Uninstall
- **Android**: Long-press the app icon → Uninstall
- **iOS/iPadOS**: Long-press the app icon → Remove App
- **PWA (browser)**: Access your browser's app management settings to uninstall

---

## Store Badges

### Required Badge Assets

Download official store badges from each platform's brand guidelines:

#### Microsoft Store Badge
- **Asset**: `microsoft-store-badge.svg` or `.png`
- **Source**: [Microsoft Brand Guidelines](https://developer.microsoft.com/store/badges)
- **Dimensions**: 284x100 (standard)
- **Alt Text**: "Get it from Microsoft Store"

#### Google Play Badge
- **Asset**: `google-play-badge.svg` or `.png`
- **Source**: [Google Play Badge Generator](https://play.google.com/intl/en_us/badges/)
- **Dimensions**: 646x250 (standard)
- **Alt Text**: "Get it on Google Play"

#### Apple App Store Badge
- **Asset**: `app-store-badge.svg` or `.png`
- **Source**: [Apple Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)
- **Dimensions**: 120x40 (standard)
- **Alt Text**: "Download on the App Store"

**Badge Placement**:
- Display below each platform tile
- Link directly to store listing
- Open in new tab/window

---

## Screenshots & Visuals

### Required Images

1. **Hero Image** (`get-app-hero.jpg` or `.png`)
   - Dimensions: 1920x1080
   - Content: AutoRepAi running on desktop, tablet, and phone
   - Alt Text: "AutoRepAi on multiple devices"

2. **Windows Screenshot** (`autorepaica-windows.png`)
   - Dimensions: 1366x768 or higher
   - Content: AutoRepAi dashboard on Windows
   - Alt Text: "AutoRepAi on Windows desktop"

3. **Android Screenshot** (`autorepaica-android.png`)
   - Dimensions: 1080x1920 (portrait)
   - Content: AutoRepAi home screen on Android
   - Alt Text: "AutoRepAi on Android phone"

4. **iOS Screenshot** (`autorepaica-ios.png`)
   - Dimensions: 1170x2532 (iPhone 13 Pro)
   - Content: AutoRepAi interface on iPhone
   - Alt Text: "AutoRepAi on iPhone"

5. **macOS Screenshot** (`autorepaica-macos.png`)
   - Dimensions: 2880x1800 (Retina)
   - Content: AutoRepAi in Safari on macOS
   - Alt Text: "AutoRepAi on macOS"

6. **Platform Icons**
   - Windows logo: `windows-icon.svg`
   - Android logo: `android-icon.svg`
   - Apple logo: `apple-icon.svg`
   - Chrome logo: `chrome-icon.svg`
   - Safari logo: `safari-icon.svg`

---

## Footer Section

### Links
- **Privacy Policy**: `/privacy`
- **Terms of Service**: `/terms`
- **Support**: `/support` or `mailto:support@autorepaica.com`
- **Contact Us**: `/contact`

### Social Proof (Optional)
- User testimonials
- App ratings/reviews (once available)
- Download count

### Copyright
"© 2025 AutoRepAi. All rights reserved."

---

## Copy: Full Page Text

### Hero Section

**Headline**:  
"Get AutoRepAi on Any Device"

**Subheadline**:  
"Experience the full power of AutoRepAi with our native apps for Windows, Android, and iOS—or install directly from your browser."

---

### Windows Section

**Title**: "For Windows"

**Description**:  
"Download AutoRepAi from the Microsoft Store for a seamless Windows experience. Enjoy desktop notifications, quick access from your taskbar, and a fully integrated Windows app."

**CTA**: "Get on Microsoft Store"

**Alternative**:  
"**Or install directly from your browser:**  
1. Open AutoRepAi in Microsoft Edge  
2. Click the install icon (⊕) in the address bar  
3. Click 'Install' to add to your desktop"

---

### Android Section

**Title**: "For Android"

**Description**:  
"Get AutoRepAi on Google Play for your Android phone or tablet. Stay connected on the go with push notifications, offline access, and fast performance optimized for mobile."

**CTA**: "Get it on Google Play"

**Alternative**:  
"**Or install directly from your browser:**  
1. Open AutoRepAi in Chrome  
2. Tap the menu (⋮) and select 'Install app' or 'Add to Home screen'  
3. Follow the prompts to install"

---

### iOS Section

**Title**: "For iPhone & iPad"

**Description**:  
"Download AutoRepAi from the App Store for iOS and iPadOS. Enjoy a native iOS experience with Face ID support, Siri shortcuts, and seamless syncing across your Apple devices."

**CTA**: "Download on the App Store"  
*[Show "Coming Soon" badge if not yet published]*

**Alternative**:  
"**Or add to your Home Screen:**  
1. Open AutoRepAi in Safari  
2. Tap the Share button (□↑)  
3. Select 'Add to Home Screen'  
4. Tap 'Add' to install"

---

### macOS Section (Secondary)

**Title**: "For macOS"

**Description**:  
"Install AutoRepAi directly from Safari on your Mac for a native macOS app experience."

**Instructions**:  
"1. Open AutoRepAi in Safari  
2. Click the Share button in the toolbar  
3. Select 'Add to Dock'  
4. AutoRepAi will be available as a desktop app"

---

### Linux Section (Secondary)

**Title**: "For Linux"

**Description**:  
"Install AutoRepAi as a Progressive Web App using Chrome or Edge on Linux."

**Instructions**:  
"1. Open AutoRepAi in Chrome or Edge  
2. Click the install icon (⊕) in the address bar  
3. Click 'Install' to add to your applications"

---

### FAQ Section

[See FAQ content above]

---

### Footer

**Links**:  
[Privacy Policy](#) | [Terms of Service](#) | [Support](#) | [Contact](#)

**Copyright**:  
"© 2025 AutoRepAi. All rights reserved."

---

## Technical Implementation Notes

### Responsive Design
- **Mobile**: Single-column layout, cards stack vertically
- **Tablet**: Two-column layout for platform tiles
- **Desktop**: Three-column layout with highlighted detected platform

### Accessibility
- Use semantic HTML (`<section>`, `<article>`, `<nav>`)
- Ensure all images have descriptive alt text
- Maintain WCAG 2.1 AA contrast ratios
- Keyboard navigable
- Screen reader friendly

### SEO Optimization
- **Meta Title**: "Get AutoRepAi - Download for Windows, Android, iOS | AutoRepAi"
- **Meta Description**: "Download AutoRepAi on Windows, Android, or iOS. Install from the Microsoft Store, Google Play, or App Store—or add directly to your device from your browser."
- **Keywords**: "AutoRepAi download, dealership app, Windows app, Android app, iOS app, PWA install"
- **Canonical URL**: `https://yourdomain.com/get-the-app`
- **Open Graph tags** for social sharing:
  ```html
  <meta property="og:title" content="Get AutoRepAi on Any Device" />
  <meta property="og:description" content="Download AutoRepAi for Windows, Android, or iOS." />
  <meta property="og:image" content="https://yourdomain.com/get-app-hero.jpg" />
  <meta property="og:url" content="https://yourdomain.com/get-the-app" />
  ```

### Analytics Tracking
Track key events:
- Page view: `/get-the-app`
- Platform detected: `platform_detected: {windows|android|ios|macos|linux}`
- Store badge click: `store_badge_click: {microsoft|google|apple}`
- Alternative install view: `alternative_install_view: {windows|android|ios}`

---

## Asset Checklist

### Images
- [ ] `get-app-hero.jpg` (1920x1080) - Hero image
- [ ] `autorepaica-windows.png` (1366x768+) - Windows screenshot
- [ ] `autorepaica-android.png` (1080x1920) - Android screenshot
- [ ] `autorepaica-ios.png` (1170x2532) - iOS screenshot
- [ ] `autorepaica-macos.png` (2880x1800) - macOS screenshot
- [ ] `windows-icon.svg` - Windows logo
- [ ] `android-icon.svg` - Android logo
- [ ] `apple-icon.svg` - Apple logo
- [ ] `chrome-icon.svg` - Chrome logo
- [ ] `safari-icon.svg` - Safari logo

### Store Badges
- [ ] `microsoft-store-badge.svg` or `.png` (284x100)
- [ ] `google-play-badge.svg` or `.png` (646x250)
- [ ] `app-store-badge.svg` or `.png` (120x40)

### Links (to be updated post-launch)
- [ ] Microsoft Store listing URL
- [ ] Google Play listing URL
- [ ] Apple App Store listing URL (or "Coming Soon" notice)

---

## Post-Launch Updates

Once apps are live on each store:
1. **Update store badge links** with actual URLs
2. **Remove "Coming Soon" badges** for iOS
3. **Add user ratings/reviews** if permission granted by stores
4. **Update screenshots** to reflect latest UI
5. **Add download counters** (optional) if publicly available
6. **Cross-link** from homepage and other key pages

---

## Conclusion

This specification provides all content, visuals, and implementation details needed to build the `/get-the-app` page. The page will guide users to the most appropriate installation method for their device, improving discoverability and adoption of AutoRepAi across all platforms.

**Next Steps**:
1. Create page layout using this spec
2. Gather all required assets (screenshots, badges, icons)
3. Implement platform detection logic
4. Test across all target platforms
5. Deploy page before or alongside store submissions
