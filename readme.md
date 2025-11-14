
<div align="center">

# 🤓 APP ITS Cipolletti - Microservicio: Authentication Service - Backend  

Microservicio de autenticación backend desarrollado en **Node.js + Express**, encargado de verificar la identidad de un usuario para otorgarle acceso a un sistema, validando credenciales que el usuario proporciona. 
Forma parte del ecosistema de microservicios del proyecto **APP ITS Cipolletti**, desarrollado con el grupo DIV < H1>. En este contexto presentado en un contenedor Docker para la materia LaboratorioII FSD.

![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=flat-square)
![Express.js](https://img.shields.io/badge/Express.js-Framework-blue?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## 📚 Tabla de Contenidos
1. [Contexto Académico](#🎓-contexto-académico)
2. [Descripción General](#📋-descripción-general)
3. [Arquitectura y Tecnologías](#🏗️-arquitectura-y-tecnologías)
4. [Estructura del Proyecto](#📁-estructura-del-proyecto)
5. [Instalación y Ejecución con Docker](#🐋-instalación-y-ejecución-con-docker)

---

## 🎓 Contexto Académico

Este módulo fue desarrollado y contenerizado en Docker como parte de la evaluación práctica de la asignatura.

| Rol | Información |
|:---|:---|
| **Asignatura:** | **Laboratorio II FS** |
| **Profesor:** | **Javier Parra** |
| **Alumno:** | **Emiliano Spagnolo** |
| **Módulo Principal:** | **Auth-Service** |

---

## 📋 Descripción General

Este backend provee servicios **RESTful** centrados en la **identidad y el acceso**:

* **Registro y Login:** Permite a los usuarios registrarse e iniciar sesión. **Este módulo sirve para registrarse y permite login.**
* Verifica la identidad de un usuario para otorgarle acceso a un sistema.
* Validación de credenciales que el usuario proporciona.
* El servicio emite **tokens de acceso (JWT)** y gestiona sesiones de usuario.
* Permite que el usuario acceda a recursos y aplicaciones. 
* Comunicación entre servicios mediante **HTTP y JSON**.

Diseñado bajo principios de **Clean Architecture** y separación por capas (**routes, controllers, services, models**).

---

## 🏗️ Arquitectura y Tecnologías

| Tecnología | Descripción |
|-------------|--------------|
| **Node.js** | Entorno de ejecución JavaScript |
| **Express.js** | Framework para la creación de APIs REST |
| **MongoDB / Mongoose** | Base de datos NoSQL y ODM |
| **Docker** | Contenerización del entorno (Uso de **`docker-compose`**) |
| **Dotenv** | Gestión de variables de entorno |
| **Jest / Supertest** | Pruebas unitarias y de integración |

📐 **Patrón de diseño aplicado:** `MVC / Clean Architecture`

---

## 📁 Estructura del Proyecto

```bash
src/
 ├── config/          # Configuración general, variables de entorno y conexión DB
 ├── controllers/     # Controladores (lógica de manejo de peticiones)
 ├── middleware/      # Middlewares personalizados (Autenticación, Autorización)     
 ├── models/          # Modelos y esquemas de Mongoose 
 ├── routes/          # Definición de rutas de API (endpoints) 
 ├── services/        # Lógica de negocio y comunicación con la DB (core)
 ├── utils/           # Funciones auxiliares y manejo de errores
 ├── validation/      # Esquema de validación para asegurar la estructura de datos
 ├── app.js         
 ├── index.js         # Punto de entrada del servidor

```

## 🐋 Instalación y Ejecución con Docker

1️⃣ Clonar el repositorio.
``` bash
git clone https://github.com/orbitrymusic/tpOrquestacionDocker2025.git
```

2️⃣ Moverse al directorio Auth_Service.

``` bash
cd tpOrquestacionDocker2025
```
3️⃣ Instalar dependencias.
``` bash
npm i
```
4️⃣ Configurar variables de entorno

* Crea un archivo **.env** en la raíz del proyecto.
``` bash
JWT_SECRET=
PORT=
NODE_ENV=
# Conexión a Mongo dentro de Docker Compose (servicio llamado "mongo")
MONGODB_URI=mongodb://mongo:27017/AuthService
JWT_EXPIRATION=30m
CORE_SERVICE_URL=http://core-service:4000
CORE_API_KEY=
NOTIFICATION_SERVICE_URL=http://notifications-service:5000
MODULE_NAME=auth-service
VALIDATE=false
```

5️⃣ Ejecutar los siguientes comandos para no tener problema al levantar el contenedor (el proyecto se encuentra en estado develop).

``` bash
docker-compose down -v
```
``` bash
docker-compose up --build
```
6️⃣ Una vez levantado el contendor, utilizar Postman para registrar usuarios. Son posibles los siguientes roles: admin, secretaria, profesor, alumno. </br></br>


<img src="./assets/1.jpg" width="800" />
</br>
</br>
7️⃣ Ya registrado un usuario con alguno de los roles posibles, utiliza Postman para iniciar sesion correctamente,utilizando el metodo POST, ingresando su número de DNI y su contraseña. </br></br>

![Inicio de sesion de usuario](./assets/2.jpg)


