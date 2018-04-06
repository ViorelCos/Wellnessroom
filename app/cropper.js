angular.module('wellnessroom')
.directive('cropper', [function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            client: '=',
            save: '='
        },
        link: function ($scope, el) {
            $scope.$watch('client', function (client) {
                if (!client) {
                    return;
                }

                $scope.myImage = client.image;
                $scope.myCroppedImage = ''; 

                var handleFileSelect = function (evt) {
                    var file = evt.currentTarget.files[0];
                    var reader = new FileReader();

                    reader.onload = function (evt) {
                        $scope.$apply(function ($scope){
                            $scope.myImage = evt.target.result;
                        });
                    };

                    reader.readAsDataURL(file);
                };

                $scope.saveImage = function () {
                    $scope.client.image = $scope.myCroppedImage;
                    window.angular.element('#cropperModal').modal('hide');
                    $scope.save();
                };

                angular.element(el.find('#fileInput')).on('change',handleFileSelect);
            });
        },
        templateUrl: '/views/cropper.html'
    };
}]);
