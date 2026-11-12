# 🏎️ CarDex — El Pokédex de Autos del Mundo Real

**CarDex** es una aplicación de coleccionismo urbano de autos inspirada en el fenómeno de *Pokémon Go* y la cultura del *Car Spotting*.

---

## 🌟 Funcionalidades Principales

1. **📸 Scanner & Reconocimiento con IA Multimodal:**
   - Acceso a la **cámara en vivo** con visor táctico y animación láser de escaneo.
   - Posibilidad de **subir fotografías** desde el carrete.
   - **Autos de prueba con 1-click** (Porsche 911 GT3 RS, Mustang '67, Ferrari F40, BMW M3, Toyota Corolla) para probar la app inmediatamente desde cualquier lugar.
   - Identificación inteligente de **marca, modelo, generación, año, potencia (CV), aceleración 0-100 km/h, velocidad máxima, motor y color**.
   - Integración nativa con **Google Gemini Vision API** (con modo catálogo inteligente de respaldo).

2. **🏷️ Escala Oficial de Rareza:**
   - **Histórico:** Clásicos legendarios de más de 35 años (Mustang 67, Ferrari F40).
   - **Legendario:** Superdeportivos exóticos de altas prestaciones (Porsche GT3 RS, Ferrari, McLaren).
   - **Raro:** Versiones deportivas especiales y de alto rendimiento (BMW M, Audi RS, AMG, Golf GTI).
   - **Común:** Sedanes medianos y SUVs familiares de gama media.
   - **Básico:** Autos urbanos y utilitarios de producción masiva (Corolla, Gol, Cronos).

3. **📡 Radar en Vivo & Alertas de Proximidad Comunitaria:**
   - Pantalla de radar táctico con haz de barrido y círculos concéntricos de distancia.
   - Cuando alguien fotografía un auto **Raro, Legendario o Histórico**, la aplicación genera una **alerta de proximidad** a los cazadores cercanos.
   - **Modo Silueta / Misterio:** Los autos reportados en el radar se muestran en **blanco y negro / silueta** hasta que te acercas y los capturas con tu propia cámara para desbloquearlos a todo color.
   - Botón para simular alertas de caza en tiempo real.

4. **🚗 Garage Virtual del Coleccionista:**
   - Tarjetas coleccionables holográficas interactivas estilo Pokémon / Top Trumps.
   - Métricas acumuladas: **Total de Caballos de Fuerza (CV)** acumulados en tu cochera, auto más veloz y nivel de coleccionista.
   - Filtros por rareza y buscador dinámico por marca o modelo.
   - Botón de aceleración de motor con **sonido sintetizado en tiempo real** (Web Audio API) y lluvia de confeti en descubrimientos épicos.

---

## 🚀 Cómo Ejecutar la Aplicación

El servidor ya está ejecutándose en:
👉 **[http://localhost:5000](http://localhost:5000)**

Para volver a iniciarlo en cualquier momento:
```bash
cd "C:\Users\Jabali\.gemini\antigravity\scratch\cardex"
node backend/server.js
```

Para desarrollo con recarga en vivo del frontend:
```bash
cd frontend
npm.cmd run dev
```

---

## ⚙️ Configuración Opcional de Gemini API Key
En la esquina superior derecha de la app, haz clic en el ícono de **Ajustes (⚙️)**. Puedes introducir tu propia clave de la API de Google Gemini para que el análisis visual funcione con cualquier foto personalizada de la calle en tiempo real.

