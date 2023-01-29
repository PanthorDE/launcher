angular.module('App').controller('settingsCtrl', ['$scope', '$rootScope', ($scope, $rootScope) => {
  $scope.init = () => {
    storage.get('settings', (err, data) => {
      if (err) {
        $scope.loaded = true
        throw err
      }
      $rootScope.ArmaPath = data.armapath
      $scope.splash = data.splash
      if ($scope.splash) {
        $('#splashCheck').iCheck('check')
      }
      $scope.intro = data.intro
      if ($scope.intro) {
        $('#introCheck').iCheck('check')
      }
      $scope.ht = data.ht
      if ($scope.ht) {
        $('#htCheck').iCheck('check')
      }
      $scope.windowed = data.windowed
      if ($scope.windowed) {
        $('#windowedCheck').iCheck('check')
      }
      $scope.add_params = data.add_params
      $scope.loaded = true
    })
  }

  $('#splashCheck').on('ifChecked', () => {
    if ($scope.loaded) {
      $scope.splash = true
      $scope.saveSettings()
    }
  }).on('ifUnchecked', () => {
    if ($scope.loaded) {
      $scope.splash = false
      $scope.saveSettings()
    }
  })

  $('#introCheck').on('ifChecked', () => {
    if ($scope.loaded) {
      $scope.intro = true
      $scope.saveSettings()
    }
  }).on('ifUnchecked', () => {
    if ($scope.loaded) {
      $scope.intro = false
      $scope.saveSettings()
    }
  })

  $('#htCheck').on('ifChecked', () => {
    if ($scope.loaded) {
      $scope.ht = true
      $scope.saveSettings()
    }
  }).on('ifUnchecked', () => {
    if ($scope.loaded) {
      $scope.ht = false
      $scope.saveSettings()
    }
  })

  $('#windowedCheck').on('ifChecked', () => {
    if ($scope.loaded) {
      $scope.windowed = true
      $scope.saveSettings()
    }
  }).on('ifUnchecked', () => {
    if ($scope.loaded) {
      $scope.windowed = false
      $scope.saveSettings()
    }
  })

  $scope.saveSettings = () => {
    storage.set('settings', {
      armapath: $rootScope.ArmaPath,
      splash: $scope.splash,
      intro: $scope.intro,
      ht: $scope.ht,
      windowed: $scope.windowed,
      add_params: $scope.add_params
    }, (err) => {
      if (err) throw err
    })
  }

  $scope.chooseArmaPath = () => {
    let dpath = String(dialog.showOpenDialog({
      filters: [{
        name: 'Arma 3 exe',
        extensions: ['exe']
      }],
      title: 'Bitte wähle eine der Arma 3 exen aus',
      properties: ['openFile']
    }))
    if (dpath !== 'undefined' && dpath.includes('arma3') && dpath.includes('.exe')) {
      $rootScope.ArmaPath = dpath.substring(0, dpath.lastIndexOf('\\')) + '\\'
      $scope.saveSettings()
      $rootScope.refresh(false)
    } else {
      $rootScope.ArmaPath = ''
      $scope.saveSettings()
    }
  }

  $scope.uploadRPT = () => {
    $rootScope.uploadingRPT = true
    if ($rootScope.logged_in) {
      ipcRenderer.send('to-web', {
        type: 'upload_rpt',
        pid: $rootScope.player_data.pid
      })
    } else {
      ipcRenderer.send('to-web', {
        type: 'upload_rpt',
        pid: 0
      })
    }
  }

  $scope.openMPCache = () => {
    shell.showItemInFolder(path.join(app.getPath('appData'), '..', 'Local', 'Arma 3', 'MPMissionsCache', 'x'))
  }

  $scope.startA3Verify = () => {
    shell.openExternal('steam://validate/107410')
  }
}])
