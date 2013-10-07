define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "app/util/StoredData"
], function (declare, lang, StoredData) {
    return declare("app.util.ResourceHelper", null, {
        app: null,
        storedData: new StoredData({
            storeLabel: "Resource",
            storeIdentifier: "who"
        }),
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        handleIAm: function (req) {
            if (this.storedData.store.get(req.data.whoAmI) != null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' accepted"
                });

                this.storedData.store.put({
                    "who": req.data.whoAmI,
                    "when": req.data.when
                });

                req.io.join(req.data.whoAmI);

                if (this.storedData.store.get("Resource Monitor") != null) {
                    this.app.io.room("Resource Monitor").broadcast("someone.joined", {
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
        },
        handleIAmNoMore: function (req) {
            if (this.storedData.store.get(req.data.whoAmI) == null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' accepted"
                });

                this.storedData.store.remove(req.data.whoAmI);

                req.io.leave(req.data.whoAmI);

                if (this.storedData.store.get("Resource Monitor") != null) {
                    this.app.io.room("Resource Monitor").broadcast("someone.left", {
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
        },
        handleHeartbeat: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") heartbeat' accepted"
            });

            if (this.storedData.store.get(req.data.who) != null) {
                this.storedData.store.get(req.data.who).when = req.data.when;
            }

            if (this.storedData.store.get("Resource Monitor") != null) {
                this.app.io.room("Resource Monitor").broadcast("someone.beat", {
                    who: req.data.who,
                    when: req.data.when
                });
            }
        },
        handleTellOther: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what,
                when: req.data.when
            });
        },
        handleTellSomeone: function (req) {
            if (this.storedData.store.get(req.data.whom) == null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' accepted"
                });

                this.app.io.room(req.data.whom).broadcast("someone.said", {
                    who: req.data.who,
                    what: req.data.what,
                    when: req.data.when
                });
            }
        },
        handleWhoAreThere: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") who.are.there' accepted"
            });

            req.io.emit("there.are", {
                who: this.storedData.store.query({})
            });
        }
    });
});
