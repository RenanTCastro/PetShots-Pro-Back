const knex = require("../database");
const { toFile } = require("openai/uploads");
const openai = require("../config/openai");
const bucket = require("../config/firebase");

module.exports = {
    async create(req, res, next) {
        try {
            const { user_id } = req.user;
            const file = req.file;
            
            const prompts = [
                "Transformar esta imagem em uma fotografia profissional de pet. Foto em um estúdio, com fundo branco suave, iluminação lateral suave e foco nítido no rosto do animal, mantendo o animal como está.",
                "Transformar esta imagem em uma fotografia profissional de pet. Fundo bonito e desfocado, iluminação suave, realce de cores, mantendo o animal como está.",
                "Transformar esta imagem em uma fotografia profissional de pet. Posando em um ambiente interno moderno com fundo de madeira clara, luz suave, sombras realçadas e cores levemente quentes, como em fotografia vintage, mantendo o animal como está.",
            ]        

            const user = await knex("users")
                .select("credits")
                .where({ user_id })
                .first();

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            if (user.credits <= 0) {
                return res.status(400).json({ error: "Créditos insuficientes." });
            }

            if (!file || !user_id) {
                return res.status(400).json({ error: "Imagem ou usuário não enviado." });
            }

            const inputImage = await toFile(
                file.buffer,
                file.originalname,
                { type: file.mimetype }
            );

            const responses = await Promise.all(
                prompts.map((p) =>
                openai.images.edit({
                    model: "gpt-image-1",
                    image: inputImage,
                    prompt: p,
                    size: "1024x1024",
                })
                )
            );

            const uploadedUrls = [];
            for (let i = 0; i < responses.length; i++) {
                const base64 = responses[i].data[0].b64_json;
                const buffer = Buffer.from(base64, "base64");

                const fileName = `users/${user_id}/photo_${Date.now()}_${i}.png`;
                const fileUpload = bucket.file(fileName);

                await fileUpload.save(buffer, {
                    metadata: { contentType: "image/png" },
                    public: true,
                });

                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                uploadedUrls.push(publicUrl);
            }

            const [photo_id] = await knex("photos")
                .insert({
                    user_id,
                    photo_1_url: uploadedUrls[0],
                    photo_2_url: uploadedUrls[1],
                    photo_3_url: uploadedUrls[2],
                });

            await knex("users")
                .where({ user_id })
                .decrement("credits", 1);

            return res.status(201).json({
                message: "Fotos geradas com sucessos!",
                photo_id,
                photos: uploadedUrls,
            });
        } catch (error) {
            console.error("Erro ao gerar fotos");
            next(error);
        }
    },

    async listByUser(req, res, next) {
        try {
            const { user_id } = req.user;

            const photos = await knex("photos")
                .where({ user_id })
                .orderBy("created_at", "desc");

            return res.json(photos);
        } catch (error) {
            console.log("Erro ao listar fotos por usuário");
            next(error);
        }
    },

    async download(req, res, next) {
        try {
            const { photo_id, which } = req.params;
            const photo = await knex("photos").where({ photo_id }).first();
            
            if (!photo) {
                return res.status(404).json({ error: "Foto não encontrada." });
            }

            const column = `photo_${which}_url`;
            const url = photo[column];

            const filePath = url.split(`${bucket.name}/`)[1]; 
            const file = bucket.file(filePath);

            const [contents] = await file.download();

            res.setHeader("Content-Disposition", `attachment; filename="${filePath.split("/").pop()}"`);
            res.setHeader("Content-Type", "image/png");
            res.send(contents);
        } catch (err) {
            console.error("Erro ao baixar foto", err);
            next(err);
        }
    }
};
