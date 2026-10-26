<?php
/**
 * Trace handmade social PNGs into SVG icons (silhouette paths + transparent PNG).
 */

function makeTransparentPng(string $src, string $destPng): void
{
    $srcIm = imagecreatefrompng($src);
    $w = imagesx($srcIm);
    $h = imagesy($srcIm);
    $png = imagecreatetruecolor($w, $h);
    imagealphablending($png, false);
    imagesavealpha($png, true);
    $t = imagecolorallocatealpha($png, 0, 0, 0, 127);
    imagefilledrectangle($png, 0, 0, $w, $h, $t);
    imagealphablending($png, true);

    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $rgba = imagecolorat($srcIm, $x, $y);
            $r = ($rgba >> 16) & 0xFF;
            $g = ($rgba >> 8) & 0xFF;
            $b = $rgba & 0xFF;
            $lum = $r * 0.3 + $g * 0.59 + $b * 0.11;
            if ($lum < 178) {
                // Keep pencil grain as variable alpha
                $alpha = (int) max(0, min(120, round(($lum / 178) * 95)));
                $col = imagecolorallocatealpha($png, 18, 18, 18, $alpha);
                imagesetpixel($png, $x, $y, $col);
            }
        }
    }

    imagedestroy($srcIm);
    imagepng($png, $destPng);
    imagedestroy($png);
}

function buildMask(string $src, int $tw = 140): array
{
    $im = imagecreatefrompng($src);
    $w = imagesx($im);
    $h = imagesy($im);
    $th = (int) max(1, round($h * ($tw / $w)));
    $small = imagecreatetruecolor($tw, $th);
    imagecopyresampled($small, $im, 0, 0, 0, 0, $tw, $th, $w, $h);
    imagedestroy($im);

    $mask = array_fill(0, $th, array_fill(0, $tw, 0));
    for ($y = 0; $y < $th; $y++) {
        for ($x = 0; $x < $tw; $x++) {
            $rgba = imagecolorat($small, $x, $y);
            $r = ($rgba >> 16) & 0xFF;
            $g = ($rgba >> 8) & 0xFF;
            $b = $rgba & 0xFF;
            $lum = $r * 0.3 + $g * 0.59 + $b * 0.11;
            $mask[$y][$x] = $lum < 165 ? 1 : 0;
        }
    }
    imagedestroy($small);
    return [$mask, $tw, $th];
}

function dilate(array $mask, int $tw, int $th): array
{
    $out = $mask;
    for ($y = 1; $y < $th - 1; $y++) {
        for ($x = 1; $x < $tw - 1; $x++) {
            if ($mask[$y][$x]) {
                continue;
            }
            for ($dy = -1; $dy <= 1; $dy++) {
                for ($dx = -1; $dx <= 1; $dx++) {
                    if ($mask[$y + $dy][$x + $dx]) {
                        $out[$y][$x] = 1;
                        break 2;
                    }
                }
            }
        }
    }
    return $out;
}

function traceContours(array $mask, int $tw, int $th): array
{
    $dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    $visited = array_fill(0, $th, array_fill(0, $tw, 0));
    $paths = [];

    $isBoundary = function ($x, $y) use ($mask, $tw, $th, $dirs) {
        if (!$mask[$y][$x]) {
            return false;
        }
        foreach ($dirs as $d) {
            $nx = $x + $d[0];
            $ny = $y + $d[1];
            if ($nx < 0 || $ny < 0 || $nx >= $tw || $ny >= $th || !$mask[$ny][$nx]) {
                return true;
            }
        }
        return false;
    };

    for ($sy = 1; $sy < $th - 1; $sy++) {
        for ($sx = 1; $sx < $tw - 1; $sx++) {
            if (!$isBoundary($sx, $sy) || $visited[$sy][$sx]) {
                continue;
            }

            $path = [];
            $x = $sx;
            $y = $sy;
            $dir = 0;
            $guard = 0;

            do {
                $visited[$y][$x] = 1;
                if (count($path) % 2 === 0) {
                    $path[] = [$x, $y];
                }
                $found = false;
                for ($i = 0; $i < 8; $i++) {
                    $nd = ($dir + $i + 6) % 8;
                    $nx = $x + $dirs[$nd][0];
                    $ny = $y + $dirs[$nd][1];
                    if ($nx < 1 || $ny < 1 || $nx >= $tw - 1 || $ny >= $th - 1) {
                        continue;
                    }
                    if ($isBoundary($nx, $ny)) {
                        $x = $nx;
                        $y = $ny;
                        $dir = $nd;
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    break;
                }
                $guard++;
            } while (!($x === $sx && $y === $sy) && $guard < 12000);

            if (count($path) > 22) {
                $paths[] = $path;
            }
        }
    }

    usort($paths, fn($a, $b) => count($b) <=> count($a));
    return array_slice($paths, 0, 8);
}

function pathsToSvg(array $paths, int $tw, int $th, string $title): string
{
    $sx = 100 / $tw;
    $sy = 100 / $th;
    $dAll = '';
    foreach ($paths as $path) {
        $d = '';
        foreach ($path as $i => $pt) {
            $px = round($pt[0] * $sx, 2);
            $py = round($pt[1] * $sy, 2);
            $d .= ($i === 0 ? 'M' : 'L') . $px . ' ' . $py . ' ';
        }
        $dAll .= trim($d) . ' Z ';
    }

    return '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
        . '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor" role="img" aria-label="'
        . htmlspecialchars($title, ENT_QUOTES) . '">' . "\n"
        . '  <path fill-rule="evenodd" d="' . trim($dAll) . '"/>' . "\n"
        . '</svg>' . "\n";
}

function hybridSvg(string $transparentPng, string $title): string
{
    $bin = base64_encode(file_get_contents($transparentPng));
    return '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
        . '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" role="img" aria-label="'
        . htmlspecialchars($title, ENT_QUOTES) . '">' . "\n"
        . '  <style>image{filter:none}</style>' . "\n"
        . '  <image width="100" height="100" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,'
        . $bin . '"/>' . "\n"
        . '</svg>' . "\n";
}

$base = dirname(__DIR__) . '/site/assets/img';
$outDir = $base . '/icons';
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}

$labels = [
    'instagram' => 'Instagram',
    'linkedin' => 'LinkedIn',
    'whatsapp' => 'WhatsApp',
];

foreach ($labels as $name => $label) {
    $src = "$base/$name.png";
    $pngOut = "$outDir/$name.png";
    $svgTrace = "$outDir/$name.svg";
    $svgHybrid = "$outDir/$name-draw.svg";

    makeTransparentPng($src, $pngOut);
    [$mask, $tw, $th] = buildMask($src, 130);
    $mask = dilate($mask, $tw, $th);
    $paths = traceContours($mask, $tw, $th);

    if ($paths) {
        file_put_contents($svgTrace, pathsToSvg($paths, $tw, $th, $label));
        echo "traced $name (" . count($paths) . " paths)\n";
    } else {
        echo "no paths for $name\n";
    }

    // Faithful drawing texture preserved for use as mask/icon
    file_put_contents($svgHybrid, hybridSvg($pngOut, $label));
    echo "hybrid $name\n";
}

echo "done\n";
