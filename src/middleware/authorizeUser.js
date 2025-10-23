

export const authorizaUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!id || !userId) {
            return res.status(400).json({ message: "Faltan parametros" })
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Error en la autorizacion", error: error.message })
    }
};