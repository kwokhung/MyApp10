define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/node!xml2js"
], function (declare, lang, xml2js) {
    return declare(null, {
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        xmlParse: function (req, res, next) {
            if (req.method != "POST") {
                return next();
            }

            /*if (connect.utils.mime(req) != "text/xml") {
                return next();
            }*/

            if (req._body) {
                return next();
            }

            req.body = req.body || {};
            req._body = true;

            var requestDataXml = "";

            req.setEncoding("utf8");

            req.on("data", function (data) {
                requestDataXml += data;
            });

            req.on("end", function () {
                xml2js.parseString(requestDataXml, { trim: true }, function (error, requestDataJson) {
                    if (error) {
                        error.status = 400;
                        next(error);
                    } else {
                        req.body = requestDataJson;
                        next();
                    }
                });
            });
        }
    });
});
