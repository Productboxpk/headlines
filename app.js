import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import errorHandler from "errorhandler";
import morgan from "morgan";
import ace from "atlassian-connect-express";
import hbs from "express-hbs";
import path from "path";
import routes from "./routes";

import handlbarsHelpers from "./lib/helpers";

const app = express();
const addon = ace(app);

const port = addon.config.port();
const PORT = process.env.PORT || port;
app.set("port", PORT);

handlbarsHelpers(hbs);

const viewsDir = __dirname + "/views";
app.engine("hbs", hbs.express4({ partialsDir: viewsDir }));
app.set("view engine", "hbs");
app.set("views", viewsDir);

const devEnv = app.get("env") == "development";
app.use(morgan(devEnv ? "dev" : "combined"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(compression());

app.use(addon.middleware());

const staticDir = path.join(__dirname, "public");
app.use(express.static(staticDir));

if (devEnv) app.use(errorHandler());

routes(app, addon);

app.listen(PORT, () => {
    console.log("App server running at http://" + addon.config.localBaseUrl + ":" + PORT);

    if (devEnv) addon.register();
});
