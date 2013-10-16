dojoConfig = {
    baseUrl: __dirname + "/",
    async: 1,
    hasCache: {
        "host-node": 1,
        "dom": 0
    },
    packages: [{
        name: "dojo",
        location: "dojo/dojo-release-1.9.1-src/dojo"
    }, {
        name: "app",
        location: "app"
    }, {
        name: "root",
        location: "."
    }],
    deps: [
        "root/main"
    ]
};