# Proyecto Enfoque Programación Inteligencia Artificial

Este proyecto utiliza FastAPI para cargar imágenes en un bucket privado de AWS S3 y analizarlas con AWS Rekognition.

## 🚀 Instalación en Local

### 1️⃣ Requisitos Previos

Asegúrate de tener instalado:

- Python 3.10+
- pip
- MongoDB

### 2️⃣ Instalación de Dependencias

Clona el repositorio y accede a la carpeta:

```bash
git clone https://github.com/IvnnZ/igl0024-Enfoque-Programacion.git
```

### 3️⃣ Configuración del Entorno

```bash
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
```

Instala las dependencias:

```bash
pip install -r requirements.txt
```

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```ini
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
MONGODB_URL=tu-url-mongodb
BUCKET_NAME=tu-s3-bucket
```

### 4️⃣ Ejecución de la API

Para ejecutar el servidor FastAPI:

```bash
uvicorn main:app --reload
```

La API estará disponible en `http://127.0.0.1:8000/docs`.

## ☁️ Configuración de AWS (Resumen)

1. **S3**: Crea un bucket privado y otorga permisos de lectura/escritura a tu usuario IAM.
2. **Rekognition**: Habilita el servicio y asigna los permisos necesarios en IAM.
3. **AWS CLI**: Configura las credenciales con `aws configure`.

---
