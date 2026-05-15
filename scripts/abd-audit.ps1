# ABDAuth SYSTEM AUDIT - INDUSTRIAL HIGH-FIDELITY EDITION
# Literal execution via cmd /c to bypass PowerShell argument parsing glitches.

CLS
$LogFile = "abd-audit-results.log"
$GlobalStatus = $true

if (Test-Path $LogFile) { Remove-Item $LogFile }
"ABDAuth SYSTEM AUDIT REPORT - $(Get-Date)" | Out-File -FilePath $LogFile -Encoding utf8

function Run-AuditStep {
    param(
        [string]$Name,
        [string]$FullCommand
    )
    
    Write-Host "`n[$Name] " -ForegroundColor Cyan
    Write-Host "  > In progress... " -NoNewline -ForegroundColor Gray
    
    $errorsCount = 0
    $warningsCount = 0
    
    try {
        # Literal execution via cmd /c
        $out = cmd /c $FullCommand 2>&1
        $out | Out-File -FilePath $LogFile -Append -Encoding utf8
        
        $exitCode = $LASTEXITCODE
        
        # Parse progress from arch-guard
        $progressLine = $out | Where-Object { $_ -like "PROGRESS:*" } | Select-Object -Last 1
        if ($progressLine) {
            $parts = $progressLine.Split(':')
            if ($parts.Count -ge 4) { $errorsCount = $parts[3] }
            if ($parts.Count -ge 5) { $warningsCount = $parts[4] }
        }
        
    } catch {
        $exitCode = 1
        "ERROR: $($_.Exception.Message)" | Out-File -FilePath $LogFile -Append -Encoding utf8
    }
    
    if ($exitCode -eq 0) {
        Write-Host "`r  -> PASSED [OK] ($errorsCount errors, $warningsCount warnings)".PadRight(60) -ForegroundColor Green
    } else {
        $errDisplay = $errorsCount
        if ($errorsCount -eq 0 -or $errorsCount -eq $null) { $errDisplay = "Technical" }
        Write-Host "`r  -> FAILED [!!] ($errDisplay errors detected, $warningsCount warnings)".PadRight(60) -ForegroundColor Red
        $script:GlobalStatus = $false
    }
}

Write-Host "`n[ABDAuth AUDIT] Starting 6-Phase Industrial Certification..." -ForegroundColor White -BackgroundColor DarkCyan

Run-AuditStep -Name "1/6 Structural Audit" -FullCommand "node scripts/arch-guard.mjs structural"
Run-AuditStep -Name "2/6 i18n Coverage   " -FullCommand "node scripts/arch-guard.mjs i18n"
Run-AuditStep -Name "3/6 a11y Compliance " -FullCommand "node scripts/arch-guard.mjs a11y"
Run-AuditStep -Name "4/6 Purity & Types  " -FullCommand "node scripts/arch-guard.mjs purity"
Run-AuditStep -Name "5/6 Type Safety (TSC)" -FullCommand "npm run tsc -- --noEmit"
Run-AuditStep -Name "6/6 Code Quality    " -FullCommand "npm run lint"

if ($GlobalStatus) {
    Write-Host "`n[AUDIT] SYSTEM CERTIFIED - ERA 11 COMPLIANT [OK]" -ForegroundColor Green -BackgroundColor Black
    exit 0
} else {
    Write-Host "`n[AUDIT] BREACHES DETECTED - SYSTEM NOT READY [!!]" -ForegroundColor Red -BackgroundColor Black
    Write-Host "Detailed diagnostics available in: $LogFile" -ForegroundColor Gray
    exit 1
}
