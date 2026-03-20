# Project TODO

- [x] Diseño elegante: tema visual, paleta de colores, tipografía y estilos globales
- [x] Esquema de base de datos para dietas, menús, comidas y alimentos
- [x] Formulario de configuración (calorías, macros, comidas/día, menús totales, alimentos a evitar)
- [x] Motor de generación de dietas con LLM (menús personalizados)
- [x] Sistema de alternativas: 1 alternativa por cada alimento en cada comida
- [x] Vista de resultados con información nutricional detallada (calorías y macros por comida)
- [x] Interfaz para visualizar y gestionar múltiples menús con alternativas
- [x] Guardar dietas en base de datos (historial de menús)
- [x] Generación de PDF descargable con formato profesional
- [x] Notificación al propietario cuando se genera una nueva dieta
- [x] Tests unitarios con Vitest
- [x] Bug: Error al insertar dieta en BD - campo avoidFoods no se serializa correctamente como JSON (tablas no existían + sintaxis TiDB incompatible)
- [x] Editar nombre de cada comida (ej: renombrar "Desayuno" a "Pre-entreno")
- [x] Sustituir un alimento por otro manualmente (con búsqueda en la base de datos de alimentos)
- [x] Editar cantidades de alimentos manualmente después de generar la dieta
- [x] Integrar base de datos de 1146 alimentos del usuario como referencia para el LLM
- [x] Incluir recetas/combinaciones habituales del usuario en el prompt del LLM (judías verdes con cebolla y jamón, guisantes + carne/pescado, tostadas, yogures, bowls)
- [x] PDF: mostrar solo nombre de comida, alimentos, cantidades y alternativas (SIN calorías ni macros)
- [x] Añadir comidas completas a un menú ya generado (ej: pasar de 3 a 4 comidas)
- [x] Eliminar comidas completas de un menú ya generado (ej: pasar de 5 a 4 comidas)
- [x] Ajustar gramos de cada alimento individualmente después de generar la dieta
- [x] Recalcular macros automáticamente al cambiar gramos de un alimento (proporcional a la BD nutricional)
- [x] Duplicar dieta existente para modificar parámetros y regenerar
- [x] Añadir alimentos manualmente buscando en la BD (sin IA)
- [x] Rediseñar PDF con formato grid: columnas = menús, filas = comidas, estilo profesional tipo referencia
- [x] Al sustituir un alimento, la alternativa se actualiza automáticamente con un alimento equivalente coherente
- [x] Nombres de comidas coherentes según número de comidas (3: desayuno/comida/cena, 4: +snack mañana, 5: +snack tarde)
- [x] Contenido de comidas coherente con el momento del día (desayuno con alimentos de desayuno, comida/cena con platos principales, snacks ligeros)
- [x] Logo NoLimitPerformance en la cabecera del PDF exportado
- [x] Lista de la compra automática con todos los alimentos y cantidades totales
- [x] Plantillas rápidas predefinidas (volumen, definición, keto, mantenimiento)
- [x] Selector de tipo de dieta en formulario (paleo, keto, mediterránea, real food, equilibrada)
- [x] Selector de nivel de cocina en formulario (cocinar más o menos)
- [x] Prompt del LLM adaptado según tipo de dieta y nivel de cocina seleccionados
- [x] Menús siempre diferentes entre días (no repetir platos/combinaciones de un menú a otro)
- [x] Al añadir un alimento manualmente, generar automáticamente su alternativa/sustituto
- [x] Al sustituir un alimento, asegurar que siempre se genera la alternativa del nuevo alimento
- [x] Integrar filosofía de menús del usuario (7 dietas reales) como referencia en el prompt LLM
- [x] Botón para regenerar una comida completa con alimentos diferentes (alternativa al menú propuesto)
- [x] Notas/instrucciones de preparación por comida
- [x] Exportar lista de la compra a PDF
- [x] Modo oscuro
- [x] Al duplicar dieta, mostrar diálogo para cambiar el nombre (ej: nombre del cliente)
- [x] Eliminar la fecha de creación de la vista de dietas
- [x] Bug: El diálogo de duplicar dieta no permite cambiar el nombre
- [x] Descripción automática de cada comida (línea legible tipo nombre de plato cocinado)
- [x] Variedad garantizada entre dietas generadas (evitar repetir combinaciones, rotar ingredientes)
- [x] Campo opcional de preferencias por comida en el formulario de generación
- [x] Botón "Rehacer dieta" que regenera con mismos parámetros pero menús diferentes
- [x] Combinaciones de alimentos coherentes e inteligentes (platos reales, gastronomía mediterránea)
- [x] Descripción de comida editable manualmente (clic para editar, guardar con Enter o blur)
- [x] Sin repetición de alimentos entre días del mismo menú (instrucción explícita en prompt)
- [x] PDF simplificado: primera página solo logo + nombre de la dieta (sin calorías, fecha, comidas)
- [x] Ajuste de macros y calorías sobre dieta ya creada (recalcular cantidades automáticamente)
- [x] Toggle medidas caseras (puñado, filete, taza, cucharadas) en vez de gramos
- [x] Selector de supermercado (Mercadona, Lidl, Aldi) para ajustar alimentos a productos reales
- [x] Calorías y macros diferentes por día (días entreno vs descanso)
- [x] Sección Mis Recetas: crear recetas propias y usarlas en la generación
- [x] Generar guía nutricional personalizada en PDF
- [x] Copiar comida de un día a otro (menú completo o comida individual)
- [x] Mejorar peso de preferencias en el prompt (cumplimiento obligatorio y literal)

