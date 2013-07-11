var main = function () {
    require([
        "dojo/Deferred",
        "dojo/node!http",
        "dojo/node!express",
        "dojo/node!socket.io",
        "dojo/node!fs"
    ], function (Deferred, http, express, socketIO, fs) {
        var app = express();
        app.get("/", function (req, res) {
            res.send("<h1>Hello World</h1>");
        });

        var server = http.createServer(app);
        server.listen(process.env.PORT || 3000);

        var io = socketIO.listen(server);
        var nicknames = {};

        io.sockets.on("connection", function (socket) {
            socket.on("user message", function (msg) {
                socket.broadcast.emit("user message", socket.nickname, msg);
            });

            socket.on("nickname", function (nickname, callback) {
                if (nicknames[nickname]) {
                    try {
                        callback(nickname, true);
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                } else {
                    try {
                        callback(nickname, false);
                    }
                    catch (ex) {
                        console.error(ex);
                    }

                    nicknames[nickname] = socket.nickname = nickname;
                    socket.broadcast.emit("announcement", nickname + " connected");
                    io.sockets.emit("nicknames", nicknames);
                }
            });

            socket.on("disconnect", function () {
                if (!socket.nickname) return;

                delete nicknames[socket.nickname];
                socket.broadcast.emit("announcement", socket.nickname + " disconnected");
                socket.broadcast.emit("nicknames", nicknames);
            });
        });

        console.log("Listening on port " + (process.env.PORT || 3000));

        (function (filename) {
            var deferred = new Deferred();

            fs.readFile(filename, function (error, data) {
                if (error) {
                    deferred.reject(error);
                }
                else {
                    deferred.resolve(data);
                }
            });

            return deferred.promise;
        })("resource/json/helloworld.json").then(function (data) {
            console.log(JSON.parse(data));
        }, function (error) {
            console.error(error.message);
        });
    });
};