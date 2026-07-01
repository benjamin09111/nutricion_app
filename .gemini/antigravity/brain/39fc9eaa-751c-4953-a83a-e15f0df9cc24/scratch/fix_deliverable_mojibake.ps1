$path = "frontend/src/app/dashboard/entregable/DeliverableClient.tsx"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText($path, $utf8NoBom)

$replacements = @{
    "Ã¡" = "á";
    "Ã©" = "é";
    "Ã­" = "í";
    "Ã³" = "ó";
    "Ãº" = "ú";
    "Ã±" = "ñ";
    "Ã " = "Í";
    "Ã“" = "Ó";
    "Ãš" = "Ú";
    "Ã‘" = "Ñ";
    "Â¿" = "¿";
    "Â¡" = "¡";
}

foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
}

[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
