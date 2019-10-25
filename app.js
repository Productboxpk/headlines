// Entry point for the app

// Express is the underlying that atlassian-connect-express uses:
// https://expressjs.com
import express from "express";

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import errorHandler from "errorhandler";
import morgan from "morgan";
import JiraClient from "jira-connector";
import ace from "atlassian-connect-express";
import hbs from "express-hbs";
import http from "http";
import path from "path";
import os from "os";
import routes from "./routes";

const app = express();
const addon = ace(app);

const port = addon.config.port();
app.set("port", port);

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

hbs.registerHelper("log", function(data) {
  console.log(data);
});

console.log(app, addon, 'app and add')

const jira = new JiraClient({
	host: "productboxpk.atlassian.net",
	protocol: "https",
	basic_auth: {
		email: "syed.farhan@productbox.dev",
		api_token: "4a6PilrbcstGtYvhWhZR2C83"
	}
});

routes(app, addon, jira);

http.createServer(app).listen(port, () => {
  console.log("App server running at http://" + os.hostname() + ":" + port);

  // Enables auto registration/de-registration of app into a host in dev mode
  if (devEnv) addon.register();
});
