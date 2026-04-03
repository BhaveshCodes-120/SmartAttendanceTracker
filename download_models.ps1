$baseUrl = "https://raw.githubusercontent.com/vladmandic/face-api/master/model/"
$modelsDir = "frontend\models"
$jsDir = "frontend\js"
$files = @(
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

foreach ($file in $files) {
    $url = $baseUrl + $file
    $dest = Join-Path -Path $modelsDir -ChildPath $file
    Write-Host "Downloading $file..."
    Invoke-WebRequest -Uri $url -OutFile $dest
}

Write-Host "Downloading face-api.min.js..."
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js" -OutFile (Join-Path -Path $jsDir -ChildPath "face-api.min.js")
Write-Host "Done downloading models and library."
