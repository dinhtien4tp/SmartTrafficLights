
var ObjectId = require('mongodb').ObjectID;
var config = require('../config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('nodes');

var service = {};
service.getById = getById;
service.create = create;
service.update = update;
service.getAll = getAll;

module.exports = service;

function getById(_id) {
    var deferred = Q.defer();
    db.nodes.find({_id: mongo.helper.toObjectID(_id)}).toArray(function (err, arr) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(arr[0]);
        }
    })
    return deferred.promise;
}

function create(node) {
    var deferred = Q.defer();
    node = _.omit(node, ["$$hashKey", "idx", "vehicle"]);
    for (var i = 0; i < node.relation.length; i++) {
        if(node.relation[i].speed == 0) {
            node.relation[i].speed = 400 * 1000;
        }
    }
    
    db.nodes.insert(
        node,
        function (err, doc) {
            if (err) {
                deferred.reject(err.name + ': ' + err.message);
            }
            deferred.resolve();
        }
    );
    return deferred.promise;
}

function update(_id, node) {
    var deferred = Q.defer();
    node = _.omit(node, ["_id", "$$hashKey", "idx", "vehicle"]);
    for (var i = 0; i < node.relation.length; i++) {
        if(node.relation[i].speed == 0) {
            node.relation[i].speed = 400 * 1000;
        }
    }
    
    db.nodes.update({_id: mongo.helper.toObjectID(_id)}, node,
        function (err, doc) {
            if (err) {
                deferred.reject(err.name + ': ' + err.message);
            }
            deferred.resolve(doc);
        }
    );
    return deferred.promise;
}

function getAll() {
    var deferred = Q.defer();
	db.nodes.find({}).toArray(function(err, arr) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(arr);
        }
    });

    return deferred.promise;
}