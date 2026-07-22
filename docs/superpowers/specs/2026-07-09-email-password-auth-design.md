# Acceso principal por correo y contraseña

## Objetivo

Restablecer el acceso por correo y contraseña como método principal de NutriNet, con registro rápido y confirmación obligatoria del correo. Google se mantiene como alternativa y ambos métodos pueden convivir en una misma cuenta sin eliminar credenciales existentes.

## Experiencia de acceso

La ruta `/login` mantiene la identidad visual actual y presenta dos pestañas:

- **Iniciar sesión**, seleccionada inicialmente.
- **Crear cuenta**, disponible sin abandonar la página.

El inicio de sesión solicita correo y contraseña, permite mostrar u ocultar la contraseña, conserva la opción “Recordarme” y ofrece “Olvidé mi contraseña”. Este último abre el cliente de correo del usuario con un mensaje prellenado dirigido a `contacto@nutrinet.cl`; la recuperación será atendida manualmente por el equipo.

Google aparece después del formulario, separado visualmente y descrito como una alternativa. No será la llamada a la acción principal.

## Registro

El registro solicita únicamente:

- Nombre completo.
- Correo electrónico.
- Contraseña.
- Confirmación de contraseña.

El frontend normaliza el correo y valida los datos antes de enviarlos. Los campos inválidos reutilizan el patrón actual de NutriNet: borde semántico rojo, mensaje junto al campo, foco accesible y un resumen solo cuando exista un error general.

La contraseña debe tener al menos ocho caracteres, incluyendo mayúscula, minúscula, número y carácter especial, sin espacios. Los mismos requisitos se aplican en frontend y backend desde una definición coherente.

## Confirmación obligatoria

Una cuenta creada con correo queda en estado `PENDING`, sin sesión activa. NutriNet envía un enlace de confirmación y cambia el formulario por un estado de éxito que indica revisar la bandeja de entrada y spam.

Ese estado permite reenviar la confirmación al mismo correo. Si una persona intenta iniciar sesión con contraseña antes de confirmar, no obtiene una sesión: recibe un aviso específico y la acción para reenviar el correo.

El enlace existente `/verify-email` activa la cuenta y dirige al usuario de vuelta al login. Los tokens de verificación son de un solo uso; además se incorporará una vigencia limitada y el reenvío emitirá un token nuevo para invalidar enlaces anteriores.

Para evitar enumeración innecesaria de cuentas, el reenvío responderá con un mensaje neutral cuando corresponda. El inicio de sesión conservará el mensaje genérico para credenciales incorrectas, diferenciando únicamente la cuenta pendiente después de validar correctamente la contraseña.

## Backend y sesiones

Los endpoints públicos `POST /auth/login` y `POST /auth/register` volverán a delegar en los métodos ya existentes de `AuthService`, usando DTOs validados. El login seguirá generando el JWT y respetando “Recordarme”.

El registro seguirá creando una cuenta de nutricionista gratuita y su perfil dentro de una transacción. El envío de correo se realiza después de persistir la cuenta; un fallo del proveedor de correo se informará sin crear una sesión ni activar la cuenta.

Al iniciar con Google:

- Una cuenta de contraseña existente conserva su hash.
- Google confirma el correo y puede vincularse por la misma dirección verificada.
- Una cuenta creada solo con Google continúa sin contraseña.
- El proveedor deja de modelarse como una elección excluyente cuando existen ambos métodos.

No se reemplazará la arquitectura actual por Better Auth en esta entrega.

## Componentes y estados

La implementación separará responsabilidades pequeñas:

- Contenedor de pestañas y estado de autenticación.
- Formulario de inicio de sesión.
- Formulario de registro.
- Aviso de confirmación pendiente con reenvío.
- Botón de Google reutilizable.
- Servicio cliente para login, registro y reenvío.

Todos los controles tendrán estados de foco, carga, error y deshabilitado. Durante una solicitud no se permitirán envíos duplicados. El retorno `callbackUrl` se respetará tanto para correo como para Google y se limitará a rutas internas seguras.

## Verificación

Se cubrirán como mínimo estos casos:

- Registro válido crea una cuenta pendiente y solicita confirmación.
- Datos inválidos o correo duplicado producen errores útiles.
- Una cuenta pendiente no puede iniciar sesión y puede solicitar reenvío.
- Un token vigente activa la cuenta; uno vencido o reemplazado no lo hace.
- Una cuenta activa inicia sesión y respeta la duración elegida.
- Vincular Google no elimina una contraseña existente.
- Las cuentas suspendidas o eliminadas permanecen bloqueadas.
- Los formularios muestran errores por campo y son utilizables con teclado.
- El enlace de recuperación abre un correo dirigido a soporte.

## Fuera de alcance

- Recuperación automática de contraseña.
- Migración a otro proveedor de autenticación.
- Inicio de sesión sin contraseña o autenticación multifactor.
- Cambios en la selección de plan o incorporación posterior al login.
