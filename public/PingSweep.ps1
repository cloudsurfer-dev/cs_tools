<#
.SYNOPSIS
    Pings all hosts in one or more /24 subnets to wake up ARP/MAC table entries.

.DESCRIPTION
    Uses parallel runspaces to sweep subnets quickly without requiring admin rights.
    Useful for populating ARP and MAC address tables before running network audits.

.PARAMETER Subnets
    One or more network addresses to sweep. Always assumes /24.
    Examples: "192.168.1.0" or "192.168.1.0","192.168.2.0"

.PARAMETER Port
    TCP port to use for connectivity check. Defaults to 445 (SMB).
    Any port works for ARP wake-up purposes — even a refused connection triggers ARP.

.PARAMETER TimeoutMs
    Timeout in milliseconds per host. Defaults to 500.

.PARAMETER ThrottleLimit
    Maximum number of concurrent runspaces. Defaults to 50.

.EXAMPLE
    .\PingSweep.ps1 -Subnets "192.168.1.0"

.EXAMPLE
    .\PingSweep.ps1 -Subnets "192.168.1.0","192.168.2.0" -Port 80 -TimeoutMs 300

.EXAMPLE
    .\PingSweep.ps1 -Subnets "192.168.1.0" -ThrottleLimit 100
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string[]] $Subnets,

    [int] $Port         = 445,
    [int] $TimeoutMs    = 500,
    [int] $ThrottleLimit = 50
)

# Build full host list from all subnets
$hosts = @()
foreach ($subnet in $Subnets) {
    if ($subnet -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}') {
        Write-Error "Invalid subnet: '$subnet'. Expected format: 192.168.1.0"
        exit 1
    }
    $network = $subnet -replace '\.\d+$', ''
    $hosts  += 1..254 | ForEach-Object { $network + '.' + $PSItem }
}

$total    = $hosts.Count
$alive    = [System.Collections.Concurrent.ConcurrentBag[string]]::new()
$complete = [System.Collections.Concurrent.ConcurrentBag[int]]::new()

Write-Host "Sweeping $total hosts across $($Subnets.Count) subnet(s) on port $Port..."
Write-Host ""

# Create runspace pool
$pool = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspacePool(1, $ThrottleLimit)
$pool.Open()

$runspaces = foreach ($ip in $hosts) {
    $ps = [System.Management.Automation.PowerShell]::Create()
    $ps.RunspacePool = $pool

    [void] $ps.AddScript({
        param($ip, $port, $timeoutMs, $alive, $complete)
        try {
            $tcp    = New-Object System.Net.Sockets.TcpClient
            $result = $tcp.ConnectAsync($ip, $port).Wait($timeoutMs)
            $tcp.Dispose()
            if ($result) { [void] $alive.Add($ip) }
        } catch { }
        [void] $complete.Add(1)
    })

    [void] $ps.AddArgument($ip)
    [void] $ps.AddArgument($Port)
    [void] $ps.AddArgument($TimeoutMs)
    [void] $ps.AddArgument($alive)
    [void] $ps.AddArgument($complete)

    [PSCustomObject]@{ PowerShell = $ps; Handle = $ps.BeginInvoke() }
}

# Progress loop
while ($complete.Count -lt $total) {
    $pct = [math]::Round(($complete.Count / $total) * 100)
    Write-Progress -Activity "Ping sweep" -Status "$($complete.Count) / $total hosts" -PercentComplete $pct
    Start-Sleep -Milliseconds 200
}

Write-Progress -Completed -Activity "Ping sweep"

# Cleanup
foreach ($rs in $runspaces) {
    $rs.PowerShell.EndInvoke($rs.Handle)
    $rs.PowerShell.Dispose()
}
$pool.Close()
$pool.Dispose()

$aliveCount = $alive.Count
Write-Host "Done. Pinged $total hosts - $aliveCount alive, $($total - $aliveCount) unreachable."

if ($aliveCount -gt 0) {
    Write-Host ""
    Write-Host "Alive hosts:"
    $alive | Sort-Object | ForEach-Object { Write-Host ('  ' + $PSItem) }
}