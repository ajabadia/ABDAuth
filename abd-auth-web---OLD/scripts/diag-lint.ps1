$ErrorActionPreference = 'Continue'
Write-Host "🔍 Iniciando diagnóstico profundo de Fase 6..."
npm run lint -- --no-quiet > lint-diagnosis.log 2>&1
Write-Host "✅ Diagnóstico completado. Revisa lint-diagnosis.log"
