require("./js/config.js");
require("./js/dojo/dojo-release-1.9.1-src/dojo/dojo.js");

global.require([
    "root/main"
], function (main) {
    main();
});