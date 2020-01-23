import Sequelize from "sequelize";
import { InstallationsModel } from "../lib/models/installation";
import { SubscriptionsModel } from "../lib/models/subscriptions";
import express from "express";
const app = express();

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL);
} else {
    const env = app.get("env");
    const config = require("../config.json")[env];

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
const Subscriptions = SubscriptionsModel(sequelize, Sequelize);

sequelize.sync({alter: {alter: true, drop: false } })
    .then(() => {
        console.log(`Database & tables created!`);
    });

export { Installations, Subscriptions };
