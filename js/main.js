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
                    when: new Date().getTime()
                });
            }, 60000)

            socket.on("disconnect", function () {
                clearInterval(heartbeat);
            })
        });

        app.io.route("i.am", function (req) {
            req.io.respond({
                message: "'i.am' accepted"
            });

            storedData.store.put({
                "who": req.data.who,
                "when": req.data.when
            });

            req.io.join(req.data.who);

            if (storedData.store.get("Resource Monitor") != null) {
                app.io.room("Resource Monitor").broadcast("someone.joined", {
                    who: req.data.who,
                    when: req.data.when
                });
            }

            req.io.broadcast("he.is", {
                who: req.data.who,
                when: req.data.when
            });

            req.io.emit("you.are", {
                who: req.data.who,
                when: req.data.when
            });
        });

        app.io.route("i.am.no.more", function (req) {
            req.io.respond({
                message: "'i.am.no.more' accepted"
            });

            storedData.store.remove(req.data.who);

            req.io.leave(req.data.who);

            if (storedData.store.get("Resource Monitor") != null) {
                app.io.room("Resource Monitor").broadcast("someone.left", {
                    who: req.data.who,
                    when: req.data.when
                });
            }

            req.io.broadcast("he.is.no.more", {
                who: req.data.who,
                when: req.data.when
            });

            req.io.emit("you.are.no.more", {
                who: req.data.who,
                when: req.data.when
            });
        });

        app.io.route("heartbeat", function (req) {
            req.io.respond({
                message: "'heartbeat' accepted"
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
                message: "'tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what,
                when: req.data.when
            });
        });

        app.io.route("tell.someone", function (req) {
            req.io.respond({
                message: "'tell.someone' accepted"
            });

            if (storedData.store.get(req.data.whom) != null) {
                app.io.room(req.data.whom).broadcast("someone.said", {
                    who: req.data.who,
                    what: req.data.what,
                    when: req.data.when
                });
            }
        });

        app.io.route("who.are.there", function (req) {
            req.io.respond({
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