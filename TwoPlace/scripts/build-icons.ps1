Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path $PSScriptRoot -Parent
function Resize-Asset([string]$Source, [string]$Target, [int]$Size) {
    $original = [System.Drawing.Image]::FromFile((Join-Path $taskRoot $Source))
    $bitmap = [System.Drawing.Bitmap]::new($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($original, 0, 0, $Size, $Size)
        $bitmap.Save((Join-Path $taskRoot $Target), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose(); $original.Dispose() }
}
foreach ($size in @(32,180,192,512)) { Resize-Asset 'public/momo-icon-master-v1.png' "public/momo-icon-$size-v1.png" $size }
foreach ($entry in @(@('mdpi',48,108),@('hdpi',72,162),@('xhdpi',96,216),@('xxhdpi',144,324),@('xxxhdpi',192,432))) {
    $path = "android/app/src/main/res/mipmap-$($entry[0])"
    Resize-Asset 'public/momo-icon-master-v1.png' "$path/ic_launcher.png" $entry[1]
    Resize-Asset 'public/momo-icon-master-v1.png' "$path/ic_launcher_round.png" $entry[1]
    Resize-Asset 'public/momo-icon-master-v1.png' "$path/ic_launcher_foreground.png" $entry[2]
}
Resize-Asset 'public/pets/mochi-standing-v2.png' 'android/app/src/main/res/drawable/momo_launch.png' 320
Resize-Asset 'public/pets/kuki-standing-v2.png' 'android/app/src/main/res/drawable/kuki_launch.png' 320