## Bloque A: Mejoras al generador de dietas
- [x] A1: Guardar comida como receta con un botón (toast de confirmación)
- [x] A2: Ordenar alimentos arrastrando (drag & drop) dentro de cada comida (sortOrder en BD)
- [x] A3: Vista resumen semanal con toggle de comidas y recálculo de macros
- [x] A4: Copiar/pegar comida en varios días a la vez (copiar comida entre menús)
- [x] A5: Campo "Alimentos a potenciar o preferidos" en formulario de generación
- [x] A6: Campo "Alergias e intolerancias" en formulario de generación
- [x] A7: Opción de ayuno intermitente (16/8, 18/6, 20/4, personalizado)
- [x] A8: Apartado de suplementación editable en plan y PDF
- [x] A9: Alimentos personalizados del cliente (nombre, kcal, macros por 100g)
- [x] A10: Página de instrucciones editable al inicio del PDF
- [x] A11: Guía nutricional personalizada en PDF mejorada
- [x] A12: Carpetas/etiquetas para agrupar planes nutricionales (BD lista, UI pendiente)
- [x] A13: Alimentos personalizados del cliente (unificado con A9)

## Bloque B: Módulo cliente-entrenador
- [x] B1: Registro de adherencia diaria (cumplida, parcial, no cumplida)
- [x] B2: Subida de fotos de seguimiento (frente, perfil, espalda)
- [x] B3: Check-in semanal automatizado (peso, energía, sueño, adherencia, comentarios)
- [x] B4: Chat interno entrenador-cliente
- [x] B5: Dashboard de adherencia para el entrenador (resumen todos los clientes)
- [x] B6: Notificaciones y recordatorios para el cliente (estructura lista)
- [x] B7: Mensajes de motivación automatizados (generados por IA)
- [x] B8: Valoración inicial automatizada (cuestionario completo)
- [x] B9: Gráfica de evolución de peso y medidas (tabla de medidas)
- [x] B10: Sistema de logros y rachas (gamificación)
- [x] B11: Recomendación automática de ajuste al entrenador (IA)
- [x] B12: Modo consulta express (resumen rápido del cliente)

