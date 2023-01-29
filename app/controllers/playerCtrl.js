angular.module('App').controller('playerCtrl', ['$scope', '$rootScope', ($scope, $rootScope) => {
  $scope.init = () => {
    let ps = new PerfectScrollbar(document.querySelector('#playerScroll'), {
      suppressScrollX: true,
      wheelSpeed: 0.5
    })
  }
}])
