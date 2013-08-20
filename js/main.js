var main = function () {
    require([
        "dojo/Deferred",
        "dojo/node!util",
        "dojo/node!express.io"
    ], function (Deferred, util, express) {
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
                socket.emit("heartbeat", new Date().getTime());
            }, 60000)

            socket.on("disconnect", function () {
                clearInterval(heartbeat);
            })
        });

        app.io.route("i am", function (req) {
            req.io.respond({
                message: "'i am' accepted"
            });

            req.io.broadcast('he is', {
                who: req.data.who
            });

            req.io.emit("you are", {
                who: req.data.who,
                message: JSON.stringify(JSON.parse(data))
            });
        });

        app.io.route("tell other", function (req) {
            req.io.respond({
                message: "'tell other' accepted"
            });

            req.io.broadcast('someone said', {
                what: req.data.what
            });
        });

        app.listen(process.env.PORT || 3000);
        console.log("Listening on port " + (process.env.PORT || 3000));
    });
};