## Rediseño Apple + Nuevas funcionalidades
- [x] Rediseño global: colores Apple (#F5F5F7, #1D1D1F, #0071E3), tipografía SF Pro/Inter, variables CSS
- [x] Fuente Inter/SF Pro en index.html vía Google Fonts CDN
- [x] Componentes: tarjetas border-radius 12-16px, sombra sutil, botones pill shape, inputs Apple-style
- [x] Layout: espaciado múltiplos de 8px, máximo 2 columnas desktop
- [x] DashboardLayout: sidebar minimalista Apple-style, barra inferior móvil
- [x] Microinteracciones: transiciones 200-300ms, skeleton screens, toasts discretos
- [x] Eliminar degradados agresivos, sombras pronunciadas, bordes gruesos, colores llamativos
- [x] Rediseño Home.tsx (formulario limpio Apple-style)
- [x] Rediseño History.tsx (listado minimalista)
- [x] Rediseño DietDetail.tsx (vista de dieta premium)
- [x] Rediseño Recipes.tsx, CustomFoods.tsx, Clients.tsx, ClientDetail.tsx, TrainerDashboard.tsx
- [x] Portal de acceso para clientes (login con código de acceso)
- [x] Gráficas de evolución en ClientDetail (Chart.js: peso, medidas, adherencia)
- [x] Exportar ficha completa del cliente a PDF (valoración, medidas, evolución, dieta)

## NutriFlow Branding + Nuevas funcionalidades

- [x] Cambiar título "Diet Generator" por logo NutriFlow (imagen)
- [x] Texto "Nueva Dieta" en mayúsculas: NUEVA DIETA
- [x] Subtítulo: "CONFIGURA LOS PARÁMETROS PARA CREAR EL PLAN NUTRICIONAL"
- [x] Ajuste automático de macros según tipo de dieta (Keto, Low Carb, Equilibrada, Alta proteína, Volumen, Déficit)
- [ ] Invitación por email al añadir un cliente (código único, caducidad 72h)
- [ ] Métricas de progreso y fotos en portal del cliente ("Mi Progreso")
- [ ] Apartado de control del sueño en portal del cliente (gráfica semanal/mensual)
- [x] Estética unificada NutriFlow: colores verde (#6BCB77) + oscuro, ambas apps coherentes
- [x] Diseño responsive móvil: barra inferior, touch targets 44px, desde 320px ancho
- [ ] Asignar dieta a cliente: crear nueva, asignar existente, asignar plantilla
- [ ] Vista plan activo en perfil del cliente (nombre, fecha inicio, días activo)
- [ ] Notificación al cliente cuando se le asigna un nuevo plan
- [ ] Historial de planes anteriores accesible para entrenador y cliente

## Mejoras solicitadas (sesión 3)

- [x] Logo NutriFlow más grande en sidebar entrenador y portal cliente (presencia visual clara)
- [x] Cambiar tipografía a Plus Jakarta Sans en toda la app (títulos 28-32px Bold, subtítulos 17-20px SemiBold, cuerpo 15-17px Regular, etiquetas 13px Regular gris)
- [x] Corregir asignación de dietas a clientes desde panel entrenador (crear nueva, asignar existente, asignar plantilla)
- [x] Apartado "Mi Progreso" en app del cliente: registro de métricas (peso, cintura, cadera, pecho, brazos) con gráficas de evolución
- [x] Apartado "Mi Progreso" en app del cliente: subida de fotos de seguimiento (frente, perfil, espalda) con galería cronológica
- [x] Entrenador puede ver métricas y fotos del cliente desde su panel (comparación lado a lado)
- [x] Notificación al entrenador cuando el cliente sube métricas o fotos

## Bugs reportados

- [x] Bug: La suma de calorías y macros por comida no se calcula correctamente

## Bloque C: Mejoras App Entrenador (sesión 4)

- [x] C1: Plantillas de dieta reutilizables (guardar dieta como plantilla con nombre y etiquetas)
- [x] C2: Calendario de planificación (vista calendario con revisiones, alertas de inactividad, cambios de plan)
- [x] C3: Comparativa antes/después por cliente (fotos lado a lado, gráfica peso superpuesta con cambios de dieta)
- [x] C4: Informes automáticos semanales/mensuales (PDF resumen: adherencia, peso, métricas, recomendación)
- [x] C5: Biblioteca de alimentos favoritos por cliente (marcar alimentos preferidos para priorizar en generación)
- [x] C6: Etiquetas y filtros en lista de clientes (objetivo, estado, grupo)
- [x] C7: Clonar plan de un cliente a otro (copiar dieta activa y ajustar calorías/macros)

## Bloque D: Mejoras App Cliente (sesión 4)

- [x] D1: Registro de hidratación (contador diario vasos/litros, objetivo personalizable)
- [x] D2: Control de sueño (horas dormidas, calidad 1-5, gráfica semanal)
- [x] D3: Diario de bienestar (energía, estado de ánimo, digestión, hinchazón)
- [x] D4: Temporizador de ayuno intermitente (ventana alimentación, cuenta atrás visual)
- [x] D5: Recetas paso a paso (instrucciones de preparación generadas por IA al tocar una comida)
- [x] D6: Lista de la compra interactiva (marcar comprados, organizar por secciones supermercado)
- [x] D7: Notificaciones/recordatorios de comida (horarios configurables por comida)
- [x] D8: Exportar dieta a PDF desde portal del cliente

## Otros (sesión 4)

- [x] Logo NutriFlow aún más grande en ambas apps (sidebar entrenador + portal cliente)

## Bloque E: Mejoras sesión 5

- [x] E1: Invitación por email al crear cliente (enlace único con código de un solo uso, caduca 72h, pantalla de registro con usuario/contraseña, estado visible: pendiente/aceptada/caducada, reenviar)
- [x] E2: Adherencia desde el primer día (mostrar historial desde el primer registro sin mínimo de días, crece en tiempo real)
- [x] E3: Mensajes motivación no automáticos (IA genera sugerencia, entrenador decide enviar/editar/descartar, mensajes variados sin repetir estructura en últimos 10, adaptados al momento del cliente)
- [x] E4: Dieta colapsada por defecto en app cliente (resumen visual, expandir al pulsar día/comida, mejor UX móvil)
- [x] E5: Sección "Fin de Semana" en app cliente (nueva sección en navegación principal)

## Bloque F: Mejoras sesión 6

- [x] F1: Valoración automática IA al registrar fin de semana (ajustes escritos sobre cómo abordar los siguientes días, sin tocar la dieta)
- [x] F2: Bug: La adherencia registrada por el cliente no aparece en el panel del entrenador
