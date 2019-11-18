import Sequelize from "sequelize";
import { InstallationsModel } from "../lib/models/installation";
import express from "express";
const app = express();
const env = app.get("env");
let config = require("./config.json")[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: "postgres",
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const Installations = InstallationsModel(sequelize, Sequelize);

sequelize.sync({ force: true }).then(() => {
    console.log(`Database & tables created!`);
});

export { Installations };
