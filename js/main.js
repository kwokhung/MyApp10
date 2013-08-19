var main = function () {
    require([
        "dojo/Deferred",
        "dojo/node!util",
        //"dojo/node!http",
        //"dojo/node!express",
        //"dojo/node!socket.io",
        "dojo/node!express.io",
        "dojo/node!cookie",
        "dojo/node!connect",
        "dojo/node!fs",
        "dojo/node!edge"
    ], function (Deferred, util, /*http, express, socketIO, */express, cookie, connect, fs, edge) {
        process.env.EDGE_SQL_CONNECTION_STRING = "Data Source=172.21.73.11;Initial Catalog=QP_ITS;User Id=dhs_internet;Password=d12e13;";

        var app = express();
        //var sessionStore = new express.session.MemoryStore();
        var sessionStore = new connect.middleware.session.MemoryStore;

        app.configure(function () {
            app.use(express.cookieParser());
            app.use(express.session({ secret: "secret", key: "express.sid", store: sessionStore }));
            /*app.use(function (req, res) {
                res.end('<h2>Hello, your session id is ' + req.sessionID + '</h2>');
            });*/
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
            req.session.loginDate = new Date().toString();
            //res.sendfile(__dirname + "/index.html");
            res.sendfile("./index.html");
        });

        app.get("/process", function (req, res) {
            res.send(util.inspect(process, { showHidden: false, depth: 2 }));
        });

        app.get("/directory", function (req, res) {
            fs.readdir("./", function (error, data) {
                if (error) {
                    res.send(util.inspect(error, { showHidden: false, depth: 2 }));
                }
                else {
                    res.send(util.inspect(data, { showHidden: false, depth: 2 }));
                }
            });
        });

        app.get("/hotIdeas", function (req, res) {
            var getTop10HotIdeas = edge.func('sql', function () {/*
                SELECT TOP 10 [ID]
                      ,[StockName]
                      ,[StockCode]
                  FROM [tblHotIdeas] where Language = 0
            */});

            getTop10HotIdeas(null, function (error, result) {
                if (error) {
                    res.send(util.inspect(error, { showHidden: false, depth: 2 }));
                }
                else {
                    res.send(util.inspect(result, { showHidden: false, depth: 2 }));
                }
            });
        });

        //var server = http.createServer(app);
        //var io = socketIO.listen(server);
        app.http().io();

        /*var io = app.io;
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
        });*/

        app.io.set("authorization", function (handshakeData, accept) {
            console.log("\n<<<<<authorization>>>>>\n" + util.inspect(handshakeData, { showHidden: false, depth: 2 }));

            if (handshakeData.headers.cookie) {
                //handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
                handshakeData.cookie = connect.utils.parseCookie(handshakeData.headers.cookie);
                /*handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie["express.sid"], "secret");

                if (handshakeData.cookie["express.sid"] == handshakeData.sessionID) {
                    return accept("Cookie is invalid.", false);
                }*/
                handshakeData.sessionID = handshakeData.cookie["express.sid"];
                handshakeData.sessionStore = sessionStore;

                sessionStore.load(handshakeData.sessionID, function (error, session) {
                    if (error || !session) {
                        return accept("No session got", false);
                    }

                    handshakeData.session = new connect.middleware.session.Session(handshakeData, session);

                    return accept(null, true);
                });
            } else {
                //return accept("No cookie transmitted.", false);
            }

            accept(null, true);
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

        app.io.route("i am", function (req) {
            req.io.respond({
                message: "'i am' accepted"
            });

            req.io.broadcast('he is', {
                who: req.data.who
            });

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
                req.io.emit("you are", {
                    who: req.data.who,
                    message: JSON.stringify(JSON.parse(data))
                });
            }, function (error) {
                req.io.emit("you are", {
                    message: error.message
                });
            });
        })

        app.io.route("tell other", function (req) {
            req.io.respond({
                message: "'tell other' accepted"
            });

            req.io.broadcast('someone said', {
                what: req.data.what
            });
        })

        //server.listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);
        console.log("Listening on port " + (process.env.PORT || 3000));
    });
};