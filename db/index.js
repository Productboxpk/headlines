import Sequelize from "sequelize";
import { InstallationsModel } from "../lib/models/installation";
import express from "express";
const app = express();
const env = app.get("env");
const config = require("../config.json")[env];
console.log(process.env.DATABASE_URL, "config");

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL);
} else {
    sequelize = new Sequelize(config.store.database, config.store.username, config.store.password, {
        host: config.store.host,
        dialect: config.store.dialect,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
}
const Installations = InstallationsModel(sequelize, Sequelize);

sequelize.sync({ force: true }).then(() => {
    console.log(`Database & tables created!`);
});

export { Installations };
