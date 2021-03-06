Date.prototype.yyyyMMddHHmmss = function () {
    var date = this;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();

    return "" + year +
    (month < 10 ? "0" + month : month) +
    (day < 10 ? "0" + day : day) +
    (hh < 10 ? "0" + hh : hh) +
    (mm < 10 ? "0" + mm : mm) +
    (ss < 10 ? "0" + ss : ss);
};

Date.prototype.dateFormat = function () {
    var date = this;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();

    return "" + year + "-" +
    (month < 10 ? "0" + month : month) + "-" +
    (day < 10 ? "0" + day : day) + " " +
    (hh < 10 ? "0" + hh : hh) + ":" +
    (mm < 10 ? "0" + mm : mm) + ":" +
    (ss < 10 ? "0" + ss : ss);
};

String.prototype.dateFormat = function () {
    var that = this.toString();

    var date = new Date(that.substring(0, 4), that.substring(4, 6) - 1, that.substring(6, 8), that.substring(8, 10), that.substring(10, 12), that.substring(12));
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();

    return "" + year + "-" +
    (month < 10 ? "0" + month : month) + "-" +
    (day < 10 ? "0" + day : day) + " " +
    (hh < 10 ? "0" + hh : hh) + ":" +
    (mm < 10 ? "0" + mm : mm) + ":" +
    (ss < 10 ? "0" + ss : ss);
};

Number.prototype.dateFormat = function () {
    var date = new Date(this);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();

    return "" + year + "-" +
    (month < 10 ? "0" + month : month) + "-" +
    (day < 10 ? "0" + day : day) + " " +
    (hh < 10 ? "0" + hh : hh) + ":" +
    (mm < 10 ? "0" + mm : mm) + ":" +
    (ss < 10 ? "0" + ss : ss);
};

define([
    "dojo/_base/lang",
    "dojo/node!util",
    "dojo/node!express.io",
    "app/util/ExpressHelper",
    "app/util/ResourceHelper",
    "app/util/WechatHelper"
], function (lang, util, express, ExpressHelper, ResourceHelper, WechatHelper) {
    return function () {
        var app = express();

        app.http().io();

        var expressHelper = new ExpressHelper({
            app: app
        });

        var resourceHelper = new ResourceHelper({
            app: app
        });

        var wechatHelper = new WechatHelper({
            token: "LivingStrategy"
        });

        app.configure(function () {
            app.use(express.logger());
            app.use("/wechat", lang.hitch(wechatHelper, wechatHelper.parseBody));
            app.use(app.router);
            app.use("/www", express.static("C:\\Projects\\MyApp16\\platforms\\android\\assets\\www"));
            app.use(express.errorHandler({
                dumpExceptions: true,
                showStack: true
            }));
        });

        app.get("/index.html", lang.hitch(expressHelper, expressHelper.handleIndex));

        app.get("/process", lang.hitch(expressHelper, expressHelper.handleProcess));

        app.get("/dojotest01", function (req, res) {
            res.send(util.inspect(main, { showHidden: false, depth: 2 }));
        });

        app.get("/dojotest02", function (req, res) {
            res.send(util.inspect(dojoConfig, { showHidden: false, depth: 2 }));
        });

        app.get("/wechat", lang.hitch(wechatHelper, wechatHelper.handleGet));

        app.post("/wechat", lang.hitch(wechatHelper, wechatHelper.handlePost));

        app.io.configure(lang.hitch(expressHelper, expressHelper.ioConfigure));

        app.io.set("authorization", lang.hitch(expressHelper, expressHelper.ioSetAuthorization));

        app.io.on("connection", lang.hitch(expressHelper, expressHelper.ioOnConnection));

        app.io.route("resource", {
            "i.am": lang.hitch(resourceHelper, resourceHelper.handleIAm),
            "i.am.no.more": lang.hitch(resourceHelper, resourceHelper.handleIAmNoMore),
            "heartbeat": lang.hitch(resourceHelper, resourceHelper.handleHeartbeat),
            "tell.other": lang.hitch(resourceHelper, resourceHelper.handleTellOther),
            "tell.someone": lang.hitch(resourceHelper, resourceHelper.handleTellSomeone),
            "who.are.there": lang.hitch(resourceHelper, resourceHelper.handleWhoAreThere)
        });

        app.listen(process.env.PORT || 3000);

        console.log("Listening on port " + (process.env.PORT || 3000));
    };
});