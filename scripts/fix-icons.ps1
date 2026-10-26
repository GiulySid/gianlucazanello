Add-Type -AssemblyName System.Drawing

$iconsDir = "C:\Users\giuli\OneDrive\Documenti\Progetti\gianlucazanello\site\assets\img\icons"
$srcDir = "C:\Users\giuli\OneDrive\Documenti\Progetti\gianlucazanello\site\assets\img"
$origDir = $srcDir

function Dilate-Alpha([System.Drawing.Bitmap]$src, [int]$radius) {
  $w = $src.Width; $h = $src.Height
  $ink = New-Object 'byte[,]' $h, $w
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $c = $src.GetPixel($x, $y)
      $lum = ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
      if ($c.A -gt 20 -and ($lum -gt 100 -or $c.A -gt 50)) {
        $ink[$y, $x] = [byte][Math]::Max(80, $c.A)
      }
    }
  }
  $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $r2 = $radius * $radius
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $max = 0
      for ($dy = -$radius; $dy -le $radius; $dy++) {
        for ($dx = -$radius; $dx -le $radius; $dx++) {
          if (($dx*$dx + $dy*$dy) -gt ($r2 + 1)) { continue }
          $nx = $x + $dx; $ny = $y + $dy
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { continue }
          if ($ink[$ny, $nx] -gt $max) { $max = $ink[$ny, $nx] }
        }
      }
      if ($max -gt 0) {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb([int]$max, 255, 255, 255))
      } else {
        $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  return $out
}

function From-OriginalDark([string]$srcPath, [int]$radius) {
  $src = [System.Drawing.Bitmap]::FromFile($srcPath)
  $w = $src.Width; $h = $src.Height
  $mask = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $c = $src.GetPixel($x, $y)
      $lum = ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
      if ($lum -lt 175) {
        $a = [int][Math]::Max(90, [Math]::Min(255, [Math]::Round(255 - ($lum / 175 * 180))))
        $mask.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 255, 255, 255))
      } else {
        $mask.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  $src.Dispose()
  $thick = Dilate-Alpha $mask $radius
  $mask.Dispose()
  return $thick
}

# Rebuild social icons from originals with thicker stroke
foreach ($name in @("instagram", "linkedin", "whatsapp")) {
  Write-Host "Rebuild $name"
  $thick = From-OriginalDark (Join-Path $origDir "$name.png") 5
  $path = Join-Path $iconsDir "$name.png"
  if (Test-Path $path) { Remove-Item $path -Force }
  $thick.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $thick.Dispose()
}

# Nicolini: crop ONLY the left emblem (staff + monogram + small script), before sans text
Write-Host "Rebuild nicolini"
$logo = [System.Drawing.Bitmap]::FromFile((Join-Path $srcDir "conservatorio-nicolini-src.png"))
# Visual check: emblem ends before "Conservatorio" text ~ 0.33 of width
$cropW = [int]($logo.Width * 0.33)
$cropH = $logo.Height
$emblem = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $cropH; $y++) {
  for ($x = 0; $x -lt $cropW; $x++) {
    $c = $logo.GetPixel($x, $y)
    $lum = ($c.R * 0.3) + ($c.G * 0.59) + ($c.B * 0.11)
    if ($lum -gt 85) {
      $a = [int][Math]::Max(70, [Math]::Min(255, [Math]::Round((($lum - 85) / 170.0) * 255)))
      $emblem.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 255, 255, 255))
    } else {
      $emblem.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }
  }
}
$logo.Dispose()

$side = [Math]::Max($emblem.Width, $emblem.Height) + 16
$square = New-Object System.Drawing.Bitmap $side, $side, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($square)
$g.Clear([System.Drawing.Color]::Transparent)
$ox = [int](($side - $emblem.Width) / 2)
$oy = [int](($side - $emblem.Height) / 2)
$g.DrawImageUnscaled($emblem, $ox, $oy)
$g.Dispose()
$emblem.Dispose()

$thickNic = Dilate-Alpha $square 2
$square.Dispose()
$nicPath = Join-Path $iconsDir "nicolini.png"
if (Test-Path $nicPath) { Remove-Item $nicPath -Force }
$thickNic.Save($nicPath, [System.Drawing.Imaging.ImageFormat]::Png)
$thickNic.Dispose()
Write-Host "done"
