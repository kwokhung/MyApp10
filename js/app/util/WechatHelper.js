define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/string",
    "dojo/node!util",
    "dojo/node!crypto",
    "dojo/node!connect",
    "dojo/node!xml2js"
], function (declare, lang, string, util, crypto, connect, xml2js) {
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
            }
        },
        handleGet: function (req, res) {
            if (this.checkSignature(req) == true) {
                res.writeHead(200);
                res.end(req.query.echostr);
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            }
        },
        handlePost: function (req, res) {
            if (this.checkSignature(req) == true) {
                res.type("xml");

                switch (req.body.xml.MsgType[0].toLowerCase()) {
                    case "text":
                        this.handleText(req, res);

                        break;

                    default:
                        this.handleOther(req, res);

                        break;
                }
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            }
        },
        handleText: function (req, res) {
            var currentDate = new Date();
            var currentTime = currentDate.getTime();
            var currentTimeZone = 0 - currentDate.getTimezoneOffset() / 60;

            var hkDate = currentDate;
            hkDate.setHours(hkDate.getHours() - currentTimeZone + 8);

            res.send(
                "<xml>" +
                    "<ToUserName><![CDATA[" + req.body.xml.FromUserName + "]]></ToUserName>" +
                    "<FromUserName><![CDATA[" + req.body.xml.ToUserName + "]]></FromUserName>" +
                    "<CreateTime>" + Math.round(currentTime / 1000) + "</CreateTime>" +
                    "<MsgType><![CDATA[" + req.body.xml.MsgType + "]]></MsgType>" +
                    "<Content>" +
                        "<![CDATA[" +
                            string.substitute(
                                "\n" +
                                "Current Time: ${CurrentTime}\n\n" +
                                "Current Time Zone: ${CurrentTimeZone}\n\n" +
                                "HK Time: ${HkTime}\n\n" +
                                "Message Id: ${MsgId}\n\n" +
                                "Message type: ${MsgType}\n\n" +
                                "Create Time: ${CreateTime}\n\n" +
                                "From User: ${FromUserName}\n\n" +
                                "To User: ${ToUserName}\n\n" +
                                "Content: ${Content}\n\n" +
                                "Raw Data: ${RawData}",
                                {
                                    CurrentTime: currentTime.dateFormat(),
                                    CurrentTimeZone: currentTimeZone,
                                    HkTime: hkDate.getTime().dateFormat(),
                                    MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                                    MsgType: req.body.xml.MsgType[0],
                                    CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                                    FromUserName: req.body.xml.FromUserName[0],
                                    ToUserName: req.body.xml.ToUserName[0],
                                    Content: req.body.xml.Content[0],
                                    RawData: util.inspect(req.body, false, null)
                                }) +
                        "]]>" +
                    "</Content>" +
                "</xml>");
        },
        handleOther: function (req, res) {
            var currentDate = new Date();
            var currentTime = currentDate.getTime();
            var currentTimeZone = 0 - currentDate.getTimezoneOffset() / 60;

            var hkDate = currentDate;
            hkDate.setHours(hkDate.getHours() - currentTimeZone + 8);

            res.send(
                "<xml>" +
                    "<ToUserName><![CDATA[" + req.body.xml.FromUserName + "]]></ToUserName>" +
                    "<FromUserName><![CDATA[" + req.body.xml.ToUserName + "]]></FromUserName>" +
                    "<CreateTime>" + Math.round(currentTime / 1000) + "</CreateTime>" +
                    "<MsgType><![CDATA[" + "text" + "]]></MsgType>" +
                    "<Content>" +
                        "<![CDATA[" +
                            string.substitute(
                                "\n" +
                                "Current Time: ${CurrentTime}\n\n" +
                                "Current Time Zone: ${CurrentTimeZone}\n\n" +
                                "HK Time: ${HkTime}\n\n" +
                                "Raw Data: ${RawData}",
                                {
                                    CurrentTime: currentTime.dateFormat(),
                                    CurrentTimeZone: currentTimeZone,
                                    HkTime: hkDate.getTime().dateFormat(),
                                    RawData: util.inspect(req.body, false, null)
                                }) +
                        "]]>" +
                    "</Content>" +
                "</xml>");
        }
    });
});
