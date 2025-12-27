#Requires -Version 5.1
<#
.SYNOPSIS
    TradeLine 24/7 Android Icon Installation Launcher
.DESCRIPTION
    Detects prerequisites and guides users through Android icon installation
    Provides automated installation with ImageMagick or manual fallback
.EXAMPLE
    .\START-HERE.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"
$Magenta = "Magenta"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $White)
    Write-Host $Message -ForegroundColor $Color
}

function Write-Banner {
    Write-ColorOutput @"
╔════════════════════════════════════════╗
║   TRADELINE 24/7 ICON INSTALLER        ║
║   Android Launcher Icons Setup         ║
╚════════════════════════════════════════╝
"@ $Cyan
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-ColorOutput "`n[$Step] $Message" $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "  [OK] $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "  [WARN] $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "  [ERROR] $Message" $Red
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
    $sourceIcon = "hi-res-icon-512.png"
    if (!(Test-Path $sourceIcon)) {
        return $false
    }

    $size = (Get-Item $sourceIcon).Length / 1KB
    return ($size -ge 10 -and $size -le 100)
}

function Install-ImageMagick {
    Write-ColorOutput @"

ImageMagick Installation Required
════════════════════════════════════════

To install ImageMagick automatically:

"@ $Yellow

    Write-ColorOutput "1. Download from: https://imagemagick.org/script/download.php#windows" $White
    Write-ColorOutput "2. Choose: ImageMagick-7.x.x-x-Q16-x64-dll.exe (latest version)" $White
    Write-ColorOutput "3. Run installer as Administrator" $White
    Write-ColorOutput "4. Select 'Install legacy utilities (e.g. convert)' during setup" $White
    Write-ColorOutput "5. Restart PowerShell and run this script again" $White

    Write-ColorOutput "`nAfter installation, press Enter to continue..." $Cyan
    Read-Host | Out-Null
}

function Show-Menu {
    param([bool]$HasImageMagick, [bool]$HasSourceIcon)

    Write-Step "2/3" "Installation method"

    if ($HasImageMagick -and $HasSourceIcon) {
        Write-ColorOutput "  → AUTOMATED (recommended)" $Green
        Write-ColorOutput "  → MANUAL (alternative)" $White
    } elseif ($HasSourceIcon) {
        Write-ColorOutput "  → MANUAL (ImageMagick not detected)" $Yellow
    } else {
        Write-ColorOutput "  → MANUAL (source icon missing)" $Yellow
    }

    Write-ColorOutput "`nChoose installation method:" $White
    Write-ColorOutput "  [A] Automated (requires ImageMagick)" $Green
    Write-ColorOutput "  [M] Manual installation" $White
    Write-ColorOutput "  [Q] Quit" $Red

    $choice = Read-Host "`nEnter choice (A/M/Q)"

    switch ($choice.ToUpper()) {
        "A" {
            if (!$HasImageMagick) {
                Write-Error "ImageMagick required for automated installation"
                return "INSTALL_MAGICK"
            }
            if (!$HasSourceIcon) {
                Write-Error "Source icon (hi-res-icon-512.png) required"
                return "MISSING_ICON"
            }
            return "AUTOMATED"
        }
        "M" {
            return "MANUAL"
        }
        "Q" {
            return "QUIT"
        }
        default {
            Write-Warning "Invalid choice. Please enter A, M, or Q."
            return Show-Menu -HasImageMagick $HasImageMagick -HasSourceIcon $HasSourceIcon
        }
    }
}

