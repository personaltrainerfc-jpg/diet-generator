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

## Bloque G: Rediseño visual completo con mascotas NutriFlow

- [x] G1: Subir mascotas al CDN (Flora, Roca, Bruto, Ágil, grupo)
- [x] G2: Tema oscuro global: fondo #0D0F1A, tarjetas #1A1D2E, textos blancos
- [x] G3: Schema DB: campo arquetipo en tabla clients (agil/flora/bruto/roca)
- [x] G4: Onboarding cliente: selección de arquetipo con personajes y descripción
- [x] G5: Portal cliente: personaje en inicio con saludo dinámico, colores del arquetipo
- [x] G6: Estados vacíos con personaje y mensaje contextual
- [x] G7: Panel entrenador: mini avatar del personaje en lista de clientes
- [x] G8: Botones primarios con color del arquetipo (azul Ágil, rosa Flora, dorado Bruto, rojo Roca)
- [x] G9: Gráficas y barras de progreso con colores del personaje
- [x] G10: Navegación inferior móvil con acento de color del personaje
- [x] G11: Rediseñar sidebar entrenador con tema oscuro
- [ ] G12: Rediseñar Home (generador de dietas) con tema oscuro
- [ ] G13: Rediseñar todas las páginas secundarias (historial, recetas, plantillas, calendario)
- [ ] G14: Splash screen con imagen grupal + logo NutriFlow

## H: Diseño - Tarjetas claras sobre fondo oscuro
- [x] H1: Rediseñar sistema de tarjetas: fondo blanco/gris claro (#F5F5F7) sobre fondo oscuro general
- [x] H2: Aplicar tarjetas claras en panel entrenador (Home, Clients, ClientDetail, Dashboard)
- [x] H3: Aplicar tarjetas claras en portal del cliente (todas las secciones)
- [x] H4: Textos negros/gris oscuro dentro de tarjetas, títulos blancos fuera
- [x] H5: Border-radius 16px y sombra sutil en todas las tarjetas

## I: Diseño - Iconos cartoon personalizados
- [x] I1: Generar iconos cartoon (fuego, bíceps, balanza, aguacate, carne, ensalada)
- [x] I2: Subir iconos al CDN
- [x] I3: Sustituir todos los emojis estándar por iconos cartoon en ambas apps
- [x] I4: Asegurar consistencia visual con personajes NutriFlow

## J: Asistente IA Conversacional 24/7
- [x] J1: Schema DB: tabla ai_conversations (clientId, messages JSON, createdAt)
- [x] J2: Schema DB: tabla ai_assistant_config (trainerId, tono, nombre, reglas escalado)
- [x] J3: Backend: endpoint chat con contexto del cliente (dieta, macros, adherencia, peso)
- [x] J4: Backend: sistema de escalado al entrenador para preguntas sensibles
- [x] J5: Backend: guardar historial de conversaciones
- [x] J6: Frontend cliente: sección "Asistente" en navegación con chat UI
- [x] J7: Frontend entrenador: ver resumen conversaciones de cada cliente
- [x] J8: Frontend entrenador: configurar nombre, tono y reglas del asistente
- [x] J9: Seguridad: filtro para no dar consejos médicos ni recomendar suplementos

## K: Motor de Personalización Progresiva
- [x] K1: Backend: análisis de patrones de adherencia por alimento y día
- [x] K2: Backend: detectar alimentos con alta/baja aceptación
- [x] K3: Backend: detectar patrones de sueño vs adherencia
- [x] K4: Backend: analizar respuesta del peso a ajustes calóricos
- [x] K5: Backend: generar perfil aprendido del cliente
- [x] K6: Backend: incorporar perfil aprendido en prompt de generación de dietas
- [x] K7: Frontend entrenador: sección "Perfil aprendido" en detalle del cliente
- [x] K8: Frontend entrenador: indicador visual de nivel de personalización
- [x] K9: Frontend entrenador: editar/corregir datos aprendidos

## L: Integración con Wearables
- [x] L1: Schema DB: tabla wearable_connections (clientId, platform, tokens, lastSync)
- [x] L2: Schema DB: tabla activity_data (clientId, date, steps, calories, sleep, hrv)
- [x] L3: Backend: endpoints para conectar/desconectar plataformas
- [x] L4: Backend: sincronización de datos (simulada/manual por ahora)
- [x] L5: Backend: reglas de ajuste nutricional basadas en actividad
- [x] L6: Frontend cliente: sección "Mi actividad" con datos del día
- [x] L7: Frontend cliente: configuración de conexión de wearables
- [x] L8: Frontend entrenador: vista de actividad y sueño en perfil del cliente
- [x] L9: Alertas al entrenador por actividad baja o sueño insuficiente

## M: Notificaciones push al entrenador por escalado IA
- [x] M1: Backend: integrar notifyOwner cuando se crea una alerta de escalado
- [x] M2: Backend: incluir nombre del cliente, razón y fragmento del mensaje en la notificación
- [x] M3: Frontend: badge de notificación en sidebar del entrenador (Asistente IA)
- [x] M4: Frontend: toast en tiempo real cuando llega una alerta nueva

## N: Historial de conversaciones IA para el entrenador
- [x] N1: Backend: endpoint para obtener todas las conversaciones de un cliente
- [x] N2: Backend: generar resumen automático de cada conversación con LLM
- [x] N3: Frontend: pestaña "Conversaciones IA" en detalle del cliente
- [x] N4: Frontend: lista de conversaciones con resumen, fecha y estado
- [x] N5: Frontend: vista expandida de conversación completa

## O: Gamificación de actividad
- [x] O1: Schema DB: tabla activity_badges (definición de badges disponibles)
- [x] O2: Schema DB: tabla client_badges (badges desbloqueados por cliente)
- [x] O3: Backend: lógica de evaluación automática de badges tras logActivity
- [x] O4: Backend: badges de pasos (5K, 10K, 15K), minutos activos (30, 60, 90), rachas (3, 7, 14, 30 días)
- [x] O5: Frontend cliente: sección "Mis Logros de Actividad" con badges
- [x] O6: Frontend cliente: animación de desbloqueo de badge
- [x] O7: Frontend entrenador: vista de badges del cliente en detalle
