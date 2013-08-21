var main = function () {
    require([
        "dojo/node!util",
        "dojo/node!express.io",
        "app/util/StoredData"
    ], function (util, express, StoredData) {
        var storedData = new StoredData({
            storeLabel: "Resource"
        });

        var app = express();

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
                    time: new Date().getTime()
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

            storedData.store.put({ "id": req.data.who });

            req.io.join(req.data.who);

            if (storedData.store.get("Resource Monitor") != null) {
                app.io.room("Resource Monitor").broadcast("someone.joined", {
                    who: req.data.who
                });
            }

            req.io.broadcast("he.is", {
                who: req.data.who
            });

            req.io.emit("you.are", {
                who: req.data.who
            });
        });

        app.io.route("who.are.there", function (req) {
            req.io.respond({
                message: "'who.are.there' accepted"
            });

            req.io.emit("they.are", {
                who: storedData.store.query({})
            });
        });

        app.io.route("tell.other", function (req) {
            req.io.respond({
                message: "'tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what
            });
        });

        app.listen(process.env.PORT || 3000);
        console.log("Listening on port " + (process.env.PORT || 3000));
    });
};