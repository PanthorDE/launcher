angular.module('App').controller('aboutCtrl', ['$scope', '$sce', ($scope, $sce) => {
  $scope.init = () => {
    fs.readFile('README.md', 'utf8', (err, data) => {
      if (!err) {
        $scope.aboutContent = $sce.trustAsHtml(marked(data))
        $scope.$apply()
        let ps = new PerfectScrollbar(document.querySelector('#aboutScroll'), {
          suppressScrollX: true,
          wheelSpeed: 0.5
        })
      } else {
        console.log(err)
      }
    })
  }
}])
