<div align="center">

# 🚀 Backend - APP ESCUELA - Microservicio de Auth_Service

Microservicio backend desarrollado en **Node.js + Express**, encargado de la gestión de usuarios, materias, tareas y entregas.  
Forma parte del ecosistema de microservicios del proyecto **APP ESCUELA**.

![Node.js](https://img.shields.io/badge/Node.js-v18.0+-green?style=flat-square)
![Express.js](https://img.shields.io/badge/Express.js-Framework-blue?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## 📚 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Arquitectura y Tecnologías](#-arquitectura-y-tecnologías)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Instalación y Ejecución](#️-instalación-y-ejecución)
5. [Configuración de Entorno](#-configuración-de-entorno)
6. [Endpoints Principales](#-endpoints-principales)
7. [Buenas Prácticas y Estilo](#-buenas-prácticas-y-estilo)
8. [Tests y Cobertura](#-tests-y-cobertura)
9. [Contribución](#-contribución)
10. [Licencia](#-licencia)
11. [Autor](#-autor)

---

## 🧠 Descripción General

Este backend provee servicios **RESTful** para la gestión académica:

- Registro de usuarios (alumnos, profesores, administradores)
- Administración de materias, tareas y entregas
- Comunicación entre servicios mediante **HTTP y JSON**

Diseñado bajo principios de **Clean Architecture** y separación por capas (**routes, controllers, services, models**).

---

## 🏗️ Arquitectura y Tecnologías

| Tecnología | Descripción |
|-------------|--------------|
| **Node.js** | Entorno de ejecución JavaScript |
| **Express.js** | Framework para la creación de APIs REST |
| **MongoDB / Mongoose** | Base de datos NoSQL y ODM |
| **Docker** | Contenerización del entorno |
| **Dotenv** | Gestión de variables de entorno |
| **Jest / Supertest** | Pruebas unitarias y de integración |

📐 **Patrón de diseño aplicado:** `MVC / Clean Architecture`

---

## 📁 Estructura del Proyecto

```bash
src/
 ├── config/          # Configuración general, variables de entorno y conexión DB
 ├── controllers/     # Controladores (lógica de manejo de peticiones)
 ├── routes/          # Definición de rutas de API (endpoints)
 ├── services/        # Lógica de negocio y comunicación con la DB (core)
 ├── models/          # Modelos y esquemas de Mongoose
 ├── middlewares/     # Middlewares personalizados (Autenticación, Autorización)
 ├── utils/           # Funciones auxiliares y manejo de errores
 ├── index.js         # Punto de entrada del servidor



⚙️ Instalación y Ejecución
1️⃣ Clonar el repositorio
git clone https://github.com/usuario/backend-app.git
cd backend-app

2️⃣ Instalar dependencias
npm install

3️⃣ Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto con el siguiente contenido:

PORT=4000
DB_URI=mongodb://localhost:27017/app_escuela
JWT_SECRET=supersecreto_y_largo_aqui

4️⃣ Ejecutar en desarrollo
npm run dev

5️⃣ Ejecutar en producción
npm start

🔒 Configuración de Entorno

El proyecto usa la librería dotenv para cargar variables de entorno y realiza una validación estricta al inicio de la aplicación para asegurar la disponibilidad y el formato correcto de las variables críticas (DB_URI, JWT_SECRET, etc.).

## 🌐 Endpoints Principales

| 🧩 Módulo | 🔧 Método | 🛣️ Ruta | 📝 Descripción | 👤 Rol Requerido | ⚙️ Estado |
|:-----------|:----------|:--------|:----------------|:----------------|:----------|
| **Auth** | POST | `/api/auth/register` | Registrar nuevo usuario | Público | ✅ |
| **Auth** | POST | `/api/auth/login` | Iniciar sesión y obtener JWT | Público | ✅ |
| **User** | GET | `/api/users/profile` | Obtener perfil del usuario autenticado | Usuario (Cualquier Rol) | ✅ |
| **User** | GET | `/api/users` | Listar todos los usuarios activos | Admin / Secretaria | ✅ |
| **User** | PUT | `/api/users/:id` | Actualizar datos de usuario | Admin / Self-Service | ✅ |
| **User** | DELETE | `/api/users/:id` | Borrado lógico de usuario | Admin / Self-Service | ✅ |


🧩 Buenas Prácticas y Estilo

✅ Código estructurado por capas y responsabilidades (Controller, Service, Model)
✅ Controladores livianos y servicios reutilizables
✅ Validaciones de entrada con Joi o Express-validator
✅ Logs centralizados para depuración
✅ Cumple principios SOLID y Clean Code
✅ Manejo de seguridad basado en JWT y middlewares por rol

🧪 Tests y Cobertura

Ejecutar los tests con:

npm test


Se incluyen pruebas unitarias y de integración utilizando Jest + Supertest.
La cobertura puede generarse con:

npm run test:coverage

🤝 Contribución

Crea una rama nueva desde develop

Realiza tus cambios y ejecuta los tests

Crea un Pull Request con descripción detallada

Respeta las convenciones de commits y nombres de ramas

Ejemplo:

git checkout -b feature/nueva-funcionalidad

📄 Licencia

Este proyecto está bajo la licencia MIT.
Consulta el archivo LICENSE
 para más información.

<div align="center">
👨‍💻 Autor

Ricardo Burdiles
Desarrollador Backend | Node.js + Express

📧 contacto: ricardo.burdiles@example.com

🌐 GitHub: @ricardoburdiles

⭐ Si este proyecto te fue útil, no olvides dejar una estrella en el repositorio.
¡Gracias por tu apoyo! 🙌

</div> ```





