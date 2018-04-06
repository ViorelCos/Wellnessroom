angular.module('wellnessroom')
.service('Alerter', ['SweetAlert', function (SweetAlert) {
    function Alerter () {
    }

    Alerter.prototype.info = function (msg, cb) {
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }

        SweetAlert.swal({
            type: 'info',
            animation: 'fade',
            text: msg
        }).then(cb || function () {});
    };

    Alerter.prototype.warning = function (err, cb) {
        var message = err;

        if (typeof message === 'object') {
             message = message && (message.msg || message.data || message.statusText || (message.json && message.json.error_message) || message);
        }

        SweetAlert.swal({
            type: 'warning',
            animation: 'fade',
            text: message
        }).then(cb || function () {});
    };

    Alerter.prototype.error = function (err, cb) {
        var message = err;

        if (typeof message === 'object') {
             message = message && (message.msg || message.data || message.statusText || (message.json && message.json.error_message) || message);
        }

        SweetAlert.swal({
            type: 'error',
            animation: 'fade',
            text: message
        }).then(cb || function () {});
    };

    Alerter.prototype.confirm = function (message, cb) {
        SweetAlert.swal({
          title: 'Are you sure?',
          text: message,
          type: 'warning',
          showCancelButton: true,
          animation: 'fade',
          confirmButtonColor: '#7bd1df',
          cancelButtonColor: '#f55c5d',
          confirmButtonText: 'Yes, proceed!'
        }).then(cb);
    };

    return Alerter;
}]);
