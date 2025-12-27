<#
Automated Android icon installation for TradeLine 24/7
Generates and installs Android launcher icons from hi-res-icon-512.png
#>

param($SkipBackup, $Force)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

# Source and target paths
$SourceIcon = "hi-res-icon-512.png"
$AndroidResPath = "android/app/src/main/res"
$BackupBasePath = "android/.icon-backups"

# Icon densities and sizes
$Densities = @(
    @{ Name = "mdpi"; Size = 48 },
    @{ Name = "hdpi"; Size = 72 },
    @{ Name = "xhdpi"; Size = 96 },
    @{ Name = "xxhdpi"; Size = 144 },
    @{ Name = "xxxhdpi"; Size = 192 }
)

# Background color for adaptive icons
$BackgroundColor = "#E85D2A"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-ColorOutput {
    param($Message, $Color = $White)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param($Step, $Message)
    Write-ColorOutput "`n[$Step] $Message..." $Cyan
}

function Write-Success {
    param($Message)
    Write-ColorOutput "  [OK] $Message" $Green
}

function Write-Warning {
    param($Message)
    Write-ColorOutput "  [WARN] $Message" $Yellow
}

function Write-Error {
    param($Message)
    Write-ColorOutput "  [ERROR] $Message" $Red
}

function Exit-WithError {
    param([string]$Message, [int]$ExitCode = 1)
    Write-Error $Message
    Write-ColorOutput "`nInstallation failed. See error above." $Red
    exit $ExitCode
}

function Get-FileSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-Item $Path).Length
        return [math]::Round($size / 1KB, 1)
    }
    return 0
}

function Test-ImageMagick {
    try {
        $version = & magick -version 2>$null
        if ($LASTEXITCODE -eq 0 -and $version -match "ImageMagick (\d+\.\d+\.\d+)") {
            return $matches[1]
        }
    }
    catch { }
    return $null
}

function Test-SourceIcon {
    if (!(Test-Path $SourceIcon)) {
        Exit-WithError "Source icon not found: $SourceIcon`nPlace hi-res-icon-512.png in the project root and try again."
    }

    $size = Get-FileSize $SourceIcon
    if ($size -lt 10 -or $size -gt 100) {
        Exit-WithError "Source icon size invalid: ${size}KB (expected: 10-100KB)"
    }

    Write-Success "Source icon found ($size KB)"
}

function New-TimestampedBackup {
    if ($SkipBackup) {
        Write-Success "Backup skipped (user requested)"
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = Join-Path $BackupBasePath "backup-$timestamp"

    # Ensure backup directory exists
    if (!(Test-Path $BackupBasePath)) {
        New-Item -ItemType Directory -Path $BackupBasePath | Out-Null
    }

    # Create backup directory
    New-Item -ItemType Directory -Path $backupPath | Out-Null

    # Backup all mipmap folders and adaptive icons
    $foldersToBackup = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi", "mipmap-anydpi-v26")
    $backedUp = 0

    foreach ($folder in $foldersToBackup) {
        $sourcePath = Join-Path $AndroidResPath $folder
        if (Test-Path $sourcePath) {
            $destPath = Join-Path $backupPath $folder
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            $backedUp++
        }
    }

    # Backup colors file if it exists
    $colorsPath = Join-Path $AndroidResPath "values\colors.xml"
    if (Test-Path $colorsPath) {
        $colorsBackupPath = Join-Path $backupPath "values"
        New-Item -ItemType Directory -Path $colorsBackupPath -Force | Out-Null
        Copy-Item -Path $colorsPath -Destination (Join-Path $colorsBackupPath "colors.xml") -Force
        $backedUp++
    }

    Write-Success "Backed up $backedUp folders to $backupPath"
}

function Optimize-SourceIcon {
    $optimizedIcon = "temp_optimized_icon.png"

    try {
        Write-ColorOutput "  Original: $(Get-FileSize $SourceIcon) KB" $White

        # Optimize with ImageMagick (strip metadata, reduce quality slightly)
        & magick convert $SourceIcon -strip -quality 95 $optimizedIcon 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "ImageMagick convert failed"
        }

        $optimizedSize = Get-FileSize $optimizedIcon
        Write-ColorOutput "  Optimized: ${optimizedSize} KB" $White
        Write-Success "Reduced by $([math]::Round(((Get-FileSize $SourceIcon) - $optimizedSize) / (Get-FileSize $SourceIcon) * 100))%"

        return $optimizedIcon
    }
    catch {
        if (Test-Path $optimizedIcon) { Remove-Item $optimizedIcon -Force }
        Exit-WithError "Failed to optimize source icon: $_"
    }
}

