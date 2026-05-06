$path = "frontend/src/app/dashboard/dieta/DietClient.tsx"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($path, $utf8NoBom)

# Patterns for mojibake replacements
# Format: @{ MojibakeString = CorrectString }
$map = @{
    ([char]0xC3 + [char]0xA1) = "á";
    ([char]0xC3 + [char]0xA9) = "é";
    ([char]0xC3 + [char]0xAD) = "í";
    ([char]0xC3 + [char]0xB3) = "ó";
    ([char]0xC3 + [char]0xBA) = "ú";
    ([char]0xC3 + [char]0xB1) = "ñ";
    ([char]0xC3 + [char]0x81) = "Á";
    ([char]0xC3 + [char]0x89) = "É";
    ([char]0xC3 + [char]0x8D) = "Í";
    ([char]0xC3 + [char]0x93) = "Ó";
    ([char]0xC3 + [char]0x9A) = "Ú";
    ([char]0xC3 + [char]0x91) = "Ñ";
    ([char]0xC2 + [char]0xBF) = "¿";
    ([char]0xC2 + [char]0xA1) = "¡";
}

foreach ($key in $map.Keys) {
    $content = $content.Replace($key, $map[$key])
}

[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
