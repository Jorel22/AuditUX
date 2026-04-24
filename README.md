
![logo auditux](/logo-auditux.svg)

AuditUX es una herramienta avanzada de auditoría de experiencia de usuario que automatiza el análisis usabilidad de interfaces web utilizando Inteligencia Artificial. A través de la [Teoria de Carga Cognitiva](https://www.sciencedirect.com/science/article/abs/pii/0364021388900237) y de 5 [Heurísticas de Usabilidad de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/), la aplicación evalúa URLs y proporciona un diagnóstico detallado con puntuaciones y recomendaciones de mejora.

## ✨ Características Principales

- **Análisis Automatizado:** Evaluación basada en principios de Sweller y Nielsen.
- **Interfaz de Semáforo:** Visualización intuitiva de resultados:
    * 🔴 **Crítico:** Fallos graves que impiden la usabilidad.
    * 🟡 **Advertencia:** Elementos que requieren optimización.
    * 🟢 **Óptimo:** Cumplimiento exitoso de la métrica.
- **Persistencia de Datos:** Historial de auditorías almacenado en MongoDB.
- **Informes Exportables:** Generación de reportes detallados en PDF para entrega a clientes o stakeholders.
- **Seguridad:** Acceso protegido mediante `APP_PASSCODE`.

## 🛠️ Stack Tecnológico
Frontend & Backend: Next.js (App Router) desplegado en Vercel.
IA: Google Gemini API para el análisis de contenido y lógica de UX.
Base de Datos: MongoDB para el almacenamiento del historial de evaluaciones.
Gestor de Paquetes: pnpm.

## ⚙️ Configuración del Entorno
Para ejecutar este proyecto localmente, debes configurar las siguientes variables de entorno en un archivo .env.local en la raíz del proyecto:
| Variable | Descripción |
| :--- | :--- |
| `GEMINI_API_KEY` | API Key para acceder a los modelos de Google Gemini. |
| `APP_PASSCODE` | Código de seguridad para el acceso a la aplicación. |
| `DB_URI` | Cadena de conexión de MongoDB (Connection String). |

## 🚀 Instalación y Desarrollo Local
1. **Clonar el repositorio:**
```Bash
git clone https://github.com/tu-usuario/auditux.git
cd auditux
```

2. **Instalar dependencias:**
```Bash
pnpm install
```

3. **Iniciar el servidor de desarrollo:**
```Bash
pnpm dev
```
3. **Acceso:**
Abre http://localhost:3000 (o el puerto configurado) en tu navegador.

## 🏗️ Arquitectura del Sistema
El flujo de la aplicación se describe en el siguiente diagrama:

![Diagrama de Arquitectura de AuditUX](arquitectura.jpg)

1. El usuario envía una URL vía POST.
2. El Manejador de API procesa el Prompt Engineering especializado.
3. Gemini API retorna un análisis estructurado basado en heurísticas.
4. Los resultados se indexan en MongoDB y se visualizan en la UI de resultados.

## 🌐 Despliegue
El proyecto está configurado para Continuous Deployment (CD) en Vercel. Cada push a la rama main dispara un nuevo despliegue automáticamente.