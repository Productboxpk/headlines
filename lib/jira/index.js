import * as jwt from "atlassian-jwt";
import moment from "moment";

export const createJWTToken = async req => {
    const now = moment().utc();

    const tokenData = {
        iss: "issuer-val",
        iat: now.unix(),
        exp: now.add(3, "minutes").unix(),
        qsh: jwt.createQueryStringHash(jwt.fromExpressRequest(req))
    };

    const secret = process.env.jwt_secret;

    const token = jwt.encode(tokenData, secret);
    console.log(token);
    return token;
};
