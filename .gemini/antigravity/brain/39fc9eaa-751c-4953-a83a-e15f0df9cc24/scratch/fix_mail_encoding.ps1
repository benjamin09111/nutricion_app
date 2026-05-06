$path = "backend/src/modules/mail/mail.service.ts"
$lines = Get-Content $path -Encoding UTF8
$lines[43] = "      console.error('❌ Error enviando correo de bienvenida:', error);"
$lines[66] = "        '❌ Error enviando confirmación de registro:',"
$lines[80] = "          '🔔 Nueva Solicitud de Registro',"
$lines[97] = "        '❌ Error enviando notificación al administrador:',"
$lines[130] = "        '❌ Error enviando notificación de soporte:',"
$lines[153] = "        '❌ Error enviando confirmación de feedback:',"
$lines[177] = "      console.error('❌ Error enviando correo de rechazo:', error);"
$lines[205] = "        '❌ Error enviando correo de recuperación:',"
$lines[239] = "        '❌ Error enviando invitación de portal:',"
$lines[272] = "        '❌ Error enviando notificación de portal:',"
$lines[316] = "        '❌ Error enviando enlace de agendamiento:',"
$lines | Set-Content $path -Encoding UTF8
