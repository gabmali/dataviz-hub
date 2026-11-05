# Convenience runner for Windows sessions with Node but without npm on PATH.
param([Parameter(Position=0)][string]$Task = 'dev', [Parameter(ValueFromRemainingArguments=$true)][string[]]$TaskArguments)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskRoot
try {
    $taskNpm=Get-Command npm.cmd -ErrorAction SilentlyContinue
    $taskPnpm=Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    $taskBundled=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
    if($taskNpm){$taskExecutable=$taskNpm.Source}
    elseif($taskPnpm){$taskExecutable=$taskPnpm.Source}
    elseif(Test-Path -LiteralPath $taskBundled){$taskExecutable=$taskBundled}
    else{throw 'Instale Node.js 24 LTS (inclui npm) para executar o projeto.'}
    if($Task -eq 'install'){& $taskExecutable install @TaskArguments}
    else{& $taskExecutable run $Task @TaskArguments}
    $taskExit=$LASTEXITCODE
} finally {Pop-Location}
exit $taskExit
