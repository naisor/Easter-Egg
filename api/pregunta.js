export default async function handler(req, res) {
  // Deshabilitar caché por completo en Vercel y el navegador
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = "3e89e374d10d6cfd3c017f104df08087";
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "Falta configurar GITHUB_TOKEN en las variables de entorno de Vercel." });
  }

  // Timestamp para evitar caché de GitHub REST API
  const cacheBuster = `?t=${Date.now()}`;

  // GET: Obtener la pregunta activa
  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}${cacheBuster}`, {
        headers: { 
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vercel-Serverless-App'
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Error al consultar GitHub Gist." });
      }

      const data = await response.json();
      const archivoKey = Object.keys(data.files)[0];
      const contenido = JSON.parse(data.files[archivoKey].content);

      return res.status(200).json(contenido);
    } catch (error) {
      return res.status(500).json({ error: "Error de servidor al leer la pregunta." });
    }
  }

  // POST: Crear o responder pregunta
  if (req.method === 'POST') {
    try {
      const { accion, pregunta, respuesta } = req.body;

      const resGet = await fetch(`https://api.github.com/gists/${GIST_ID}${cacheBuster}`, {
        headers: { 
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vercel-Serverless-App'
        }
      });
      
      if (!resGet.ok) {
        return res.status(resGet.status).json({ error: "No se pudo acceder al Gist en GitHub." });
      }

      const dataGet = await resGet.json();
      const archivoKey = Object.keys(dataGet.files)[0];

      let payloadJson = {};

      if (accion === 'crear') {
        payloadJson = {
          pregunta: pregunta,
          respuesta: "",
          respondido: false
        };
      } else if (accion === 'responder') {
        const contenidoPrevio = JSON.parse(dataGet.files[archivoKey].content);
        payloadJson = {
          pregunta: contenidoPrevio.pregunta,
          respuesta: respuesta,
          respondido: true
        };
      } else {
        return res.status(400).json({ error: "Acción no válida." });
      }

      const resPatch = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vercel-Serverless-App'
        },
        body: JSON.stringify({
          files: {
            [archivoKey]: {
              content: JSON.stringify(payloadJson, null, 2)
            }
          }
        })
      });

      if (resPatch.ok) {
        return res.status(200).json({ success: true, data: payloadJson });
      } else {
        const err = await resPatch.json();
        return res.status(resPatch.status).json({ error: err.message || "Error al actualizar la pregunta." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Error interno en el servidor." });
    }
  }

  return res.status(405).json({ error: "Método no permitido." });
}