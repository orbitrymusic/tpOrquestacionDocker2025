# 🚀 Auth_Service: Guía de Arranque y Troubleshooting

Este documento describe cómo levantar el entorno de desarrollo y la aplicación del microservicio de autenticación.  
Utilizamos **Docker Compose** para orquestar la base de datos (MongoDB) y el cliente visual (mongo-client), mientras que el backend de Node.js se ejecuta de forma local para facilitar la depuración (`npm run dev`).

---

## 🛠️ 1. Requisitos y Configuración Previa

Asegúrate de tener instalados:

- Docker Desktop (para los servicios de contenedores)
- Node.js
- Dependencias del proyecto

### 1.1. Modificación Crítica del Archivo `.env`

Para que tu aplicación local (`npm run dev`) pueda conectarse al contenedor de MongoDB, la variable `MONGODB_URI` debe apuntar a tu máquina anfitriona (`localhost`), ya que el puerto `27017` está expuesto por Docker:

| Configuración | Valor Requerido |
|---------------|----------------|
| MONGODB_URI   | mongodb://localhost:27017/authdb |

### 1.2. Instalación de Dependencias

Ejecuta este comando una sola vez para instalar todas las dependencias del proyecto:

```bash
npm install
