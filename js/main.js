var main = function () {
    require([
        "dojo/Deferred",
        "dojo/node!util",
        "dojo/node!express.io",
        "dojo/node!edge"
    ], function (Deferred, util, express, edge) {
        var app = express();

        app.configure(function () {
            app.use(function (req, res) {
                res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
            });
        });

        app.get("/", function (req, res) {
            var helloWorld = edge.func("cs", function () {/*
                async (input) => {
                    return ".NET Welcomes " + input.ToString();
                }
            */});

            helloWorld("node.js", function (error, result) {
                if (error) {
                    res.send(util.inspect(error, { showHidden: false, depth: 2 }));
                }
                else {
                    res.send(result);
                }
            });

        });

        app.get("/index.html", function (req, res) {
            //res.sendfile(__dirname + "/index.html");
            res.sendfile("./index.html");
        });

        app.get("/process", function (req, res) {
            res.send(util.inspect(process, { showHidden: false, depth: 2 }));
        });

        app.http().io();

        app.io.set("authorization", function (handshakeData, accept) {
            console.log("\n<<<<<authorization>>>>>\n" + util.inspect(handshakeData, { showHidden: false, depth: 2 }));

            return accept(null, true);
        });

        app.io.on("connection", function (socket) {
            console.log("\n<<<<<connection>>>>>\n" + util.inspect(socket.handshake, { showHidden: false, depth: 2 }));

            var sender = setInterval(function () {
                socket.emit("data", new Date().getTime());
            }, 1000)

            socket.on("disconnect", function () {
                clearInterval(sender);
            })
        });

        app.listen(process.env.PORT || 3000);
        console.log("Listening on port " + (process.env.PORT || 3000));
    });
};