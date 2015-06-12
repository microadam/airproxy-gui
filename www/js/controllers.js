window.angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $state) {
  $scope.groups = []

  if (window.Primus) {
    var primus = window.Primus.connect('http://localhost:8080')
    $scope.primus = primus

    primus.on('open', function () {

      primus.on('groups', function (groups) {
        $scope.$apply(function () {
          $scope.groups = groups
        })
      })

    })

    primus.on('error', function () {
      console.log('error:', arguments)
    })

  } else {
    $state.go('app.settings')
  }
})

.controller('GroupsListCtrl', function($scope) {
  $scope.newGroup = {}

  $scope.addGroup = function () {
    if ($scope.newGroup.name) {
      $scope.primus.send('newGroup', $scope.newGroup)
      delete $scope.newGroup.name
    }
  }

  $scope.destroyGroup = function (name) {
    $scope.primus.send('destroyGroup', { name: name })
  }

})

.controller('GroupCtrl', function($scope, $stateParams, $ionicModal) {

  var groupName = $stateParams.groupName

  $ionicModal.fromTemplateUrl('templates/manage-zones.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.manageZonesModal = modal
  })

  $scope.closeManageZones = function() {
    $scope.manageZonesModal.hide()
  }

  $scope.manageZones = function() {
    $scope.manageZonesModal.show()
  }

  $scope.onMasterVolumeChange = function (volume) {
    volume = Math.ceil(volume)
    var group = getGroup($scope.groups, groupName)
    group.zones.forEach(function (zone) {
      zone.volume = Math.ceil(zone.volumeMultiplier * volume)
    })
    $scope.primus.send('masterVolumeChange', { name: groupName, volume: volume })
  }

  $scope.onZoneVolumeChange = function (zoneName, volume) {
    var group = getGroup($scope.groups, groupName)
      , zones = group.zones.filter(function (zone) {
          if (zone.name === zoneName) {
            return zone
          }
        })
      , zone = zones[0]

    zone.volumeMultiplier = volume / group.volume
    $scope.primus.send('zoneVolumeChange', { name: zoneName, volume: volume })
  }

  $scope.onZoneStateChange = function (zoneName, enabled) {
    var data = { groupName: groupName, zoneName: zoneName, enabled: enabled }
    $scope.primus.send('zoneStateChange', data)
  }

  $scope.groupName = groupName
})

.controller('SettingsCtrl', function () {})

function getGroup(groups, groupName) {
  groups = groups.filter(function (group) {
    if (group.name === groupName) {
      return group
    }
  })
  return groups[0]
}