function Start-AutomatedInstall {
    Write-Step "3/3" "Running automated installation"

    try {
        # Set execution policy for this session
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

        # Run the installer
        & ".\install-android-icons.ps1"

        if ($LASTEXITCODE -eq 0) {
            Write-Step "SUCCESS" "Installation completed"

            # Run verification automatically
            Write-ColorOutput "`nRunning verification..." $Cyan
            & ".\verify-icons.ps1"

            Write-ColorOutput @"

════════════════════════════════════════
INSTALLATION COMPLETE!
════════════════════════════════════════

Next steps:
1. Open Android Studio
2. Build → Rebuild Project
3. Test on Android device/emulator
4. Verify icons appear correctly

For detailed documentation, see README.md
"@ $Green

            Write-ColorOutput "`nPress Enter to exit..." $Cyan
            Read-Host | Out-Null
        } else {
            Write-Error "Installation failed (exit code: $LASTEXITCODE)"
            Write-ColorOutput "`nCheck error messages above and try again." $Red
            Write-ColorOutput "For help, see README.md or MANUAL_INSTALL.md" $Yellow

            Write-ColorOutput "`nPress Enter to exit..." $Cyan
            Read-Host | Out-Null
        }
    }
    catch {
        Write-Error "Failed to run automated installation: $($_.Exception.Message)"
        Write-ColorOutput "`nTry manual installation instead." $Yellow

        Write-ColorOutput "`nPress Enter to exit..." $Cyan
        Read-Host | Out-Null
    }
}

function Start-ManualInstall {
    Write-Step "3/3" "Manual installation selected"

    Write-ColorOutput @"

Manual Installation Guide
════════════════════════════════════════

This will guide you through installing icons without ImageMagick.

"@ $White

    $manualGuide = @"

INSTRUCTIONS:
1. Open MANUAL_INSTALL.md in your browser or text editor
2. Follow Step 1: Generate icons online using one of these services:
   • https://appicon.co/
   • https://easyappicon.com/
   • https://icon.kitchen/

3. Download the generated icons (48x48, 72x72, 96x96, 144x144, 192x192)

4. Follow the manual copy commands in MANUAL_INSTALL.md

5. Run verification: .\verify-icons.ps1

For detailed step-by-step instructions, see MANUAL_INSTALL.md

"@

    Write-ColorOutput $manualGuide $White

    $openManual = Read-Host "`nOpen MANUAL_INSTALL.md now? (Y/N)"
    if ($openManual -eq "Y" -or $openManual -eq "y") {
        try {
            Start-Process "MANUAL_INSTALL.md"
        }
        catch {
            Write-Warning "Could not open MANUAL_INSTALL.md automatically"
            Write-ColorOutput "Please open MANUAL_INSTALL.md manually" $White
        }
    }

    Write-ColorOutput "`nPress Enter to exit..." $Cyan
    Read-Host | Out-Null
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    # Set execution policy for this session
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

    Write-Banner

    # Step 1: Prerequisites check
    Write-Step "1/3" "Prerequisites"

    $hasImageMagick = $false
    $magickVersion = Test-ImageMagick
    if ($magickVersion) {
        Write-Success "ImageMagick: FOUND (v$magickVersion)"
        $hasImageMagick = $true
    } else {
        Write-Warning "ImageMagick: NOT FOUND"
        Write-ColorOutput "    → Required for automated installation" $White
    }

    $hasSourceIcon = Test-SourceIcon
    if ($hasSourceIcon) {
        $sourceSize = [math]::Round((Get-Item "hi-res-icon-512.png").Length / 1KB, 1)
        Write-Success "Source icon: FOUND (${sourceSize}KB)"
    } else {
        Write-Error "Source icon: MISSING"
        Write-ColorOutput "    → Place hi-res-icon-512.png in project root" $White
    }

    # Show menu and handle choice
    $choice = Show-Menu -HasImageMagick $hasImageMagick -HasSourceIcon $hasSourceIcon

    switch ($choice) {
        "AUTOMATED" {
            Start-AutomatedInstall
        }
        "MANUAL" {
            Start-ManualInstall
        }
        "INSTALL_MAGICK" {
            Install-ImageMagick
            # Restart the script
            Write-ColorOutput "`nRestarting launcher..." $Cyan
            & $MyInvocation.MyCommand.Path
        }
        "MISSING_ICON" {
            Write-Error "Please place hi-res-icon-512.png in the project root and try again."
            Write-ColorOutput "`nPress Enter to exit..." $Cyan
            Read-Host | Out-Null
        }
        "QUIT" {
            Write-ColorOutput "`nInstallation cancelled." $Yellow
        }
    }

} catch {
    Write-Error "Unexpected error: $($_.Exception.Message)"
    Write-ColorOutput "`nFor help, see README.md" $Yellow

    Write-ColorOutput "`nPress Enter to exit..." $Cyan
    Read-Host | Out-Null
    exit 1
}
