// Memoria temporal en la nube (funciona perfecto para pruebas rápidas)
global.dbPreguntas = global.dbPreguntas || {};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { accion, pregunta, id, respuesta } = req.body;

        if (accion === 'crear') {
            const nuevoId = Math.random().toString(36).substring(2, 9);
            global.dbPreguntas[nuevoId] = {
                pregunta,
                respuesta: null,
                respondido: false
            };
            return res.status(200).json({ id: nuevoId });
        }

        if (accion === 'responder') {
            if (global.dbPreguntas[id]) {
                global.dbPreguntas[id].respuesta = respuesta;
                global.dbPreguntas[id].respondido = true;
                return res.status(200).json({ success: true });
            }
            return res.status(404).json({ error: 'No encontrado' });
        }
    }

    if (req.method === 'GET') {
        const { id } = req.query;
        if (id && global.dbPreguntas[id]) {
            return res.status(200).json(global.dbPreguntas[id]);
        }
        return res.status(404).json({ error: 'No encontrado' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}