$path = "frontend/src/app/dashboard/entregable/DeliverableClient.tsx"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($path, $utf8NoBom)

$map = @{
    ([char]0xC3 + [char]0xA1) = [char]0xE1;
    ([char]0xC3 + [char]0xA9) = [char]0xE9;
    ([char]0xC3 + [char]0xAD) = [char]0xED;
    ([char]0xC3 + [char]0xB3) = [char]0xF3;
    ([char]0xC3 + [char]0xBA) = [char]0xFA;
    ([char]0xC3 + [char]0xB1) = [char]0xF1;
    ([char]0xC3 + [char]0x81) = [char]0xC1;
    ([char]0xC3 + [char]0x89) = [char]0xC9;
    ([char]0xC3 + [char]0x8D) = [char]0xCD;
    ([char]0xC3 + [char]0x93) = [char]0xD3;
    ([char]0xC3 + [char]0x9A) = [char]0xDA;
    ([char]0xC3 + [char]0x91) = [char]0xD1;
    ([char]0xC2 + [char]0xBF) = [char]0xBF;
    ([char]0xC2 + [char]0xA1) = [char]0xA1;
}

foreach ($key in $map.Keys) {
    $content = $content.Replace($key, $map[$key])
}

[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
