const knex = require("../database");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateJwt = require("../utils/jwt");

require("dotenv").config();

module.exports = {
    async register(req, res, next) {
        try {
            const { email, password } = req.body;

            const hashedPassword = bcrypt.hashSync(password, 10);

            await knex("users").insert({ email, password: hashedPassword });

            const token = jwt.sign({ email }, process.env.SECRET, { expiresIn: "1h" });

            return res.status(201).json({ token });
        } catch (error) {
            console.log("Erro ao registar usuário");
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = await knex("users").where({ email: email });

            if (!(email && password)) {
                res.status(400).send({ message: "É necessário preencher todos campos" });
            }

            if (!user.length) {
                res.status(401).json({ message: "E-mail não existe" });
            } else {
                const isAuthenticated = bcrypt.compareSync(password, user[0].password);

                if (!isAuthenticated) {
                    res.status(401).json({ message: "Senha incorreta" });
                } else {
                    const token = await generateJwt.generateJwt({ user_id: user[0].user_id });
                    res.send({ token: token });
                }
            }
        } catch (error) {
            console.log("Erro ao fazer login");
            next(error);
        }
    },

    async getCreditsById(req, res, next) {
        try {
            const { user_id } = req.user;

            const credits = await knex("users").select("credits").where({ user_id }).first();

            if (!credits) {
                return res.status(404).json({ error: "Usuário não encontrada." });
            }
        
            return res.json(credits);
        } catch (error) {
            console.log("Erro ao buscar créditos");
            next(error);
        }
    }
};