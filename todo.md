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

## P: Tipografía Plus Jakarta Sans
- [x] P1: Añadir Google Font Plus Jakarta Sans en index.html
- [x] P2: Configurar font-family global en index.css
- [x] P3: Aplicar jerarquía: títulos 28-32px ExtraBold, subtítulos 17-20px SemiBold, cuerpo 15-17px Regular, etiquetas 13px Regular gris, botones 15px SemiBold mayúsculas
- [x] P4: Verificar que ningún elemento usa la tipografía anterior

## Q: Revisión de legibilidad WCAG AA
- [x] Q1: Contraste mínimo 4.5:1 en todos los textos
- [x] Q2: Interlineado mínimo 1.5 en textos de cuerpo
- [x] Q3: Tamaño mínimo 13px en cualquier texto visible
- [x] Q4: Textos en tarjetas claras: negro/gris oscuro (#1D1D1F)
- [x] Q5: Textos sobre fondo oscuro: blanco puro o gris claro (#F5F5F7)
- [x] Q6: Placeholders de inputs visibles y legibles
- [x] Q7: Verificar que ningún texto queda cortado o solapado en móvil

## R: Corrección ortográfica y redacción
- [x] R1: Corregir faltas de ortografía y tildes en todos los textos
- [x] R2: Eliminar textos en inglés sin traducir
- [x] R3: Unificar tono: directo, profesional, sin tecnicismos
- [x] R4: Botones con verbos en infinitivo/imperativo claro
- [x] R5: Descripciones de sección concisas (máx 2 líneas)

## S: Prompt de generación de dietas mejorado
- [x] S1: Cantidades realistas (proteínas 100-200g, verduras 150-250g, carbohidratos 50-150g)
- [x] S2: Combinaciones culinarias coherentes (platos reconocibles)
- [x] S3: Distribución de macros precisa (margen 5%)
- [x] S4: Variedad real entre días (no repetir proteína consecutiva)
- [x] S5: Métodos de cocción variados y explícitos
- [x] S6: Gastronomía española y mediterránea como base

## T: Nuevas recetas en la base de datos
- [x] T1: 10 recetas de desayunos
- [x] T2: 12 recetas de comidas principales
- [x] T3: 10 recetas de cenas
- [x] T4: 10 recetas de snacks y tentempiés

## U: Tipografía Glacial Indifference
- [x] U1: Sustituir Plus Jakarta Sans por Glacial Indifference en index.html (Google Fonts o fontsquirrel)
- [x] U2: Actualizar font-family global en index.css
- [x] U3: Jerarquía: títulos Bold 28-32px, subtítulos Bold 17-20px, cuerpo Regular 15-17px, etiquetas Regular 13px gris, botones Bold 15px mayúsculas
- [x] U4: Verificar que absolutamente todos los textos usan Glacial Indifference

## V: Revisión completa de legibilidad
- [x] V1: Sobre fondos claros (#F5F5F7, blanco): textos en negro/gris oscuro (#1D1D1F o #3A3A3A)
- [x] V2: Sobre fondos oscuros (azul-negro): textos en blanco puro o gris claro (#FFFFFF o #F5F5F7)
- [x] V3: Contraste mínimo WCAG AA (4.5:1) en todas las combinaciones
- [x] V4: Revisar tarjetas blancas, métricas, barras de progreso, modales, desplegables
- [x] V5: Revisar portal cliente: inicio, adherencia, sueño, mi dieta
- [x] V6: Revisar app entrenador: todas las pantallas

## W: Corrección cabecera app del cliente
- [x] W1: Limpiar zona debajo de cabecera: resumen diario limpio y claro
- [x] W2: Calorías del día y macros en barras de progreso con valores visibles
- [x] W3: Saludo personalizado con nombre del cliente bien alineado
- [x] W4: Tipografía Glacial Indifference en toda la cabecera
- [x] W5: Corregir carga de datos si hay problemas

## X: Textos escapados y cerrar sesión
- [x] X1: Corregir caracteres Unicode escapados en textos visibles
- [x] X2: Corregir botón "Cerrar sesión" con formato legible
- [x] X3: Revisar todos los textos con caracteres Unicode escapados en todas las páginas

## Y: Cambiar toda la app a fondos blancos y letras negras
- [x] Y1: Modificar variables CSS del tema dark a fondo blanco y texto negro
- [x] Y2: Cambiar sidebar del entrenador a fondo blanco con texto negro
- [x] Y3: Cambiar header móvil a fondo blanco
- [x] Y4: Cambiar portal del cliente a fondo blanco con texto negro
- [x] Y5: Corregir todos los colores hardcodeados en componentes
- [x] Y6: Verificar legibilidad en todas las pantallas
- [x] Y7: Asegurar que tarjetas, modales y dropdowns mantienen coherencia

## Z: Correcciones técnicas rápidas
- [x] Z1: Cambiar título del navegador a "NutriFlow - Nutrición Inteligente Para Profesionales"
- [x] Z2: Eliminar thinking budget y reducir max_tokens a 8192 en llm.ts
- [x] Z3: Mover imports dinámicos a imports estáticos en routers.ts
- [x] Z4: Definir relaciones en drizzle/relations.ts
- [x] Z5: Añadir índices a tablas principales (diets, menus, meals, foods, recipes, supplements, folders, customFoods, clients)

## V: Mejoras de percepción de velocidad
- [x] V1: Skeleton screens durante generación de dietas (estructura de días y comidas con bloques grises animados)
- [x] V2: Indicador de progreso textual con 8 mensajes rotativos cada 3s con transición fade in/out
- [x] V3: Optimizar caché React Query (staleTime 5min listados, 10min detalle dieta)

## BUG: Error al generar dieta con recetas seleccionadas
- [x] BUG1: Corregido - max_tokens aumentado a 16384, añadida función repairTruncatedDietJson con pila LIFO, logging de finish_reason y content_length, mensajes de error descriptivos

## P: Problemas críticos en generación de dietas
- [x] P1: Garantizar número exacto de menús (parámetro maxTokens en invokeLLM, validación post-generación, instrucción reforzada en prompt)
- [x] P2: Control estricto de calorías (instrucciones en prompt, validación post-guardado con tolerancia 15%, regla de verificación calórica)
- [x] P3: Reintentos automáticos (hasta 3 intentos con feedback del error anterior en el prompt)

## BUG: Validación calórica demasiado estricta con 7 menús
- [x] BUG2: Relajar validación calórica - con 7 menús la IA pierde precisión en los últimos menús (1098kcal vs 1650kcal objetivo). Cambiar estrategia: eliminar validación calórica como bloqueante, solo validar número de menús, y aceptar la mejor respuesta disponible.

## BUG: Unexpected token '<' is not valid JSON
- [x] BUG3: Error 'Unexpected token <' al regenerar comida - prompt compactado, maxTokens=4096, reintentos, logging, detección HTML en frontend
- [x] BUG3b: Revisadas todas las llamadas LLM: añadido maxTokens a addMeal(4096), updateFood(1024), addFood(1024), generateGuide(4096), regenerateMeal(4096). Frontend con resilientFetch que detecta HTML y reintenta.

## SR: Biblioteca de recetas del sistema (150 recetas)
- [x] SR1: Migración DB - userId nullable para recetas del sistema (isSystem y category ya existían)
- [x] SR2: Modificar recipe.list para devolver recetas del sistema + recetas del usuario (ordenadas sistema primero por categoría)
- [x] SR3: Crear seed script con 150 recetas (30 desayunos, 30 snack_manana, 30 comidas, 30 snack_tarde, 30 cenas)
- [x] SR4: Ejecutar seed script - 150 recetas insertadas correctamente
- [x] SR5: Actualizar UI de Mis Recetas con badge "NutriFlow", filtros por categoría, buscador, y diferenciación visual

## T: 12 Tareas de mejora de la app
- [x] T1: Añadir 9 variantes de café a foodDb.ts + referencia en buildDietPrompt
- [x] T2: Recetas colapsadas por defecto en Recipes.tsx con Collapsible + botón expandir/colapsar todas
- [x] T3: Sustitutos coherentes - aceites/condimentos sin alternativa + instrucción grupo alimentario en prompts
- [x] T4: Redondeo inteligente de gramos en dietAdjust.adjustMacros (roundToNearestPractical) + instrucción en prompt
- [x] T5: Coherencia y variedad en menús - rotación de proteínas/carbohidratos/verduras/desayunos/snacks + coherencia culinaria
- [x] T6: Mejorar prompt de regenerateMeal con contexto de momento del día, tipo de dieta, alergias y preferencias
- [x] T7: Skeleton screens y mensajes rotativos (YA IMPLEMENTADO - verificado)
- [x] T8: Botón añadir receta a comida (frontend modal + backend addRecipeToMeal)
- [x] T9: Mostrar/ocultar menús en cuadro resumen (botón ojo + oculta tabs + indicador de ocultos)
- [x] T10: Copiar comida a varios días (frontend checkboxes multi-select + backend copyMealToMultiple)
- [x] T11: Drag and drop para reordenar comidas (@dnd-kit + backend reorderMeals + GripVertical handle)
- [x] T12: Crear dieta manualmente sin IA (backend createManual + frontend formulario simplificado)

## U2: Mejoras post-T12
- [x] U2-1: Selector de cliente en diálogo de dieta manual (vincular dieta directamente a un cliente)
- [x] U2-2: Guardar dieta como plantilla reutilizable desde DietDetail (botón FileStack)
- [x] U2-3: Badge visual "Manual vs IA vs Copia" en historial de dietas (creationMethod field)

## U3: Sistema de recetas del sistema (150 recetas)
- [x] U3-1: Campos isSystemRecipe y category ya existían en tabla recipes (verificado)
- [x] U3-2: recipe.list ya devuelve recetas del sistema + usuario (verificado)
- [x] U3-3: Caché en memoria getSystemRecipeNames() con invalidateSystemRecipeCache()
- [x] U3-4: buildSystemRecipesSection() inyecta recetas agrupadas por categoría en el prompt
- [x] U3-5: seed-system-recipes.mjs ejecutado: 150 recetas insertadas (30 desayunos, 30 snacks mañana, 30 comidas, 30 snacks tarde, 30 cenas)
- [x] U3-6: Tests vitest añadidos (190 tests pasan)

## U4: Filtro por categoría y favoritos en Mis Recetas
- [x] U4-1: Filtro de recetas por categoría ya existía (verificado + añadido tab Favoritos)
- [x] U4-2: Tabla recipe_favorites creada (userId + recipeId, unique constraint)
- [x] U4-3: Procedimiento recipe.toggleFavorite + toggleRecipeFavorite en db.ts
- [x] U4-4: Botón corazón con optimistic update + tab Favoritos con contador + empty state
- [x] U4-5: 3 tests añadidos para toggleFavorite (193 tests pasan)

## TAREA-A: Generar dieta con una sola frase en lenguaje natural
- [x] TA-1: Backend diet.interpretDescription endpoint con LLM (prompt exacto del usuario)
- [x] TA-2: Validación automática de suma de macros = 100 (ajustar carbsPercent)
- [x] TA-3: Frontend "Describir cliente" opción junto a IA y Manual
- [x] TA-4: Campo de texto grande con placeholder + 3 ejemplos clicables
- [x] TA-5: Pantalla de revisión con campos editables + reasoning de la IA
- [x] TA-6: Botones "Ajustar parámetros" y "Confirmar y generar dieta" (usa diet.generate existente)
- [x] TA-7: Tests vitest para interpretDescription (198→203 tests)

## TAREA-B: Portal de resultados compartible con imagen descargable
- [x] TB-1: Tabla progressReports + adherenceAlerts en schema + migración 0011 aplicada
- [x] TB-2: Endpoint clientMgmt.generateProgressReport + clientPortal.generateReport
- [x] TB-3: Endpoint clientPortal.getReports + clientMgmt.getClientReports
- [x] TB-4: Endpoint trainer getClientReports integrado en clientMgmt
- [x] TB-5: Frontend cliente: tab "Resultados" en ClientPortal con generación + historial
- [x] TB-6: Tarjeta Instagram con métricas, arco SVG, mensaje motivacional + gradiente
- [x] TB-7: Botón "Descargar" con html-to-image + "Compartir" con Web Share API
- [x] TB-8: Tab "Informes" en ClientDetail con generación + historial + patrón adherencia
- [x] TB-9: Tests vitest para progressReports (203→205 tests)

## TAREA-C: Score de adherencia predictivo con alertas automáticas
- [x] TC-1: Tabla adherenceAlerts en schema (incluida en migración 0011)
- [x] TC-2: server/adherenceEngine.ts con 4 reglas: overall_low, drop_3days, weekend_drop, skip_meal_pattern
- [x] TC-3: runAdherenceAnalysis() para todos los clientes activos (evita duplicados)
- [x] TC-4: Botón manual "Analizar" en dashboard (scheduler pendiente para producción)
- [x] TC-5: Endpoint clientMgmt.getAlerts
- [x] TC-6: Endpoint clientMgmt.resolveAdherenceAlert
- [x] TC-7: Endpoint clientMgmt.getClientAdherencePattern (7 barras lun-dom)
- [x] TC-8: Panel completo en TrainerDashboard con alertas, severidad, sugerencias, resolver
- [x] TC-9: Gráfica de barras adherencia semanal en tab Informes de ClientDetail
- [x] TC-10: Tests vitest para adherenceEngine y alertas (205 tests pasan)

## U5: Insertar 300 recetas del usuario como recetas del sistema
- [x] U5-1: Parseadas 300 recetas (60 por categoría: desayuno, snack AM, comida, snack PM, cena)
- [x] U5-2: Script parse_recipes.py creado con detección de categorías y conversión de ingredientes
- [x] U5-3: seed-system-recipes.mjs actualizado con 300 recetas + 7 nuevos fallback nutricionales + ejecutado
- [x] U5-4: 300 recetas verificadas en BD (60 por categoría) + servidor reiniciado
- [x] U5-5: 205 tests pasan + checkpoint guardado

## U6: Añadir 150 recetas adicionales (total 450)
- [x] U6-1: Parseadas 150 recetas nuevas (30 por categoría)
- [x] U6-2: seed-system-recipes.mjs actualizado con 450 recetas + 5 nuevos fallback + ejecutado
- [x] U6-3: 450 recetas verificadas (90 por categoría) + servidor reiniciado + 205 tests pasan

## AUTH: Sistema completo de registro y autenticación multi-entrenador
- [x] AUTH-1: Modificar tabla users: añadir passwordHash, plan, trainerName, logoUrl, primaryColor, isActive, emailVerified, emailVerificationToken, passwordResetToken, passwordResetExpiresAt, trainerId, invitationToken, invitationExpiresAt. Eliminar openId y loginMethod.
- [x] AUTH-2: Generar migración drizzle y aplicar SQL (migrar datos existentes)
- [x] AUTH-3: Crear server/auth.ts con hashPassword, verifyPassword, generateSecureToken, sendVerificationEmail, sendPasswordResetEmail
- [x] AUTH-4: Endpoint auth.register (público): validaciones, bcrypt hash, token verificación, envío email
- [x] AUTH-5: Endpoint auth.verifyEmail (público): validar token, marcar emailVerified, iniciar sesión auto
- [x] AUTH-6: Endpoint auth.login (público): verificar email+password, comprobar emailVerified e isActive, cookie JWT
- [x] AUTH-7: Endpoint auth.forgotPassword (público): generar token reset, enviar email (mismo mensaje si existe o no)
- [x] AUTH-8: Endpoint auth.resetPassword (público): validar token, hashear nueva password, iniciar sesión auto
- [x] AUTH-9: Endpoint auth.updateProfile (protegido): actualizar name, trainerName, primaryColor
- [x] AUTH-10: Auditar TODOS los endpoints existentes para aislamiento de datos (userId check)
- [x] AUTH-11: Frontend Register.tsx con indicador seguridad contraseña, confirmación email
- [x] AUTH-12: Frontend Login.tsx con mostrar/ocultar contraseña, recordarme, errores inline
- [x] AUTH-13: Frontend ForgotPassword.tsx
- [x] AUTH-14: Frontend ResetPassword.tsx con token en URL, inicio sesión auto
- [x] AUTH-15: Frontend VerifyEmail.tsx con estado carga, reenviar verificación
- [x] AUTH-16: Rutas públicas/protegidas en App.tsx con redirecciones
- [x] AUTH-17: Diseño centrado en auth pages con logo NutriFlow + formulario limpio
- [x] AUTH-18: Tests vitest para auth endpoints (13 tests: password hashing, register, login, verify email, forgot password, reset password, profile update, validation)

## AUTH-FIX: Corregir acceso para usuarios OAuth existentes
- [x] AUTHFIX-1: Añadir botón "Iniciar sesión con Manus" en Login.tsx para usuarios OAuth
- [x] AUTHFIX-2: Corregir bug upsertUser que falla con "Field 'email' doesn't have a default value"
- [x] AUTHFIX-3: Verificar que usuarios OAuth pueden acceder sin quedar bloqueados en /login

## CORR-1: Sustitutos incorrectos en recetas manuales
- [x] CORR1-1: Modificar endpoint diet.addRecipeToMeal para generar alternativas automáticas para cada ingrediente
- [x] CORR1-2: Reutilizar lógica de alternativas de diet.addFood (aceites/condimentos sin alternativa)

## CORR-2: Email de verificación no llega al registrarse
- [x] CORR2-1: Instalar nodemailer y configurar SMTP con variables de entorno
- [x] CORR2-2: Reescribir sendVerificationEmail y sendPasswordResetEmail con nodemailer
- [x] CORR2-3: Manejar error de envío en auth.register sin fallar el registro
- [x] CORR2-4: Crear endpoint auth.resendVerification
- [x] CORR2-5: Añadir botón reenviar verificación en Register.tsx tras registro exitoso

## CORR-3: App del cliente con fondo blanco y letras negras
- [x] CORR3-1: Corregir contraste en todas las secciones del portal cliente (Mi Dieta, Seguimiento, Bienestar, Fin de Semana, Compra, Chat, Asistente, Actividad, Resultados)

## CORR-4: Cambiar texto botón valoración fin de semana
- [x] CORR4-1: Cambiar "OBTENER VALORACIÓN IA" por "OBTENER INSTRUCCIONES"

## CORR-5: Check-in bienestar visible en panel entrenador
- [x] CORR5-1: Verificar/crear endpoint clientMgmt.getClientWellnessData (hidratación, sueño, bienestar)
- [x] CORR5-2: Añadir pestaña Bienestar en ClientDetail.tsx con WellnessPanel (hidratación, sueño, bienestar general + resumen)
- [ ] CORR5-3: Notificación al entrenador cuando cliente hace check-in

## CORR-6: Informe del cliente editable antes de enviarlo
- [x] CORR6-1: Backend: generar informe como borrador (status draft/sent), endpoints updateReport y sendReport
- [x] CORR6-2: Frontend: previsualización editable con campos inline editables (mensaje, notas, destacados)
- [x] CORR6-3: Botones "Guardar cambios" y "Enviar al cliente" en informes borrador
- [x] CORR6-4: Cliente solo ve informes con status "sent" (filtrado en getMyReports)

## ADMIN: Panel de administración para el owner

- [x] ADMIN-1: Backend: adminProcedure ya existe en _core/trpc.ts (role=admin check)
- [x] ADMIN-2: Backend: endpoint admin.getStats con métricas completas
- [x] ADMIN-3: Backend: endpoint admin.listTrainers con búsqueda, filtros, paginación y métricas
- [x] ADMIN-4: Backend: endpoint admin.toggleTrainerActive
- [x] ADMIN-5: Backend: endpoint admin.getTrainerDetail con clientes, dietas recientes, conteos
- [x] ADMIN-6: Backend: endpoint admin.changePlan
- [x] ADMIN-7: Frontend: AdminPanel.tsx con 8 stat cards + distribución por plan
- [x] ADMIN-8: Frontend: tabla de entrenadores con búsqueda, filtros plan/estado, paginación, cambio plan inline
- [x] ADMIN-9: Frontend: dialog detalle entrenador con clientes, dietas recientes, conteos
- [x] ADMIN-10: Frontend: ruta /admin en App.tsx + check role=admin en AdminPanel
- [x] ADMIN-11: Frontend: botón Admin con corona dorada en sidebar footer (solo role=admin)
- [x] ADMIN-BUG: Corregir nombres de columnas SQL en subqueries de listTrainers (trainer_id→trainerId, user_id→userId, is_system→isSystem)

## CORR-7: Exportar dieta en PDF en lugar de HTML

- [x] CORR7-1: Instalar html2pdf.js
- [x] CORR7-2: Reemplazar exportación HTML por generación PDF (A4, márgenes 10mm, logo, cabecera, pie de página)
- [x] CORR7-3: Nombre archivo: dieta-[nombre-plan]-[fecha].pdf
- [x] CORR7-4: Paginación automática sin cortar comidas (page-break-inside:avoid)

## CORR-8: Navegación app cliente en negrita y línea indicadora centrada

- [x] CORR8-1: Texto de todos los tabs en font-bold (font-weight: 700)
- [x] CORR8-2: Línea indicadora centrada bajo el texto con left-1/2 -translate-x-1/2

## CORR-9: Navegación tabs completamente rota - reconstruir

- [x] CORR9-1: Reconstruir tabs desktop: flex-col, icono arriba (20x20 fijo), texto abajo (11px bold), flex-shrink-0
- [x] CORR9-2: Línea indicadora centrada con absolute bottom-0 left-1/2 -translate-x-1/2 (24px ancho)
- [x] CORR9-3: Reconstruir tabs mobile bottom nav con misma estructura (20x20 iconos, 9px bold texto)

## CORR-10: Control visibilidad calorías/macros en app cliente

- [x] CORR10-1: Añadir campo showMacrosToClient (boolean, default false) a tabla clients
- [x] CORR10-2: Endpoint clientMgmt.updateClientSettings para toggle showMacrosToClient
- [x] CORR10-3: Incluir showMacrosToClient en respuesta de clientPortal.getActiveDiet
- [x] CORR10-4: Toggle en perfil cliente del panel entrenador (Configuración del cliente)
- [x] CORR10-5: Ocultar calorías/macros en DietTab y PDF export cuando showMacrosToClient=false

## CORR-11: Exportar dieta en PDF desde servidor

- [x] CORR11-1: Crear server/pdfTemplates.ts con generateDietPDF usando PDFKit
- [x] CORR11-2: Endpoint clientPortal.exportDietPDF que genera PDF y sube a S3
- [x] CORR11-3: Frontend: botón exportar llama al endpoint servidor con estado de carga

## BUG: App se queda en skeleton de carga
- [x] BUG-1: Diagnosticar: sesión expirada + query auth.me no resolvía → skeleton infinito
- [x] BUG-2: Añadido timeout 5s en DashboardLayout → redirige a /login si carga no completa

## EXPORT-WORD: Exportar dieta en formato Word (DOCX)
- [x] WORD-1: Instalar dependencia docx para generación de documentos Word en servidor
- [x] WORD-2: Crear función generateDietDOCX en server/docxTemplates.ts
- [x] WORD-3: Endpoint exportDietDOCX que genera DOCX y sube a S3
- [x] WORD-4: Frontend: botón exportar Word junto al de PDF (entrenador + cliente)
- [x] WORD-2b: Reescribir DOCX con formato grid visual (columnas=días, filas=comidas) como el PDF
- [x] WORD-2c: Exportar Word siempre sin calorías ni macros
- [x] WORD-5: Tests para la exportación Word (10 tests pasan)
