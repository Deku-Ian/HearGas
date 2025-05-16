# PowerShell script to send sensor readings to Firebase
# Configuration
$firebaseUrl = "https://rtmask-cf652-default-rtdb.firebaseio.com/sensors/HearGas01/current.json"

function Test-FirebaseConnection {
    try {
        Write-Host "Testing Firebase connection..."
        $response = Invoke-WebRequest -Uri "https://rtmask-cf652-default-rtdb.firebaseio.com/.json" -Method GET
        if ($response.StatusCode -eq 200) {
            Write-Host "Firebase connection successful!"
            return $true
        }
        else {
            Write-Host "Firebase connection failed with status code: $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Host "Error testing Firebase connection: $_"
        return $false
    }
}

function Get-SensorReadings {
    $readings = @{
        mq2_value   = 900    # LPG - Warning level
        mq4_value   = 1800   # Methane - Warning level
        mq9_value   = 4100   # CO - Danger level
        mq135_value = 1500   # Ammonia - Normal level
    }

    return @{
        readings      = $readings
        timestamp     = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        alertLevel    = "Low"
        detectedGases = @()
    }
}

function Send-ToFirebase {
    param (
        [Parameter(Mandatory = $true)]
        [hashtable]$readings
    )
    
    try {
        $jsonBody = $readings | ConvertTo-Json -Compress
        Write-Host "Sending data to Firebase..."
        Write-Host "Data being sent: $jsonBody"
        
        $response = Invoke-WebRequest `
            -Uri $firebaseUrl `
            -Method PUT `
            -Body $jsonBody `
            -ContentType "application/json" `
            -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "Successfully sent data to Firebase"
            Write-Host "Response content:"
            Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json)
        }
        else {
            Write-Host "Error: Received status code $($response.StatusCode)"
        }
    }
    catch {
        Write-Host "Error sending data to Firebase: $_"
    }
}

# Main execution
Write-Host "Testing Firebase connection..."
$firebaseConnected = Test-FirebaseConnection

if ($firebaseConnected) {
    $readings = Get-SensorReadings
    Send-ToFirebase -readings $readings
}
else {
    Write-Host "Cannot proceed with sending data - Firebase connection failed"
} 