define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/string",
    "dojo/node!util",
    "dojo/node!crypto",
    "dojo/node!connect",
    "dojo/node!xml2js"
], function (declare, lang, array, string, util, crypto, connect, xml2js) {
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
            //console.log(this.token);
            //console.log(req.query.timestamp);
            //console.log(req.query.nonce);
            //console.log(req.query.signature);
            if (crypto.createHash("sha1").update([
                this.token,
                req.query.timestamp,
                req.query.nonce
            ].sort().join("")).digest("hex") == req.query.signature) {
                //console.log("true");
                return true;
            }
            else {
                //console.log("false");
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
                var now = this.nowaday();

                res.type("xml");

                switch (req.body.xml.MsgType[0].toLowerCase()) {
                    case "texta":
                        this.handleText(now, req, res);

                        break;

                    case "image":
                        this.handleImage(now, req, res);

                        break;

                    case "voice":
                        this.handleVoice(now, req, res);

                        break;

                    case "video":
                        this.handleVideo(now, req, res);

                        break;

                    case "location":
                        this.handleLocation(now, req, res);

                        break;

                    case "link":
                        this.handleLink(now, req, res);

                        break;

                    case "event":
                        this.handleEvent(now, req, res);

                        break;

                    default:
                        this.handleOther(now, req, res);

                        break;
                }
            }
            else {
                res.writeHead(401);
                res.end("Signature is invalid");
            }
        },
        handleText: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
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
                    //"Profile 1: <a href=\"${Profile1}\">Link</a>\n\n" +
                    //"Profile 2: <a href=\"${Profile2}\">Link</a>\n\n" +
                    "Link: <a href=\"${Link}\">Google</a>\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        Content: req.body.xml.Content[0],
                        //Profile1: "http://www.weixin/profile/gh_bf4a62d67399",
                        //Profile2: "weixin://profile/gh_bf4a62d67399",
                        Link: "http://www.google.com",
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleImage: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message Id: ${MsgId}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Picture Url: ${PicUrl}\n\n" +
                    "Media Id: ${MediaId}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        PicUrl: req.body.xml.PicUrl[0],
                        MediaId: (typeof req.body.xml.MediaId == "undefined" ? "" : req.body.xml.MediaId[0]),
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleVoice: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message Id: ${MsgId}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Media Id: ${MediaId}\n\n" +
                    "Format: ${Format}\n\n" +
                    "Recognition: ${Recognition}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        MediaId: req.body.xml.MediaId[0],
                        Format: req.body.xml.Format[0],
                        Recognition: req.body.xml.Recognition[0],
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleVideo: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message Id: ${MsgId}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Media Id: ${MediaId}\n\n" +
                    "ThumbMediaId: ${ThumbMediaId}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        MediaId: req.body.xml.MediaId[0],
                        ThumbMediaId: req.body.xml.ThumbMediaId[0],
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleLocation: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message Id: ${MsgId}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Location X: ${Location_X}\n\n" +
                    "Location Y: ${Location_Y}\n\n" +
                    "Scale: ${Scale}\n\n" +
                    "Label: ${Label}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        Location_X: req.body.xml.Location_X[0],
                        Location_Y: req.body.xml.Location_Y[0],
                        Scale: req.body.xml.Scale[0],
                        Label: req.body.xml.Label[0],
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleLink: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message Id: ${MsgId}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Url: ${Url}\n\n" +
                    "Title: ${Title}\n\n" +
                    "Description: ${Description}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgId: (typeof req.body.xml.MsgId == "undefined" ? "" : req.body.xml.MsgId[0]),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        Url: req.body.xml.Url[0],
                        Title: req.body.xml.Title[0],
                        Description: req.body.xml.Description[0],
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleEvent: function (now, req, res) {
            res.send(this.renderText({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Message type: ${MsgType}\n\n" +
                    "Create Time: ${CreateTime}\n\n" +
                    "From User: ${FromUserName}\n\n" +
                    "To User: ${ToUserName}\n\n" +
                    "Event: ${Event}\n\n" +
                    "Event Key: ${EventKey}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        MsgType: req.body.xml.MsgType[0],
                        CreateTime: (parseInt(req.body.xml.CreateTime[0]) * 1000).dateFormat(),
                        FromUserName: req.body.xml.FromUserName[0],
                        ToUserName: req.body.xml.ToUserName[0],
                        Event: req.body.xml.Event[0],
                        EventKey: req.body.xml.EventKey[0],
                        RawData: util.inspect(req.body, false, null)
                    })
            }));
        },
        handleOther: function (now, req, res) {
            res.send(this.renderArticle({
                ToUserName: req.body.xml.FromUserName,
                FromUserName: req.body.xml.ToUserName,
                CreateTime: Math.round(now.time / 1000),
                Content: string.substitute(
                    "\n" +
                    "Current Time: ${CurrentTime}\n\n" +
                    "Current Time Zone: ${CurrentTimeZone}\n\n" +
                    "HK Time: ${HkTime}\n\n" +
                    "Raw Data: ${RawData}", {
                        CurrentTime: now.time.dateFormat(),
                        CurrentTimeZone: now.timeZone,
                        HkTime: now.hkDate.getTime().dateFormat(),
                        RawData: util.inspect(req.body, false, null)
                    }),
                Articles: [{
                    Title: "Apple",
                    Description: "To see an apple in a dream is a favorable sign. Red apples in green leave lead to good luck and prosperity. Ripe apples on a tree mean that it is the time of living activities. But if you see one apple at the top of a tree, think if your plans are real. Dropped apples on earth symbolize flattery of false friends. A rotten apple is a symbol of useless attempts. If you see rotten and wormy apples, then it leads to failures.",
                    PicUrl: "http://eofdreams.com/data_images/dreams/apple/apple-05.jpg",
                    Url: "http://eofdreams.com/apple.html"
                }, {
                    Title: /*"Bananas"*/"",
                    Description: /*"If you see the dream with bananas, in reality you should work with colleagues who cause in you negative emotions. To eat the bananas in a dream - to stagnation in affairs. Also additional burdensome duties will fall down you. To trade the bananas - to the unprofitable transaction."*/"",
                    PicUrl: /*"http://eofdreams.com/data_images/dreams/bananas/bananas-04.jpg"*/"",
                    Url: /*"http://eofdreams.com/bananas.html"*/""
                }]
            }));
        },
        nowaday: function () {
            var currentDate = new Date();
            var currentTime = currentDate.getTime();
            var currentTimeZone = 0 - currentDate.getTimezoneOffset() / 60;

            var hkDate = currentDate;
            hkDate.setHours(hkDate.getHours() - currentTimeZone + 8);

            return {
                date: currentDate,
                time: currentTime,
                timeZone: currentTimeZone,
                hkDate: hkDate
            };
        },
        renderText: function (data) {
            return string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[text]]></MsgType>" +
                    "<Content><![CDATA[${Content}]]></Content>" +
                "</xml>", data);
        },
        renderArticle: function (data) {
            var result = string.substitute(
                "<xml>" +
                    "<ToUserName><![CDATA[${ToUserName}]]></ToUserName>" +
                    "<FromUserName><![CDATA[${FromUserName}]]></FromUserName>" +
                    "<CreateTime>${CreateTime}</CreateTime>" +
                    "<MsgType><![CDATA[news]]></MsgType>" +
                    "<ArticleCount>" + data.Articles.length + "</ArticleCount>" +
                    "<Articles>", data);

            array.forEach(data.Articles, function (item, index) {
                result += string.substitute(
                    "<item>" +
                    "<Title><![CDATA[${Title}]]></Title>" +
                    "<Description><![CDATA[${Description}]]></Description>" +
                    "<PicUrl><![CDATA[${PicUrl}]]></PicUrl>" +
                    "<Url><![CDATA[${Url}]]></Url>" +
                    "</item>", item);
            });

            result += string.substitute(
                    "</Articles>" +
                "</xml>", data);

            return result;
        }
    });
});
