export default async function handler(req, res) {
    // Usamos una cubeta pública y gratuita de prueba en kvdb.io para tu app
    const KVDB_BUCKET = "9XvP4xLqJg2V8zW1sF6tK9"; 

    if (req.method === 'POST') {
        const { accion, pregunta, id, respuesta } = req.body;

        if (accion === 'crear') {
            const nuevoId = Math.random().toString(36).substring(2, 9);
            const objetoNuevo = { pregunta, respuesta: null, respondido: false };

            // Guardar en KVDB.io
            await fetch(`https://kvdb.io/${KVDB_BUCKET}/${nuevoId}`, {
                method: 'PUT',
                body: JSON.stringify(objetoNuevo)
            });

            return res.status(200).json({ id: nuevoId });
        }

        if (accion === 'responder') {
            // Leer el registro actual
            const response = await fetch(`https://kvdb.io/${KVDB_BUCKET}/${id}`);
            if (response.ok) {
                const actual = await response.json();
                actual.respuesta = respuesta;
                actual.respondido = true;

                // Actualizar en KVDB.io
                await fetch(`https://kvdb.io/${KVDB_BUCKET}/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(actual)
                });

                return res.status(200).json({ success: true });
            }
            return res.status(404).json({ error: 'No encontrado' });
        }
    }

    if (req.method === 'GET') {
        const { id } = req.query;
        if (id) {
            const response = await fetch(`https://kvdb.io/${KVDB_BUCKET}/${id}`);
            if (response.ok) {
                const datos = await response.json();
                return res.status(200).json(datos);
            }
        }
        return res.status(404).json({ error: 'No encontrado' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}