function New-IconSizes {
    param([string]$OptimizedIcon)

    $tempDir = "temp_icons"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }

    try {
        foreach ($density in $Densities) {
            $size = $density.Size
            $name = $density.Name

            # Generate square icon
            $outputPath = Join-Path $tempDir "ic_launcher_${name}.png"
            & magick convert $OptimizedIcon -resize "${size}x${size}" -gravity center -extent "${size}x${size}" $outputPath 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to resize icon for $name"
            }

            # Generate round icon (with slight corner radius)
            $roundPath = Join-Path $tempDir "ic_launcher_round_${name}.png"
            & magick convert $OptimizedIcon -resize "${size}x${size}" -gravity center -extent "${size}x${size}" $roundPath 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to create round icon for $name"
            }

            Write-Success "Generated $name ($size`x$size)"
        }
    }
    catch {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Exit-WithError "Failed to generate icon sizes: $_"
    }

    return $tempDir
}

function Install-Icons {
    param([string]$TempDir)

    $installed = 0

    foreach ($density in $Densities) {
        $size = $density.Size
        $name = $density.Name
        $folderPath = Join-Path $AndroidResPath "mipmap-$name"

        # Ensure folder exists
        if (!(Test-Path $folderPath)) {
            New-Item -ItemType Directory -Path $folderPath | Out-Null
        }

        # Install square icon
        $sourceSquare = Join-Path $TempDir "ic_launcher_${name}.png"
        $destSquare = Join-Path $folderPath "ic_launcher.png"
        Copy-Item -Path $sourceSquare -Destination $destSquare -Force

        # Install round icon
        $sourceRound = Join-Path $TempDir "ic_launcher_round_${name}.png"
        $destRound = Join-Path $folderPath "ic_launcher_round.png"
        Copy-Item -Path $sourceRound -Destination $destRound -Force

        # Set read-only protection
        Set-ItemProperty -Path $destSquare -Name IsReadOnly -Value $true
        Set-ItemProperty -Path $destRound -Name IsReadOnly -Value $true

        $installed += 2

        # Validate file sizes
        $squareSize = Get-FileSize $destSquare
        $roundSize = Get-FileSize $destRound

        if ($name -eq "mdpi" -and ($squareSize -lt 1 -or $squareSize -gt 10)) {
            Write-Warning "$name square icon size: ${squareSize}KB (expected: 1-10KB)"
        }
        if ($name -eq "xxxhdpi" -and ($squareSize -lt 8 -or $squareSize -gt 50)) {
            Write-Warning "$name square icon size: ${squareSize}KB (expected: 8-50KB)"
        }
    }

    Write-Success "Installed $installed icon files"
}

function New-AdaptiveIcons {
    $adaptivePath = Join-Path $AndroidResPath "mipmap-anydpi-v26"

    # Ensure folder exists
    if (!(Test-Path $adaptivePath)) {
        New-Item -ItemType Directory -Path $adaptivePath | Out-Null
    }

    # Create adaptive icon XML for regular launcher
    $icLauncherXml = '<?xml version="1.0" encoding="utf-8"?>
<!-- AUTO-GENERATED by install-android-icons.ps1 -->
<!-- DO NOT MODIFY MANUALLY -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>'

    $icLauncherPath = Join-Path $adaptivePath "ic_launcher.xml"
    $icLauncherXml | Out-File -FilePath $icLauncherPath -Encoding UTF8 -Force
    Set-ItemProperty -Path $icLauncherPath -Name IsReadOnly -Value $true

    # Create adaptive icon XML for round launcher
    $icLauncherRoundPath = Join-Path $adaptivePath "ic_launcher_round.xml"
    $icLauncherXml | Out-File -FilePath $icLauncherRoundPath -Encoding UTF8 -Force
    Set-ItemProperty -Path $icLauncherRoundPath -Name IsReadOnly -Value $true

    Write-Success "Adaptive icon XMLs created"
}

function Update-ColorsXml {
    $colorsPath = Join-Path $AndroidResPath "values\colors.xml"

    # Check if colors.xml already has the background color
    if (Test-Path $colorsPath) {
        $content = Get-Content $colorsPath -Raw
        if ($content -match 'ic_launcher_background') {
            Write-Success "Background color already defined in colors.xml"
            return
        }
    }

    # Create or update colors.xml
    $colorsXml = '<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$BackgroundColor</color>
</resources>'

    $colorsXml | Out-File -FilePath $colorsPath -Encoding UTF8 -Force
    Write-Success "Background color added to colors.xml"
}

