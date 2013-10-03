define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/node!util",
    "dojo/node!crypto",
    "dojo/node!connect",
    "dojo/node!xml2js"
], function (declare, lang, util, crypto, connect, xml2js) {
    return declare("app.util.WechatHelper", null, {
        token: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        parseBody: function (req, res, next) {
            if (req.method.toUpperCase() != "POST") {
                return next();
            }

            if (connect.utils.mime(req) != "" && connect.utils.mime(req).toLowerCase() != "text/xml") {
                return next();
            }

            if (req._body) {
                return next();
            }

            req.body = req.body || {};
            req._body = true;

            var requestDataXml = "";

            req.setEncoding("utf8");

            req.on("data", function (data) {
                requestDataXml += data;
            });

            req.on("end", function () {
                xml2js.parseString(requestDataXml, { trim: true }, function (error, requestDataJson) {
                    if (error) {
                        error.status = 400;
                        next(error);
                    } else {
                        req.body = requestDataJson;
                        next();
                    }
                });
            });
        },
        checkSignature: function (req) {
            console.log(this.token);
            console.log(req.query.timestamp);
            console.log(req.query.nonce);
            console.log(req.query.signature);
            if (crypto.createHash("sha1").update([
                this.token,
                req.query.timestamp,
                req.query.nonce
            ].sort().join("")).digest("hex") == req.query.signature) {
                console.log("true");
                return true;
            }
            else {
                console.log("false");
                return false;
            };
        },
        handleGet: function (req, res) {
            if (this.checkSignature(req) == true) {
                res.writeHead(200);
                res.end(req.query.echostr);
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            };
        },
        handlePost: function (req, res) {
            if (this.checkSignature(req) == true) {
                console.log(util.inspect(req.body, false, null));

                res.type("xml");
                res.send(
                    "<xml>" +
                        "<ToUserName><![CDATA[" + req.body.xml.FromUserName + "]]></ToUserName>" +
                        "<FromUserName><![CDATA[" + req.body.xml.ToUserName + "]]></FromUserName>" +
                        "<CreateTime>" + Math.round(new Date().getTime() / 1000) + "</CreateTime>" +
                        "<MsgType><![CDATA[" + req.body.xml.MsgType + "]]></MsgType>" +
                        "<Content>" +
                            "<![CDATA[" +
                                /*"<" +
                                req.body.xml.MsgId + "@" + (parseInt(req.body.xml.CreateTime) * 1000).dateFormat() + "@" + (new Date().getTime()).dateFormat() + "+" + (new Date().getTimezoneOffset()).toString() + ">:<" + req.body.xml.FromUserName + "(" + req.body.xml.Content + ")" + req.body.xml.ToUserName +
                                ">" +*/
                                "abc\n" +
                                "def" +
                            "]]>" +
                        "</Content>" +
                    "</xml>");
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            };
        }
    });
});
