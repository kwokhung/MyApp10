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

var main = function () {
    require([
        "dojo/node!util",
        "dojo/node!express.io",
        "app/util/StoredData"
    ], function (util, express, StoredData) {
        var storedData = new StoredData({
            storeLabel: "Resource",
            storeIdentifier: "who"
        });

        var app = express();

        app.use("/www", express.static("C:\\Projects\\MyApp16\\platforms\\android\\assets\\www"));

        app.get("/index.html", function (req, res) {
            res.sendfile("./index.html");
        });

        app.get("/process", function (req, res) {
            res.send(util.inspect(process, { showHidden: false, depth: 2 }));
        });

        app.http().io();

        app.io.set("authorization", function (handshakeData, accept) {
            return accept(null, true);
        });

        app.io.on("connection", function (socket) {
            var heartbeat = setInterval(function () {
                socket.emit("heartbeat", {
                    when: new Date().yyyyMMddHHmmss()
                });
            }, 60000)

            socket.on("disconnect", function () {
                clearInterval(heartbeat);
            })
        });

        app.io.route("i.am", function (req) {
            if (storedData.store.get(req.data.whoAmI) != null) {
                req.io.respond({
                    status: false,
                    message: "' (" + req.data.who + ") i.am (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "' (" + req.data.who + ") i.am (" + req.data.whoAmI + ")' accepted"
                });

                storedData.store.put({
                    "who": req.data.whoAmI,
                    "when": req.data.when
                });

                req.io.join(req.data.whoAmI);

                if (storedData.store.get("Resource Monitor") != null) {
                    app.io.room("Resource Monitor").broadcast("someone.joined", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }

                req.io.broadcast("he.is", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });

                req.io.emit("you.are", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });
            }
        });

        app.io.route("i.am.no.more", function (req) {
            if (storedData.store.get(req.data.whoAmI) == null) {
                req.io.respond({
                    status: false,
                    message: "' (" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "' (" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' accepted"
                });

                storedData.store.remove(req.data.whoAmI);

                req.io.leave(req.data.whoAmI);

                if (storedData.store.get("Resource Monitor") != null) {
                    app.io.room("Resource Monitor").broadcast("someone.left", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }

                req.io.broadcast("he.is.no.more", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });

                req.io.emit("you.are.no.more", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });
            }
        });

        app.io.route("heartbeat", function (req) {
            req.io.respond({
                status: true,
                message: "'heartbeat (" + req.data.who + ")' accepted"
            });

            if (storedData.store.get(req.data.who) != null) {
                storedData.store.get(req.data.who).when = req.data.when;
            }

            if (storedData.store.get("Resource Monitor") != null) {
                app.io.room("Resource Monitor").broadcast("someone.beat", {
                    who: req.data.who,
                    when: req.data.when
                });
            }
        });

        app.io.route("tell.other", function (req) {
            req.io.respond({
                status: true,
                message: "'tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what,
                when: req.data.when
            });
        });

        app.io.route("tell.someone", function (req) {
            if (storedData.store.get(req.data.whom) == null) {
                req.io.respond({
                    status: false,
                    message: "'tell.someone (" + req.data.whom + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'tell.someone (" + req.data.whom + ")' accepted"
                });

                app.io.room(req.data.whom).broadcast("someone.said", {
                    who: req.data.who,
                    what: req.data.what,
                    when: req.data.when
                });
            }
        });

        app.io.route("who.are.there", function (req) {
            req.io.respond({
                status: true,
                message: "'who.are.there' accepted"
            });

            req.io.emit("there.are", {
                who: storedData.store.query({})
            });
        });

        app.listen(process.env.PORT || 3000);
        console.log("Listening on port " + (process.env.PORT || 3000));
    });
};