function Protect-Files {
    $protected = 0

    # Protect all PNG files in mipmap folders
    $mipmapFolders = Get-ChildItem -Path $AndroidResPath -Directory | Where-Object { $_.Name -match "^mipmap-" }

    foreach ($folder in $mipmapFolders) {
        $pngFiles = Get-ChildItem -Path $folder.FullName -Filter "*.png" -File
        foreach ($file in $pngFiles) {
            if (!(Get-ItemProperty -Path $file.FullName -Name IsReadOnly)) {
                Set-ItemProperty -Path $file.FullName -Name IsReadOnly -Value $true
                $protected++
            }
        }
    }

    # Protect XML files in adaptive folder
    $adaptivePath = Join-Path $AndroidResPath "mipmap-anydpi-v26"
    if (Test-Path $adaptivePath) {
        $xmlFiles = Get-ChildItem -Path $adaptivePath -Filter "*.xml" -File
        foreach ($file in $xmlFiles) {
            if (!(Get-ItemProperty -Path $file.FullName -Name IsReadOnly)) {
                Set-ItemProperty -Path $file.FullName -Name IsReadOnly -Value $true
                $protected++
            }
        }
    }

    Write-Success "Read-only protection applied ($protected files)"
}

function Test-Installation {
    $issues = 0

    # Check mipmap folders exist
    foreach ($density in $Densities) {
        $folderPath = Join-Path $AndroidResPath "mipmap-$($density.Name)"
        if (!(Test-Path $folderPath)) {
            Write-Error "Missing folder: mipmap-$($density.Name)"
            $issues++
        } else {
            # Check files exist and are readable
            $squarePath = Join-Path $folderPath "ic_launcher.png"
            $roundPath = Join-Path $folderPath "ic_launcher_round.png"

            if (!(Test-Path $squarePath)) {
                Write-Error "Missing file: $squarePath"
                $issues++
            }
            if (!(Test-Path $roundPath)) {
                Write-Error "Missing file: $roundPath"
                $issues++
            }
        }
    }

    # Check adaptive icons
    $adaptivePath = Join-Path $AndroidResPath "mipmap-anydpi-v26"
    if (!(Test-Path $adaptivePath)) {
        Write-Error "Missing folder: mipmap-anydpi-v26"
        $issues++
    } else {
        $xmlFiles = @("ic_launcher.xml", "ic_launcher_round.xml")
        foreach ($file in $xmlFiles) {
            $filePath = Join-Path $adaptivePath $file
            if (!(Test-Path $filePath)) {
                Write-Error "Missing file: $filePath"
                $issues++
            }
        }
    }

    # Check colors.xml
    $colorsPath = Join-Path $AndroidResPath "values\colors.xml"
    if (!(Test-Path $colorsPath)) {
        Write-Error "Missing file: colors.xml"
        $issues++
    } else {
        $content = Get-Content $colorsPath -Raw
        if ($content -notmatch 'ic_launcher_background') {
            Write-Error "Background color not defined in colors.xml"
            $issues++
        }
    }

    if ($issues -eq 0) {
        Write-Success "Installation integrity verified"
    } else {
        Write-Warning "Found $issues installation issues"
    }

    return $issues
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    # Set execution policy for this session
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

    Write-ColorOutput @"
════════════════════════════════════════
  TRADELINE 24/7 ICON INSTALLER
════════════════════════════════════════
"@ $Cyan

    # Step 1: Prerequisites check
    Write-Step "1/7" "Checking prerequisites"

    $magickVersion = Test-ImageMagick
    if (!$magickVersion) {
        Exit-WithError "ImageMagick not found. Install from: https://imagemagick.org/script/download.php#windows`nOr use MANUAL_INSTALL.md for manual installation."
    }
    Write-Success "ImageMagick detected (v$magickVersion)"

    Test-SourceIcon

    # Step 2: Create backup
    Write-Step "2/7" "Creating backup"
    New-TimestampedBackup

    # Step 3: Optimize source icon
    Write-Step "3/7" "Optimizing source icon"
    $optimizedIcon = Optimize-SourceIcon

    # Step 4: Generate icon sizes
    Write-Step "4/7" "Generating icon sizes"
    $tempDir = New-IconSizes -OptimizedIcon $optimizedIcon

    # Step 5: Install to Android project
    Write-Step "5/7" "Installing to Android project"
    Install-Icons -TempDir $tempDir

    # Step 6: Create adaptive resources
    Write-Step "6/7" "Creating adaptive resources"
    New-AdaptiveIcons
    Update-ColorsXml

    # Step 7: Apply guardrails
    Write-Step "7/7" "Applying guardrails"
    Protect-Files

    # Cleanup temp files
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    if (Test-Path $optimizedIcon) { Remove-Item $optimizedIcon -Force }

    # Final verification
    Write-Step "VERIFICATION" "Running final checks"
    $issues = Test-Installation

    Write-ColorOutput @"

════════════════════════════════════════
SUCCESS - READY FOR BUILD
════════════════════════════════════════

Next steps:
  1. Run: .\verify-icons.ps1
  2. Android Studio → Build → Rebuild Project
  3. Test on device
"@ $Green

    exit 0

} catch {
    # Cleanup on error
    if (Test-Path "temp_icons") { Remove-Item "temp_icons" -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path "temp_optimized_icon.png") { Remove-Item "temp_optimized_icon.png" -Force -ErrorAction SilentlyContinue }

    Exit-WithError "Unexpected error: $($_.Exception.Message)"
}
