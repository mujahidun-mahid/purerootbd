$base = "http://localhost:3001"
$out = @()

function Test-Req($label, $method, $url, $body, $headers) {
  $h = @{}; if ($headers) { $h = $headers }
  try {
    if ($body) {
      $r = Invoke-WebRequest -Uri $url -Method $method -Body $body -ContentType "application/json" -Headers $h -UseBasicParsing -TimeoutSec 25
    } else {
      $r = Invoke-WebRequest -Uri $url -Method $method -Headers $h -UseBasicParsing -TimeoutSec 25
    }
    $c = $r.Content
    if ($c.Length -gt 300) { $c = $c.Substring(0,300) }
    return [pscustomobject]@{ Test=$label; Status=[int]$r.StatusCode; Body=$c }
  } catch {
    $code = "ERR"
    $c = ""
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      try { $stream = $_.Exception.Response.GetResponseStream(); $sr = New-Object System.IO.StreamReader($stream); $c = $sr.ReadToEnd() } catch {}
    } else { $c = $_.Exception.Message }
    if ($c.Length -gt 400) { $c = $c.Substring(0,400) }
    return [pscustomobject]@{ Test=$label; Status=$code; Body=$c }
  }
}

# --- public APIs
$out += Test-Req "GET /api/site-settings" GET "$base/api/site-settings" $null $null
$out += Test-Req "GET /api/orders (no id)" GET "$base/api/orders" $null $null
$out += Test-Req "GET /api/orders/track (no params)" GET "$base/api/orders/track" $null $null
$out += Test-Req "GET /api/orders/track?query=x" GET "$base/api/orders/track?query=x" $null $null
$out += Test-Req "GET /api/analytics/event" GET "$base/api/analytics/event" $null $null
$out += Test-Req "POST /api/analytics/event" POST "$base/api/analytics/event" '{"event":"pageview","path":"/"}' $null

# --- order create (COD flow)
$order = '{"items":[{"slug":"almonds","name":"Almonds","price":500,"quantity":1}],"customer":{"name":"Test User","phone":"01700000000","email":"t@t.com","address":"Dhaka","city":"Dhaka","postal":"1200","notes":""},"paymentMethod":"cod","subtotal":500,"shipping":60,"total":560}'
$out += Test-Req "POST /api/orders (COD)" POST "$base/api/orders" $order $null

# --- admin APIs (no password configured -> expect graceful message)
$out += Test-Req "GET /api/admin/config" GET "$base/api/admin/config" $null $null
$out += Test-Req "GET /api/admin/dashboard" GET "$base/api/admin/dashboard" $null $null
$out += Test-Req "GET /api/admin/orders" GET "$base/api/admin/orders" $null $null
$out += Test-Req "GET /api/admin/settings" GET "$base/api/admin/settings" $null $null
$out += Test-Req "GET /api/admin/hero" GET "$base/api/admin/hero" $null $null
$out += Test-Req "POST /api/admin/login (wrong pw)" POST "$base/api/admin/login" '{"password":"wrong"}' $null
$out += Test-Req "POST /api/admin/login (no body)" POST "$base/api/admin/login" '{}' $null

$out | Format-List
