$base = "http://localhost:3001"

# wait for server readiness
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try { $r = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { $ready = $true; break } }
  catch { Start-Sleep -Milliseconds 1000 }
}
if (-not $ready) { Write-Host "SERVER NOT READY"; exit 1 }
Write-Host "Server ready on $base`n"

$routes = @(
  "/", "/shop", "/cart", "/checkout", "/payment", "/order-confirmation",
  "/about", "/reviews", "/faq", "/contact", "/shipping", "/returns",
  "/privacy", "/terms", "/track-order", "/search?q=nuts", "/wishlist",
  "/account", "/admin", "/category/nuts", "/category/seeds",
  "/product/almonds", "/product/nonexistent-product-xyz",
  "/definitely-not-a-route-xyz"
)

$results = @()
foreach ($r in $routes) {
  try {
    $resp = Invoke-WebRequest -Uri "$base$r" -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
    $body = $resp.Content
    $err = ""
    if ($body -match 'Application error|Internal Server Error|Unhandled Runtime|Something went wrong') { $err = "ERRTEXT" }
    $results += [pscustomobject]@{ Route = $r; Status = [int]$resp.StatusCode; Note = $err }
  } catch {
    $code = "ERR"
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    $results += [pscustomobject]@{ Route = $r; Status = $code; Note = "FAIL $($_.Exception.Message)" }
  }
}
$results | Format-Table -AutoSize -Wrap
