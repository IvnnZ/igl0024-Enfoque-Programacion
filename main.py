import boto3
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse

load_dotenv()

# Configuración de MongoDB
mongodb_client = MongoClient(os.getenv("MONGODB_URL"))
db = mongodb_client["fast-retail"]
col = db["etiquetas"]

CAMISETAS = ["T-Shirt", "Shirt"]
PANTALONES = ["Pants", "Shorts"]

# Configuración de AWS
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Inicializar clientes de AWS
s3_client = boto3.client("s3", region_name='eu-west-2', 
                         aws_access_key_id=AWS_ACCESS_KEY, 
                         aws_secret_access_key=AWS_SECRET_KEY)

rekognition_client = boto3.client("rekognition", region_name='eu-west-2', 
                         aws_access_key_id=AWS_ACCESS_KEY, 
                         aws_secret_access_key=AWS_SECRET_KEY)

app = FastAPI()

app.mount("/static", StaticFiles(directory="./static"), name="static")

# Ruta para servir el index.html
@app.get("/")
def home():
    return FileResponse("./static/index.html", status_code=200)

@app.post("/subir-imagen/")
async def subir_imagen(nombreProducto: str = Form(...), imagenProducto: UploadFile = Form(...)):

    contenido = await imagenProducto.read()

    s3_client.put_object(
        Bucket=os.getenv("BUCKET_NAME"),
        Key=nombreProducto,
        Body=contenido,
        ContentType=imagenProducto.content_type
    )

    analizarImagen(nombreProducto)

    return JSONResponse(content={"mensaje": "Imagen subida y procesada","nombreProducto": nombreProducto})

# Ruta para analizar imágenes con Rekognition
@app.get("/analizar-imagen")
def analizarImagen(nombreProducto: str ):
    try:
        respuesta = rekognition_client.detect_labels(
            Image={"S3Object":{"Bucket":os.getenv("BUCKET_NAME"),"Name":nombreProducto}},
            MaxLabels=5
        )
        col.insert_one({"nombreProducto": nombreProducto, "etiquetas": respuesta['Labels']})
        return {"etiquetas": respuesta['Labels']}

    except Exception as e:
        return {"error": f"Error al analizar imagen: {str(e)}"}

@app.get("/imagenes")
def listarImagenes():
    response = s3_client.list_objects_v2(Bucket=os.getenv("BUCKET_NAME"))
    if "Contents" in response:
        return [{"nombre": obj["Key"], "url": obtener_url_temporal(obj["Key"])} for obj in response["Contents"]]
    return []

def obtener_url_temporal(nombre_archivo, expiracion=3600):
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": os.getenv("BUCKET_NAME"), "Key": nombre_archivo},
        ExpiresIn=expiracion
    )

@app.get("/cargar-etiquetas-imagen")
def cargarEtiquetasImagen(nombreProducto: str):
    try:
        resultadoConsulta = col.find_one({"nombreProducto": nombreProducto})
        if resultadoConsulta:
            return JSONResponse(content={"Imagenes": arreglarResult([resultadoConsulta])})
        else:
            return JSONResponse(content={"mensaje": "Imagen no encontrada"}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
@app.get("/cargar-etiquetas-categorias")       
def cargarEtiquetasCategorias(categoria: str):
    try:
        if categoria == "camisetas":
            resultadoConsulta = col.find({"etiquetas.Name": {"$in": CAMISETAS}})
        elif categoria == "pantalones":
            resultadoConsulta = col.find({"etiquetas.Name": {"$in": PANTALONES}})
        elif categoria == "todas":
            resultadoConsulta = col.find()

        if resultadoConsulta:
            return JSONResponse(content={"Imagenes": arreglarResult(resultadoConsulta)})
        else:
            return JSONResponse(content={"mensaje": "Imagen no encontrada"}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.delete("/eliminar-imagen/{nombreProducto}")
def eliminarImagen(nombreProducto: str):
    try:
        # Eliminar de S3
        s3_client.delete_object(Bucket=os.getenv("BUCKET_NAME"), Key=nombreProducto)
        
        # Eliminar de MongoDB
        col.delete_one({"nombreProducto": nombreProducto})
        
        return JSONResponse(content={"mensaje": "Imagen eliminada correctamente"})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
def arreglarResult(resultadoConsulta):
    respuesta = []
    for imagen in resultadoConsulta:
        etiquetas = imagen["etiquetas"]
        nombre = imagen["nombreProducto"]
        respuesta.append({"nombre": nombre, "etiquetas": etiquetas})
    return respuesta