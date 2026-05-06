# Plan: Portal Diary Pagination (Ver más)

## Objetivo
Implementar un sistema de cargado progresivo para el historial de la libreta en el Portal del Paciente, mostrando inicialmente 3 registros y permitiendo cargar más de 10 en 10.

## Alcance
- **Estado**: Añadir un estado `visibleEntriesCount` para controlar cuántas entradas se muestran.
- **Lógica**: Implementar el "slicing" del array de registros en el frontend.
- **Interfaz**: Añadir un botón "Ver más" estilizado que solo aparezca cuando hay más registros disponibles.
- **UX**: Asegurar que al cargar más registros la experiencia sea fluida y profesional.

## Pasos de Implementación

### Fase 1: Frontend (PortalClient.tsx)
1. **Nuevo Estado**: Definir `const [visibleEntriesCount, setVisibleEntriesCount] = useState(3)`.
2. **Lógica de Filtrado**: Crear una variable computada `visibleEntries` que haga un `.slice(0, visibleEntriesCount)` del array `portalData.tracking`.
3. **Botón Ver más**:
   - Posicionar el botón al final del feed.
   - Mostrar solo si `visibleEntriesCount < portalData.tracking.length`.
   - Al hacer clic, ejecutar `setVisibleEntriesCount(prev => prev + 10)`.
4. **Estilo**: Asegurar que el botón tenga el estándar visual del proyecto (índigo, bordes redondeados, hover suave).

## Plan de Verificación
- **Funcional**: Validar que solo aparecen 3 registros al inicio.
- **Paginación**: Confirmar que al dar click en "Ver más" aparecen los siguientes registros (hasta 10 adicionales).
- **Consistencia**: Verificar que el botón desaparece cuando se muestran todos los registros.
