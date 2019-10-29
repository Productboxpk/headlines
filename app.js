import express from "express";
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

hbs.registerHelper("log", function(data) {
	console.log(data, 'data is logging');
  });
  
  
hbs.registerHelper( "when",function(operand_1, operator, operand_2, options) {
	var operators = {
		'eq': function(l,r) { return l == r; },
		'noteq': function(l,r) { return l != r; },
		'gt': function(l,r) { return Number(l) > Number(r); },
		'or': function(l,r) { return l || r; },
		'and': function(l,r) { return l && r; },
		'%': function(l,r) { return (l % r) === 0; }
	}
	, result = operators[operator](operand_1,operand_2);

	if (result) return options.fn(this);
	else  return options.inverse(this);
});

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

const jira = new JiraClient({
	host: "productboxpk.atlassian.net",
	protocol: "https",
	basic_auth: {
		email: "syed.farhan@productbox.dev",
		api_token: "4a6PilrbcstGtYvhWhZR2C83"
	}
});

console.log(addon, 'addon data')

routes(app, addon, jira);

http.createServer(app).listen(port, () => {
  console.log("App server running at http://" + os.hostname() + ":" + port);

  if (devEnv) addon.register();
});
