module.exports = {
    removeByProp: removeByProp
};

function removeByProp (model, prop, vals, cb) {
    var removeQuery = {
    };
    removeQuery[prop] = {
        $in: vals
    };
    model.remove(removeQuery, cb);
}
