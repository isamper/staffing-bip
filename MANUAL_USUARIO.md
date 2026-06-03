# Bench — Manual de Usuario
**Bip Consulting Colombia**
*Versión 1.0 · Junio 2026*

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Acceso a la aplicación](#2-acceso-a-la-aplicación)
3. [Roles y permisos](#3-roles-y-permisos)
4. [Importación de Kimble](#4-importación-de-kimble)
5. [Vista HR Admin](#5-vista-hr-admin)
   - 5a. [Tab People](#5a-tab-people)
   - 5b. [Tab Proyectos](#5b-tab-proyectos)
   - 5c. [Plan de Staffing Automático](#5c-plan-de-staffing-automático)
6. [Vista Consultor](#6-vista-consultor)
7. [Glosario de indicadores](#7-glosario-de-indicadores)

---

## 1. Introducción

**Bench** es la herramienta interna de Bip Colombia para gestionar el staffing de proyectos y el seguimiento de la disponibilidad del equipo. Su nombre hace referencia al concepto de "estar en la banca" — consultores que no están asignados a un proyecto activo.

### ¿Para qué sirve?

- Visualizar en tiempo real quién está disponible, en qué proyecto y con qué dedicación
- Gestionar asignaciones a proyectos de forma manual o automática
- Importar datos de Kimble para mantener la información actualizada
- Detectar riesgo de fatiga en el equipo
- Llevar la hoja de vida de cada consultor y exportarla en PDF o PowerPoint
- Facilitar el ejercicio de staffing para proyectos próximos a iniciar

### Conceptos clave

| Término | Definición |
|---------|-----------|
| **Playa** | Estado de un consultor que no tiene asignación activa en un proyecto cliente |
| **Tarea de playa** | Actividad interna asignada a un consultor disponible: propuesta, actividad interna, apoyo a proyecto u otro |
| **Staffing** | Proceso de asignar consultores a posiciones en proyectos |
| **Cargabilidad** | Porcentaje del tiempo que un consultor ha estado facturando a clientes |
| **Rolling off** | Consultor cuya asignación termina en los próximos 30 días |

---

## 2. Acceso a la aplicación

La aplicación está disponible en: **https://staffing-bip.vercel.app/**

### 2.1 Sign up — Registro de nuevo usuario

Los nuevos integrantes del equipo deben registrarse por primera vez en la pantalla de inicio. El proceso es el siguiente:

1. Hacer clic en **"Sign Up"**
2. Diligenciar los campos:
   - **Nombre completo**
   - **Correo electrónico** (debe ser @bip-group.com)
   - **Seniority** (nivel en el escalafón de Bip)
   - **Contraseña** (mínimo 6 caracteres)
   - **Confirmar contraseña**
3. Si el usuario es un perfil **solo administrativo** (como alguien de HR que no es consultor), debe marcar la casilla **"Solo tengo rol administrativo"**. Esto oculta el campo de seniority y crea un perfil de admin puro sin hoja de vida de consultor.
4. Hacer clic en **"Crear cuenta"**

> **Importante:** Después del registro, la cuenta queda en estado **pendiente de aprobación**. El usuario verá una pantalla con el mensaje *"Cuenta pendiente de aprobación"* hasta que un HR Admin la apruebe. Este proceso se describe en la sección [5a. Tab People — Aprobación de nuevos consultores](#aprobación-de-nuevos-consultores).

### 2.2 Sign in — Inicio de sesión

Los usuarios con cuenta activa ingresan con su correo @bip-group.com y contraseña en la pantalla principal.

- Si el correo o la contraseña son incorrectos, se muestra un mensaje de error
- Los consultores en estado pendiente de aprobación verán la pantalla de espera aunque las credenciales sean correctas

### 2.3 Primer acceso — Cambio obligatorio de contraseña

> **Nota:** Este flujo solo se presentó en el momento de lanzamiento de la herramienta, cuando se crearon cuentas de forma anticipada para los empleados de Bip que ya hacían parte del equipo. No es un proceso recurrente — los nuevos integrantes simplemente hacen Sign Up por su cuenta.

Cuando un HR Admin añadió a alguien manualmente al sistema a través de un proceso de invitación (como ocurrió en el lanzamiento), el usuario recibió un correo con un enlace de acceso. Al hacer clic en ese enlace y entrar a la aplicación, se mostró un modal obligatorio para establecer una nueva contraseña antes de poder acceder.

Este mismo flujo aplica si un usuario solicita recuperación de contraseña.

### 2.4 Recuperación de contraseña

En la pantalla de inicio de sesión, hacer clic en **"¿Olvidaste tu contraseña?"**, ingresar el correo registrado y seguir las instrucciones del correo de recuperación.

### 2.5 Cambio de contraseña (usuarios activos)

Los consultores con sesión activa pueden cambiar su contraseña desde su dashboard personal.

---

## 3. Roles y permisos

Bench tiene dos roles principales y una variante especial:

### 3.1 HR Admin (`hr_admin`)

Accede al **Vista Admin**, que incluye todas las funcionalidades de gestión:
- Ver y gestionar todos los consultores
- Asignar y desasignar personas a proyectos
- Gestionar tareas de playa y vacaciones del equipo
- Aprobar nuevos usuarios
- Importar datos de Kimble
- Ejecutar el plan de staffing automático
- Dar de baja a consultores
- Gestionar quién tiene rol de admin

Por defecto, tienen rol de HR Admin todos los consultores con seniority **Manager, Senior Manager, Director, Partner y Senior Partner**. Otros perfiles deben ser promovidos manualmente por un admin existente (ver sección [Gestión de Admins](#gestión-de-admins)). Igualmente, cuando un consultor sea promovido a Manager, se le debe otorgar acceso de admin manualmente desde ese mismo panel.

### 3.2 Consultor (`consultant`)

Accede al **Employee Dashboard**, que incluye:
- Ver y editar su propia hoja de vida
- Ver sus asignaciones actuales y disponibilidad
- Marcar proyectos como favoritos
- Ver el directorio de colegas y sus CVs
- Exportar su hoja de vida en PDF o PowerPoint

El consultor **no puede** ver información de otros consultores (salvo el directorio público de nombres y CVs), ni gestionar proyectos o asignaciones.

### 3.3 Usuario solo administrativo

Es un perfil que solo tiene acceso de HR Admin pero **no tiene hoja de vida de consultor** ni puede ser asignado a proyectos. Se crea marcando la casilla "Solo tengo rol administrativo" durante el sign up. Ejemplo: Martha Martínez.

### 3.4 Dar de baja — Consecuencias

Esta funcionalidad existe para retirar de la herramienta a las personas que ya no trabajan en Bip, de modo que no aparezcan como opciones de staffing ni en los listados activos. Cuando un HR Admin da de baja a un consultor:
- El consultor desaparece de todas las vistas de la herramienta
- Su cuenta de acceso a Bench es eliminada (no puede volver a iniciar sesión)
- Su hoja de vida y datos históricos se conservan en la base de datos pero dejan de ser visibles
- La baja es persistente: aunque se reimporte Kimble, el consultor no vuelve a aparecer

### 3.5 Gestión de Admins

Los HR Admins pueden promover o revocar el acceso de admin a otros consultores desde el **panel "Gestión de Admins"** en el Tab People (ver sección 5a). Esto permite, por ejemplo, que un consultor ascendido a Manager reciba acceso al Vista Admin sin necesidad de contactar a soporte técnico.

---

## 4. Importación de Kimble

> ⭐ **Esta es la funcionalidad más importante de Bench desde el punto de vista de datos.** La calidad y vigencia de la información en la herramienta depende directamente de que Kimble esté actualizado.

### 4.1 Por qué es crítico mantener Kimble actualizado

Kimble es la fuente de verdad para:
- Qué proyectos existen y en qué estado están
- Quién está asignado a cada proyecto y con qué dedicación
- La **Cargabilidad 2026** de cada consultor (pilar clave del Índice de Fatiga)
- La experiencia por industria y área de servicio de cada consultor

Si Kimble no se actualiza con frecuencia, Bench mostrará información desactualizada: asignaciones incorrectas, disponibilidad errónea y cargabilidad desactualizada.

**Recomendación:** Importar Kimble al menos **una vez por semana**, o inmediatamente después de cambios importantes en el staffing de proyectos.

### 4.2 Qué proyectos se importan

Kimble importa tres tipos de proyectos:

| Tipo | Descripción |
|------|-------------|
| **Proyectos activos** | Están en ejecución hoy (fecha actual entre inicio y fin) |
| **Proyectos terminados** | Ya finalizaron — se importan como registro histórico |
| **Proyectos próximos a cerrar** | Oportunidades cuyo deal está próximo a cerrarse — aún no han iniciado ni tienen equipo staffeado, pero ya es hora de planear quiénes los van a ejecutar |

> ⚠️ **Importante para proyectos próximos a cerrar:** Para poder usar Bench en el ejercicio de staffing de estos proyectos, deben venir en Kimble con **posiciones genéricas** (filas con nombre "Generic Manager", "Generic Consultant", etc.) que representen los roles que se necesitarán. Si vienen sin esas posiciones, Bench no podrá sugerir candidatos ni facilitar el ejercicio de planeación. Es responsabilidad del equipo verificar que Kimble incluya este staffing genérico antes de importar.

### 4.3 Cómo hacer la importación

1. Desde el Vista Admin, hacer clic en el botón **"Importar Kimble"** (esquina superior derecha)
2. Arrastrar el archivo Excel exportado de Kimble al área de carga, o hacer clic para buscarlo
3. Bench procesará el archivo y mostrará una vista previa con:
   - Número de proyectos, asignaciones y consultores detectados
   - Los 5 consultores con mayor cargabilidad (barra roja si supera 80%)
   - Nombres no reconocidos (nombres en Kimble que no coinciden con ningún consultor en Bench)
4. Revisar la vista previa y hacer clic en **"Aplicar importación"**

### 4.4 Qué datos trae la importación

- **Proyectos:** nombre, cliente, industria, código Kimble, área de servicio, fechas, estado
- **Asignaciones:** consultor asignado, dedicación %, fechas de inicio y fin
- **Posiciones genéricas:** roles abiertos pendientes de staffing (para ejercicio de planeación)
- **Cargabilidad 2026:** calculada como `días de uso en Kimble / 243 días hábiles colombianos × 100`
- **Experiencia por industria y área de servicio:** enriquece el perfil de cada consultor

### 4.5 Lógica de merge: asignaciones manuales vs. Kimble

Bench distingue entre asignaciones creadas manualmente en la herramienta y asignaciones provenientes de Kimble. La regla de merge es:

- Si Kimble trae información de un consultor en un proyecto → **sobreescribe la asignación** (manual o de Kimble anterior) para ese par (proyecto, consultor)
- Si un consultor fue asignado manualmente a un proyecto que **Kimble no menciona** → la asignación manual **se conserva** y solo termina en su fecha de fin configurada
- Las asignaciones de Kimble **no se pueden desasignar manualmente** desde la interfaz (solo se eliminan con una nueva importación)

Ejemplo práctico: si en Bench asignas manualmente a Felipe Estrada al proyecto "Bancolombia Q3" y luego importas Kimble con ese mismo proyecto pero sin Felipe, la asignación manual se conserva. Si Kimble sí incluye a Felipe en ese proyecto, la asignación de Kimble reemplaza la manual.

### 4.6 Nombres no reconocidos

Si el archivo de Kimble incluye nombres que Bench no puede asociar a ningún consultor registrado, la vista previa los mostrará con una advertencia en amarillo. Esto puede ocurrir cuando:
- El consultor no está registrado en Bench todavía
- Hay una diferencia de escritura entre el nombre en Kimble y el nombre en Bench (tilde, abreviación, etc.)

En ese caso, el proyecto se importa correctamente pero las asignaciones de esos consultores no quedará vinculada a ningún perfil.

---

## 5. Vista HR Admin

Al iniciar sesión como HR Admin, se accede al **Vista Admin**, que tiene tres tabs principales: **Proyectos**, **People** y **Plan de Staffing**.

---

### 5a. Tab People

Este tab muestra la lista completa de consultores activos del equipo con su estado actual, asignaciones, tareas y métricas.

#### Orden de la lista

Los consultores siempre aparecen ordenados por **cargo de mayor a menor seniority**, y dentro del mismo cargo, **en orden alfabético por nombre**:

> Senior Partner → Partner → Director → Senior Manager → Manager → Senior Associate → Associate → Senior Consultant → Consultant → Intern

#### Filtros y búsqueda

En la parte superior hay **5 chips de filtro** que permiten ver subconjuntos del equipo:

| Chip | Color | Descripción |
|------|-------|-------------|
| **All** | Gris | Todos los consultores activos |
| **Available Now** | Verde | Sin asignación activa y con fecha de disponibilidad ya pasada |
| **On Project** | Azul | Con al menos una asignación activa en proyecto cliente |
| **Rolling Off (30d)** | Ámbar | Su asignación termina en los próximos 30 días |
| **Riesgo de fatiga** | Rojo | Índice de Fatiga superior a 0.90 (ver Glosario) |

La barra de búsqueda filtra por nombre, seniority, habilidades y área de práctica.

#### Información de cada consultor

Cada fila del listado muestra:

- **Avatar e iniciales**, nombre, seniority y área de práctica
- **Asignaciones activas** (badge azul oscuro): nombre del proyecto + % de dedicación + fecha de fin
- **Asignaciones próximas** (badge ámbar): proyectos que inician en el futuro con su fecha de inicio
- **Asignaciones pasadas** (badge gris): proyectos recientes terminados con duración (ej. "3mo", "12mo+")
- **Primeras 4 habilidades** del consultor
- **Badge de estado** (esquina superior derecha de la fila):
  - 🔴 **Riesgo de fatiga** — Índice > 0.90
  - 🟡 **En vigilancia** — Índice entre 0.80 y 0.90
  - 🟡 **Rolling off** — Asignación termina en ≤30 días
  - 🟢 **Available now** — Sin asignación activa
  - ⬛ **On project** — Con asignación activa
- **Barra de dedicación** (si está en proyecto): muestra el % actual vs. el máximo permitido según seniority
- **Cargabilidad 2026** (si fue importada de Kimble): aparece en rojo si supera el 80%
- **Fecha de disponibilidad** o "Available now"
- **Enlace "Dar de baja"** (ver sección 3.4)
- **Flecha** para abrir la hoja de vida

#### Tareas de Playa

Debajo de cada fila del consultor aparecen sus **tareas de playa activas y pasadas**, seguidas del botón **"+ Agregar tarea de playa"**. Este botón está disponible para **todos los consultores**, independientemente de si están en un proyecto o disponibles.

Al hacer clic en el botón, se abre un modal con:

| Campo | Descripción |
|-------|-------------|
| **Tipo** | Propuesta / Actividad Interna / Apoyo a Proyecto / Otro |
| **Descripción** | Texto libre (requerido). Ej: "Propuesta Bancolombia — modelación financiera" |
| **Fecha fin** | Hasta cuándo dura la tarea (requerido) |
| **Dedicación** | Slider de 0% a 100% (por defecto 100%) |

Las tareas activas aparecen como **badges ámbar** con ícono de sombrilla, tipo, descripción, fecha y % de dedicación. Las tareas ya vencidas aparecen en **gris** con etiqueta "pasada". Ambas tienen un botón **X** para eliminarlas.

> **Nota:** La dedicación en tareas de playa **cuenta** para el cálculo del Índice de Fatiga (Pilar 1 — Carga actual), ya que una propuesta o actividad interna es trabajo real.

#### Vacaciones

Debajo de las tareas de playa, se registran las **vacaciones** de cada consultor. Los HR Admins pueden:

- Registrar un período de vacaciones con fecha inicio, fecha fin y nota opcional (botón **"+ Vacaciones"**)
- Eliminar vacaciones existentes con el botón **X**

Las vacaciones activas aparecen como **badges azules** con ícono de calendario. Las ya vencidas aparecen en **gris** con etiqueta "pasada".

> **Importante:** El registro de vacaciones es gestionado exclusivamente por el HR Admin — los consultores no solicitan vacaciones desde su propia vista. Cuando haya información de vacaciones completa, esta alimentará automáticamente el Pilar 2 (Tiempo sin descanso) del Índice de Fatiga.

#### Aprobación de nuevos consultores

Cuando un nuevo integrante se registra, aparece en la sección **"Nuevos Consultores"** del Vista Admin con un badge rojo indicando cuántos están pendientes. El HR Admin puede:

1. Ver el nombre, correo, seniority y fecha de registro
2. Hacer clic en **"Aprobar"** para activar la cuenta
3. Una vez aprobado, el consultor puede acceder al Employee Dashboard

Hasta que no se apruebe, el consultor verá únicamente la pantalla de espera.

#### Ver hoja de vida

Al hacer clic en el nombre o la flecha de cualquier consultor, se abre su hoja de vida completa en modo lectura. Desde ahí el admin puede revisar bio, experiencia, educación, habilidades y versiones del CV, pero **no puede editar** (solo el propio consultor puede editar su CV).

#### Gestión de Admins

En la parte superior del Tab People hay un **panel colapsable "Gestión de Admins"**. Al desplegarlo se muestra:

- **Lista de admins actuales** (scrollable): nombre + seniority + botón "Quitar" para revocar acceso
- **Dropdown para agregar nuevo admin**: busca entre consultores que aún no son admin y al seleccionar uno y hacer clic en "+ Agregar", se le otorga acceso al Vista Admin

> Cuando se revoca el acceso de admin a alguien, esa persona pasa a tener el rol de consultor y solo verá el Employee Dashboard.

---

### 5b. Tab Proyectos

Este tab muestra todos los proyectos organizados en tres grupos:

| Grupo | Color | Descripción |
|-------|-------|-------------|
| **Needs Staffing** | Rojo | Proyectos Open o Partially Staffed con fecha fin futura |
| **In Progress** | Gris | Proyectos Active en ejecución |
| **Ended** | Gris claro | Proyectos terminados (histórico) |

#### Vista de detalle de un proyecto

Al seleccionar un proyecto en el panel izquierdo, el panel derecho muestra:

- Nombre, cliente, industria, descripción, fechas y estado
- **Equipo asignado**: lista de consultores con su % de dedicación, fechas y badges de fatiga
  - Si algún consultor tiene riesgo de fatiga o está en vigilancia, aparece el badge correspondiente
  - Si hay solapamiento con vacaciones, se muestra una alerta con las fechas
- **Posiciones abiertas** (solo para proyectos Needs Staffing): roles pendientes de cubrir con sugerencias de match
- **Skills requeridas** del proyecto (editables)

#### Asignar una persona

Para agregar un consultor a un proyecto (en proyectos no terminados):

1. Hacer clic en **"Agregar persona"**
2. En el modal, buscar al consultor por nombre, cargo o habilidades
3. Ajustar la **dedicación %** (slider, por defecto 100%)
4. Definir opcionalmente **fecha de inicio** y **fecha de fin** (si no se especifican, se usan las fechas del proyecto)
5. Hacer clic para confirmar

#### Desasignar una persona

Solo se pueden desasignar las **asignaciones creadas manualmente** en Bench. Las asignaciones provenientes de Kimble no tienen botón de desasignar — se eliminan con la siguiente importación de Kimble.

#### Buscar reemplazos

Cuando un consultor en el equipo tiene badge **"Riesgo de fatiga"** o **"En vigilancia"**, aparece un botón para buscar reemplazos. Al hacer clic, Bench sugiere hasta 4 alternativas ordenadas por compatibilidad, indicando si han expresado interés en el proyecto (❤️) o si tienen tareas de playa activas.

#### Editar skills requeridas del proyecto

En proyectos no terminados, se pueden agregar o eliminar habilidades requeridas usando el editor de skills. Esto mejora la calidad de las sugerencias del algoritmo de matching.

---

### 5c. Plan de Staffing Automático

El **Plan de Staffing Automático** ayuda a cubrir las posiciones abiertas en múltiples proyectos de forma simultánea usando un algoritmo de matching.

#### Horizonte de tiempo

Antes de generar el plan, se selecciona el horizonte: **30, 60 o 90 días**. Solo se consideran proyectos que inician dentro de ese período y aún no están completamente staffeados.

#### Cómo genera sugerencias

Para cada posición abierta, el algoritmo evalúa a los consultores disponibles según:
- Coincidencia de habilidades con las requeridas por el proyecto
- Seniority apropiado para el rol
- Disponibilidad actual (sin asignación activa o rolling off)
- Interés expresado en el proyecto (❤️ favoritos)
- Ausencia de conflictos de vacaciones

El algoritmo asigna el mejor candidato a cada posición y lo "reserva" para que no aparezca como opción en otras posiciones del mismo plan.

#### Revisar y aplicar el plan

Después de generar, se muestra un panel con:
- Resumen: número de proyectos y posiciones cubiertos
- Por cada proyecto: posiciones con la sugerencia principal y alternativas
- Cada sugerencia indica nombre, score de match, razón, y si es un match "de estiramiento" (seniority no exacto)

Se puede **seleccionar o deseleccionar** candidatos por posición antes de aplicar. Al hacer clic en **"Aplicar plan"**, se crean las asignaciones correspondientes con dedicación del 100% y las fechas del proyecto.

---

## 6. Vista Consultor

Al iniciar sesión como consultor, se accede al **Employee Dashboard**, con tres tabs: **Overview**, **Mi CV** y **Equipo**.

### 6.1 Tab Overview

Muestra un resumen del estado actual del consultor:

- **Mi perfil**: avatar, nombre, cargo y habilidades principales
- **Mis asignaciones actuales**: proyectos activos con % de dedicación y fechas
- **Disponibilidad**: badge que indica si está disponible ahora o en proyecto, con fecha de liberación si aplica
- **Proyectos activos** (panel derecho): lista de todos los proyectos Open o Partially Staffed. El consultor puede marcar proyectos como favoritos con el botón ❤️ para expresar interés. Esta información es visible para los HR Admins al buscar reemplazos o al ejecutar el plan de staffing automático.

> **Banner de actualización de CV:** Si alguna asignación del consultor terminó en los últimos 90 días, aparece un banner recordándole que actualice su experiencia en el CV con ese proyecto.

### 6.2 Tab Mi CV

El consultor puede editar y exportar su hoja de vida desde este tab.

#### Campos editables

| Campo | Descripción |
|-------|-------------|
| **Foto** | Foto de perfil (con recorte) |
| **Cargo** | Título del rol en Bip |
| **Resumen profesional (bio)** | Texto libre que describe la trayectoria |
| **Educación** | Formación académica |
| **Idiomas** | Idiomas que maneja |
| **Años de experiencia** | Número |
| **Certificaciones** | Lista de certificaciones |
| **Habilidades** | Lista con autocompletado de habilidades conocidas |
| **Experiencia profesional** | Entradas con título del proyecto, cliente, período y descripción |

Los campos de **área de práctica**, **industrias** y **áreas de servicio** provienen de Kimble y son de solo lectura — se actualizan con cada importación.

#### Idiomas del CV (ES / EN)

El CV puede editarse en **español e inglés**. El español es el idioma base; el inglés se puede traducir automáticamente haciendo clic en la pestaña **EN** cuando el contenido esté marcado como desactualizado (punto ámbar). La traducción usa la API gratuita de MyMemory.

#### Versiones del CV

Se pueden crear **múltiples versiones** del CV para diferentes propósitos (ej. "General", "Experto SAP", "Cybersecurity"). Cada versión tiene su propio bio y experiencia, tanto en español como en inglés. Las habilidades, educación, idiomas y certificaciones son compartidas entre versiones.

- Hacer doble clic en el nombre de una pestaña para renombrarla
- Botón **"+ Nueva versión"** para agregar versiones
- Las versiones 2 en adelante pueden eliminarse; la versión "General" es permanente

#### Exportar el CV

- **PDF:** Usar el botón de impresión — el navegador genera el PDF con el formato del CV
- **PowerPoint:** Genera una diapositiva única (.pptx) con el CV estructurado, lista para incluir en propuestas. El archivo se llama `CV_NombreConsultor_Version.pptx`

#### Guardar cambios

Los cambios se guardan haciendo clic en **"Guardar CV"**. Aparece un mensaje de confirmación durante 2.5 segundos.

### 6.3 Tab Equipo

Directorio de todos los consultores activos de Bip. Permite buscar por nombre o habilidades y hacer clic en cualquier tarjeta para ver la hoja de vida completa del colega en modo lectura.

---

## 7. Glosario de indicadores

### Cargabilidad 2026

Representa el porcentaje del año 2026 que un consultor ha estado facturando a clientes, basado en los datos históricos de Kimble.

**Fórmula:**
```
Cargabilidad 2026 = (Días de uso en Kimble / 243 días hábiles colombianos) × 100
```

Los 243 días hábiles corresponden al calendario laboral colombiano del año 2026 (excluyendo fines de semana y festivos).

- Se muestra en la tarjeta de cada consultor en el Tab People
- Aparece en **rojo** si supera el 80%
- Es el componente principal (Pilar 3) del Índice de Fatiga
- Se actualiza con cada importación de Kimble

### Índice de Fatiga

Indicador compuesto que mide el riesgo de agotamiento de un consultor, combinando su carga de trabajo actual, el tiempo sin vacaciones y su tendencia anual de dedicación.

**Fórmula:**
```
Índice = (0.30 × Pilar 1) + (0.30 × Pilar 2) + (0.40 × Pilar 3)
```

| Pilar | Peso | Cálculo |
|-------|------|---------|
| **Pilar 1 — Carga actual** | 30% | (% dedicación en proyectos + % dedicación en tareas de playa) / 100 · Máximo 1.0 |
| **Pilar 2 — Tiempo sin descanso** | 30% | Meses desde las últimas vacaciones / 6 · Máximo 1.0 (6+ meses = máximo). Si no hay registro de vacaciones, se cuenta desde la fecha de ingreso del consultor |
| **Pilar 3 — Tendencia anual** | 40% | Cargabilidad 2026 / 100. Si no hay datos de Kimble, vale 0 |

**Niveles y umbrales:**

| Nivel | Umbral | Badge | Significado |
|-------|--------|-------|-------------|
| 🟢 **Normal** | ≤ 0.80 | Sin badge especial | Sin riesgo visible |
| 🟡 **En vigilancia** | 0.80 – 0.90 | Badge ámbar | Carga alta acumulada, monitorear |
| 🔴 **Riesgo de fatiga** | > 0.90 | Badge rojo | Riesgo real de agotamiento — considerar rotación o descanso |

**Notas importantes:**
- El Pilar 2 mejora automáticamente cuando se registren vacaciones reales: si alguien tomó vacaciones recientemente, su score baja
- El Pilar 3 solo tiene valor una vez que se haya importado Kimble al menos una vez
- La carga de tareas de playa (Pilar 1) **sí cuenta** — una propuesta al 50% + un proyecto al 50% = 100% de carga

### Rolling Off

Un consultor está en estado **Rolling Off** cuando su asignación activa más próxima a terminar vence dentro de los **próximos 30 días**. Aparece con badge ámbar y ícono de reloj. Es una señal para anticipar su reasignación.

### Disponible (Available Now)

Un consultor aparece como **Disponible** cuando:
1. No tiene ninguna asignación activa en proyecto cliente (dedicación total = 0%)
2. Su fecha de disponibilidad (`available_from`) ya llegó o es hoy

### Estados de proyectos

| Estado | Descripción |
|--------|-------------|
| **Open** | Sin ninguna asignación todavía |
| **Partially Staffed** | Tiene algunas asignaciones pero no cubre todas las posiciones |
| **Fully Staffed** | Todas las posiciones cubiertos |
| **Active** | Proyecto en ejecución (importado de Kimble como Firm) |
| **Ended** | Fecha de fin ya pasó |

### Tipos de tarea de playa

| Tipo | Uso típico |
|------|-----------|
| **Propuesta** | El consultor está apoyando la elaboración de una propuesta comercial |
| **Actividad Interna** | Formación, capacitación, actividades administrativas internas |
| **Apoyo a Proyecto** | Soporte puntual a un proyecto sin ser parte formal del equipo |
| **Otro** | Cualquier actividad que no encaja en las categorías anteriores |

### Cargabilidad máxima por seniority

Bench reconoce que los roles más senior deben dedicar tiempo a desarrollo de negocio, mentoring y actividades no facturables. Por eso aplica un techo de cargabilidad diferente según el nivel:

| Seniority | Cargabilidad máxima |
|-----------|-------------------|
| Intern | 100% |
| Consultant | 100% |
| Senior Consultant | 100% |
| Associate | 100% |
| Senior Associate | 100% |
| Manager | 100% |
| Senior Manager | 100% |
| Director | 60% |
| Partner | 50% |
| Senior Partner | 40% |

Estos valores se usan en la barra de dedicación de cada consultor (el denominador de la fracción mostrada).

---

*Bench · Bip Consulting Colombia · Versión 1.0 · Junio 2026*
*Para soporte técnico o dudas sobre la herramienta, contactar a Isabel Samper.*
