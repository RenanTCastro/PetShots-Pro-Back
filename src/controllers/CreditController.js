require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY_test);

module.exports = {
    async createCheckoutSession(req, res) {
        try {
            const { credits } = req.body;
            const { user_id } = req.user;

           const priceTable = { "1": 1990, "2": 2790, "3": 5490 };

            const unit_amount = priceTable[credits];
            if (!unit_amount) {
                return res.status(400).json({ error: "Pacote inválido" });
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [{
                    price_data: {
                        currency: "brl",
                        product_data: {
                            name: `${credits} Créditos PetShots`
                        },
                        unit_amount
                    },
                    quantity: 1
                }],
                mode: "payment",
                client_reference_id: user_id,
                success_url: "http://localhost:5173/sucess",
                cancel_url: "http://localhost:5173/buy"
            });

            return res.json({ id: session.id });
        } catch (error) {
            console.error("Erro ao criar sessão Stripe:", error);
            return res.status(500).json(error);
        }
    },

    async handleWebhook(req, res) {
        const sig = req.headers["stripe-signature"];

        let event;

        try {
            event = stripe.webhooks.constructEvent( req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.log("Webhook validation failed:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const user_id = session.user_id;

            await knex("users")
            .where({ user_id: user_id })
            .increment("credits", 5);

            console.log(`Added credits to ${user_id}`);
        }

        res.json({ received: true });
    }
    
};
