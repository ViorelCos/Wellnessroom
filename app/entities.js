angular.module('wellnessroom')
.service('Entities', ['$rootScope', '$http', '$timeout', 'handler', function ($rootScope, $http, $timeout, handler) {
    var entities = [];

    function Entities () {
        this.started = false;
        this.listeners = [];

        entities.push(this);
    }

    Entities.prototype.subscribeAndStart = function (serviceProvider, array, cb) {
        this.serviceProvider = serviceProvider;

        var self = this;
        this.array = array; // In order to clean on stop
        this.addListener(function (entities) {
            self.populate(array, entities);
            cb();
        });
        this.start();

        if (!this.allEntities) {
            this.all(function (err, entities) {
                if (err) {
                    return handler(err);
                }

                self.populate(array, entities);
                cb(null, this.allEntities);
            });
        } else {
            this.populate(array, this.allEntities);
            cb(null, this.allEntities);
        }
    };

    Entities.prototype.start = function () {
        if (this.started) {
            return;
        }

        this.started = true;
        this.poll();
    };

    Entities.prototype.stop = function () {
        if (!this.started) {
            return;
        }

        this.array.splice(0, this.array.length);
        this.started = false;
        this.listeners = [];
        this.allEntities = null;
    };

    Entities.prototype.all = function (cb) {
        if (this.allEntities) {
            return cb(null, this.allEntities);
        }

        this.sync(cb);
    };

    Entities.prototype.sync = function (cb) {
        var self = this;

        if (!this.serviceProvider._id) {
            // Retry in 1 seconds
            return $timeout(function () {
                self.sync(cb);
            }, 1000);
        }

        var query = encodeURIComponent(JSON.stringify({
            serviceProvider: this.serviceProvider._id
        }));

        $http.get(this.endpoint + '?q=' + query)
            .then(function (result) {
                self.allEntities = Object.values(result.data.reduce(function (acc, entity) {
                    var key = entity.time || entity.slot;
                    if (acc[key]) {
                        acc[key] = entity.creationDate > acc[key].creationDate ? entity : acc[key];
                    } else {
                        acc[key] = entity;
                    }
                    return acc;
                }, {}));
                cb(null, self.allEntities);
            })
            .catch(cb);
    };

    Entities.prototype.poll = function () {
        var self = this;

        if (!this.serviceProvider._id) {
            // Retry in 1 seconds
            return $timeout(function () {
                self.poll();
            }, 1000);
        }

        $http.get('/longpoll?serviceprovider=' + this.serviceProvider._id + '&collection=' + this.entityName)
            .then(function (result) {
                if (result.data[self.entityName]) {
                    self.sync(function (err) {
                        if (err) {
                            return handler(err);
                        }

                        self.notifyAll();
                    });
                }
                self.poll();
            })
            .catch(function (err) {
                console.log(err);
                // Retry in 10 seconds
                $timeout(function () {
                    self.poll();
                }, 10000);
            });
    };

    Entities.prototype.addListener = function (listener) {
        this.listeners.push(listener);
    };

    Entities.prototype.populate = function (array, values) {
        array.splice(0, array.length);
        Object.assign(array, values);
    };

    Entities.prototype.notifyAll = function () {
        var self = this;
        this.listeners.forEach(function (listener) {
            listener(self.allEntities);
        });
    };

    $rootScope.$on('$locationChangeSuccess', function () {
        entities.forEach(function (entity) {
            entity.stop();
        });
        entities = [];
    });

    return Entities;
}]);
