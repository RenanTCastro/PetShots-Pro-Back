const jwt = require('jsonwebtoken')

require("dotenv").config();

module.exports = {
    async generateJwt(params = {}){
        return await jwt.sign(params, process.env.JWT_SECRET, {
            expiresIn: 86400
        })
    }
}