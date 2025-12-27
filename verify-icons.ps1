#Requires -Version 5.1
<#
.SYNOPSIS
    Verify Android icon installation integrity for TradeLine 24/7
.DESCRIPTION
    Performs comprehensive health check of Android launcher icons
    Validates file presence, sizes, protection status, and configuration
.EXAMPLE
    .\verify-icons.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

# Configuration
$AndroidResPath = "android\app\src\main\res"

# Expected icon densities and size ranges (KB)
$Densities = @(
    @{ Name = "mdpi"; Size = 48; MinSize = 1; MaxSize = 10 },
    @{ Name = "hdpi"; Size = 72; MinSize = 2; MaxSize = 15 },
    @{ Name = "xhdpi"; Size = 96; MinSize = 3; MaxSize = 20 },
    @{ Name = "xxhdpi"; Size = 144; MinSize = 5; MaxSize = 35 },
    @{ Name = "xxxhdpi"; Size = 192; MinSize = 8; MaxSize = 50 }
)

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $White)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Text)
    Write-ColorOutput "`n$Text" $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[OK] $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARN] $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" $Red
}

function Get-FileSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-Item $Path).Length
        return [math]::Round($size / 1KB, 1)
    }
    return 0
}

function Test-ReadOnly {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-ItemProperty -Path $Path -Name IsReadOnly).IsReadOnly
    }
    return $false
}

function Format-FileInfo {
    param([string]$Path, [string]$Expected = "")

    $exists = Test-Path $Path
    $size = Get-FileSize $Path
    $protected = Test-ReadOnly $Path

    if (!$exists) {
        return "MISSING"
    }

    $status = "${size} KB"
    if ($protected) {
        $status += ", protected"
    } else {
        $status += ", unprotected"
    }

    if ($Expected -and ($size -lt $Expected.MinSize -or $size -gt $Expected.MaxSize)) {
        $status += " (expected: $($Expected.MinSize)-$($Expected.MaxSize) KB)"
    }

    return $status
}

# ============================================================================
# MAIN VERIFICATION
# ============================================================================

try {
    Write-ColorOutput @"
════════════════════════════════════════
  TRADELINE 24/7 ICON VERIFICATION
════════════════════════════════════════
"@ $Cyan

    $issues = 0
    $warnings = 0

    # Check 1: Mipmap folders and files
    Write-Header "MIPMAP ICON FILES"

    foreach ($density in $Densities) {
        $folderPath = Join-Path $AndroidResPath "mipmap-$($density.Name)"
        $squarePath = Join-Path $folderPath "ic_launcher.png"
        $roundPath = Join-Path $folderPath "ic_launcher_round.png"

        # Square icon
        $squareInfo = Format-FileInfo -Path $squarePath -Expected $density
        Write-ColorOutput "mipmap-$($density.Name)/ic_launcher.png ($squareInfo)" $White

        if (!(Test-Path $squarePath)) {
            Write-Error "Missing: mipmap-$($density.Name)/ic_launcher.png"
            $issues++
        } elseif (!(Test-ReadOnly $squarePath)) {
            Write-Warning "Unprotected: mipmap-$($density.Name)/ic_launcher.png"
            $warnings++
        } elseif ($density.MinSize -and ((Get-FileSize $squarePath) -lt $density.MinSize -or (Get-FileSize $squarePath) -gt $density.MaxSize)) {
            Write-Warning "Size issue: mipmap-$($density.Name)/ic_launcher.png"
            $warnings++
        } else {
            Write-Success "mipmap-$($density.Name)/ic_launcher.png"
        }

        # Round icon
        $roundInfo = Format-FileInfo -Path $roundPath -Expected $density
        Write-ColorOutput "mipmap-$($density.Name)/ic_launcher_round.png ($roundInfo)" $White

        if (!(Test-Path $roundPath)) {
            Write-Error "Missing: mipmap-$($density.Name)/ic_launcher_round.png"
            $issues++
        } elseif (!(Test-ReadOnly $roundPath)) {
            Write-Warning "Unprotected: mipmap-$($density.Name)/ic_launcher_round.png"
            $warnings++
        } elseif ($density.MinSize -and ((Get-FileSize $roundPath) -lt $density.MinSize -or (Get-FileSize $roundPath) -gt $density.MaxSize)) {
            Write-Warning "Size issue: mipmap-$($density.Name)/ic_launcher_round.png"
            $warnings++
        } else {
            Write-Success "mipmap-$($density.Name)/ic_launcher_round.png"
        }
    }

    # Check 2: Adaptive icon XMLs
    Write-Header "ADAPTIVE ICON XMLs"

    $adaptivePath = Join-Path $AndroidResPath "mipmap-anydpi-v26"
    $xmlFiles = @("ic_launcher.xml", "ic_launcher_round.xml")

    foreach ($file in $xmlFiles) {
        $filePath = Join-Path $adaptivePath $file
        $fileInfo = Format-FileInfo -Path $filePath

        Write-ColorOutput "$file ($fileInfo)" $White

        if (!(Test-Path $filePath)) {
            Write-Error "Missing: mipmap-anydpi-v26/$file"
            $issues++
        } elseif (!(Test-ReadOnly $filePath)) {
            Write-Warning "Unprotected: mipmap-anydpi-v26/$file"
            $warnings++
        } else {
            Write-Success "mipmap-anydpi-v26/$file"
        }
    }

    # Check 3: Background color configuration
    Write-Header "BACKGROUND COLOR CONFIGURATION"

    $colorsPath = Join-Path $AndroidResPath "values\colors.xml"
    $colorsInfo = Format-FileInfo -Path $colorsPath

    Write-ColorOutput "values/colors.xml ($colorsInfo)" $White

    if (!(Test-Path $colorsPath)) {
        Write-Error "Missing: values/colors.xml"
        $issues++
    } else {
        $content = Get-Content $colorsPath -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match 'ic_launcher_background') {
            Write-Success "Background color defined"
        } else {
            Write-Error "Background color not defined in colors.xml"
            $issues++
        }
    }

    # Check 4: Backup directory
    Write-Header "BACKUP VERIFICATION"

    $backupBasePath = "android\.icon-backups"
    if (Test-Path $backupBasePath) {
        $backupDirs = Get-ChildItem -Path $backupBasePath -Directory | Where-Object { $_.Name -match "^backup-\d{8}-\d{6}$" } | Sort-Object Name -Descending
        if ($backupDirs.Count -gt 0) {
            $latestBackup = $backupDirs[0]
            Write-Success "Latest backup: $($latestBackup.Name)"
        } else {
            Write-Warning "Backup directory exists but no valid backups found"
            $warnings++
        }
    } else {
        Write-Warning "No backup directory found (android\.icon-backups)"
        $warnings++
    }

    # Summary
    Write-Header "VERIFICATION SUMMARY"

    if ($issues -eq 0 -and $warnings -eq 0) {
        Write-ColorOutput @"

STATUS: PERFECT ✓
All 10 icon files installed and protected
"@ $Green
        exit 0
    } elseif ($issues -eq 0) {
        Write-ColorOutput @"

STATUS: GOOD (with warnings)
$warnings warnings found - review above
"@ $Yellow
        exit 0
    } else {
        Write-ColorOutput @"

STATUS: ISSUES FOUND
$issues issues and $warnings warnings found
Run install-android-icons.ps1 to fix
"@ $Red
        exit 1
    }

} catch {
    Write-Error "Verification failed: $($_.Exception.Message)"
    exit 1
}
