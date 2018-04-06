var conn = new Mongo();
var db = conn.getDB('wellnessroom');

var users = db.users.find();

users.forEach(function (user) {
    print(user.fullname);

    switch (user.timezoneOffset) {
        case -240:
            user.timezoneOffset = 'America/Halifax';
            break;
        case -300:
            user.timezoneOffset = 'America/Toronto';
            break;
        case -360:
            user.timezoneOffset = 'America/Atikokan';
            break;
        case -420:
            user.timezoneOffset = 'America/Edmonton';
            break;
        case -480:
            user.timezoneOffset = 'America/Vancouver';
            break;
        default:
            return;
    }

    user.save();
});
