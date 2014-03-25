;(function($) {
  var g = {
    id: 'geolocationpicker',
    latId: 'lat',
    lngId: 'lng',
    addressId: '',
    addressBtnId: '',
    centerLat: 22.541767,
    centerLng: 114.061332,
    markerLat: '',  // '' 为空，0 为 0
    markerLng: '',
    zoom: 14,
    mapTypeId: 'roadmap',
    evilTransform: true,
    geoLocation: true,  // 使用定位功能
    autoLocation: false,  // TODO: 载入时自动定位
    canDelete: true // 可以删除标记
  };
  var map, status, marker, geocoder, centerLatLng;
  var leave = false, enable = true, change = true;
  var info, infoLat, infoLng, infoAddr, addr = '';
  // @see: http://code.google.com/intl/zh-CN/apis/chart/infographics/docs/dynamic_icons.html
  var imgCurrent = '<img alt="当前" src="https://chart.googleapis.com/chart?chst=d_simple_text_icon_left&chld=%E5%BD%93%E5%89%8D|12|000|glyphish_map-marker|16|000|FFF" width="39" height="16" />';
  var imgLocation = '<img alt="定位" src="https://chart.googleapis.com/chart?chst=d_simple_text_icon_left&chld=%E5%AE%9A%E4%BD%8D|12|000|glyphish_location|16|000|FFF" width="46" height="16" />';
  var msgNew = '尚未选择位置，请在地图上直接点击。';
  var msgUpdate = '请在地图上直接点击或拖动位置图标改变位置。单击查看';
  var msgDelete = '删除';
  var msgLocation = '也可以点击“定位”确定位置。';
  var msgLeave = '可以点击“当前”回到选择的位置。';
  var message = function(type, msg) {
    if (status == undefined)
      return;
    status.className = 'geo-status-' + type;
    status.innerHTML = msg;
  };
  var location = function() {
    message('notice', '正在定位...');
    enableMarker(false);
    $.geolocation(function(error, lat, lng) {
      if (error == '') {
        if (g.evilTransform) {
          setInputVal(lat, lng);
          message('notice', '正在转换...');
          data = $.eviltransform.wgs2gcj(lat, lng);
          var latLng = new google.maps.LatLng(data.lat, data.lng);
          map.setCenter(latLng);
          setMarker(latLng, true);
          message('success', msgUpdate);
          enableMarker(true);
        } else {
          var latLng = new google.maps.LatLng(lat, lng);
          map.setCenter(latLng);
          setMarker(latLng);
          enableMarker(true);
        }
      } else {
        message('error', error);
        enableMarker(true);
      }
    });
  };
  var setCenter = function() {
    if (marker == null)
      map.setCenter(centerLatLng);
    else
      map.setCenter(marker.getPosition());
  };
  var Toolbar = function(bar) {
    bar.className = 'geo-bar';

    var cur = document.createElement('DIV');
    cur.className = 'geo-tool';
    cur.title = '地图居中显示当前选择的位置';
    cur.innerHTML = imgCurrent;
    bar.appendChild(cur);

    google.maps.event.addDomListener(cur, 'click', setCenter);

    if (g.geoLocation) {
      msgNew += msgLocation;
      var loc = document.createElement('DIV');
      loc.className = 'geo-tool geo-tool-last';
      loc.title = '自动确定您现在所在的位置';
      loc.innerHTML = imgLocation;
      bar.appendChild(loc);

      google.maps.event.addDomListener(loc, 'click', location);
    } else
      cur.className += ' geo-tool-last';
  };
  var Status = function(bar) {
    bar.className = 'geo-bar';
    status = document.createElement('DIV');
    status.className = 'geo-status-notice';
    status.innerHTML = '&nbsp;';
    bar.appendChild(status);
  };
  var initBar = function() {
    var toolbar = document.createElement('DIV');
    new Toolbar(toolbar);
    toolbar.index = 1;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(toolbar);
    var status = document.createElement('DIV');
    new Status(status);
    status.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(status);
  };
  var setInputVal = function(lat, lng) {
    change = true;
    $('#' + g.latId).val(lat).trigger('change');
    $('#' + g.lngId).val(lng).trigger('change');
    message('success', msgUpdate);
  };
  var getInputVal = function(todo) {
    if (!$.isFunction(todo))
      return;
    todo($('#' + g.latId).val(), $('#' + g.lngId).val());
  };
  var setInput = function() {
    var latLng = marker.getPosition();
    if (g.evilTransform) {
      data = $.eviltransform.gcj2wgs_exact(latLng.lat(), latLng.lng());
      setInputVal(data.lat, data.lng);
    } else
      setInputVal(latLng.lat(), latLng.lng());
  };
  var enableMarker = function(status) {
    if (enable == status)
      return;
    enable = status;
    if (marker == null)
      return;
    marker.setDraggable(enable);
  };
  var delMarker = function(event) {
    event.preventDefault(); // 阻止事件冒泡
    event.stopPropagation();
    if (g.canDelete && confirm('要删除当前位置设置么？')) {
      marker.setMap(null);
      marker = null;
      setInputVal('', '');
      message('notice', msgNew);
    }
    return false;
  };
  var viewMarker = function() {
    if (info == null) {
      info = new google.maps.InfoWindow();
      var list = document.createElement('UL');
      list.className = 'geo-info';
      var item = document.createElement('LI');
      var name = document.createElement('B');
      name.innerHTML = '经度：';
      infoLng = document.createElement('SPAN');
      item.appendChild(name);
      item.appendChild(infoLng);
      list.appendChild(item);
      item = document.createElement('LI');
      name = document.createElement('B');
      name.innerHTML = '纬度：';
      infoLat = document.createElement('SPAN');
      item.appendChild(name);
      item.appendChild(infoLat);
      list.appendChild(item);
      item = document.createElement('LI');
      name = document.createElement('B');
      name.innerHTML = '地址：';
      infoAddr = document.createElement('SPAN');
      item.appendChild(name);
      item.appendChild(infoAddr);
      list.appendChild(item);
      if (g.canDelete) {
        item = document.createElement('LI');
        item.className = 'geo-last';
        var btn = document.createElement('BUTTON');
        btn.innerHTML = '删除位置';
        google.maps.event.addDomListener(btn, 'click', delMarker);
        item.appendChild(btn);
        list.appendChild(item);
      }
      info.setContent(list);
    }
    getInputVal(function(lat, lng) {
      infoLat.innerHTML = lat;
      infoLng.innerHTML = lng;
    });
    if (change) {
      infoAddr.innerHTML = '正在查询...<BR><BR>';
      if (geocoder == null)
        geocoder = new google.maps.Geocoder();
      geocoder.geocode({latLng: marker.getPosition()}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            addr = results[0].formatted_address;
            infoAddr.innerHTML = addr;
            change = false;
          }
        }
      });
    } else
      infoAddr.innerHTML = addr;
    info.open(map, marker);
  };
  var setMarker = function(latLng, nochange) {
    if (marker == null) {
      var size = new google.maps.Size(39, 34);
      marker = new google.maps.Marker({
        position: latLng,
        icon: new google.maps.MarkerImage('http://ditu.google.cn/mapfiles/arrow.png', size),
        shadow: new google.maps.MarkerImage('http://ditu.google.cn/mapfiles/arrowshadow.png', size),
        draggable: true,
        map: map
      });
      google.maps.event.addListener(marker, 'dragend', setInput);
      google.maps.event.addListener(marker, 'click', viewMarker);
      //google.maps.event.addListener(marker, 'dblclick', delMarker);
    } else
      marker.setPosition(latLng);
    message('notice', msgUpdate);
    if (nochange != undefined)
      return;
    setInput();
  };
  var initMarker = function() {
    if (g.canDelete)
      msgUpdate += msgDelete + '。';
    else
      msgUpdate += '。';
    if (g.canDelete && g.markerLat === '' && g.markerLng === '') {
      marker = null;
      message('notice', msgNew);
    } else
      setMarker(new google.maps.LatLng(g.markerLat, g.markerLng), true);
  };
  var initAddress = function () {
    $('#' + g.addressBtnId).unbind('click').bind('click', function (){
      var address = $('#' + g.addressId);
      if (address.val() === '') {
        address.focus();
        return false;
      }
      if (geocoder == null)
        geocoder = new google.maps.Geocoder();
      geocoder.geocode({address: address.val()}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            var latLng = results[0].geometry.location;
            map.setCenter(latLng);
            setMarker(latLng);
          }
        }
      });
    });
  };
  var checkLeave = function() {
    if (marker != null) {
      if (!map.getBounds().contains(marker.getPosition())) {
        if (!leave)
          message('notice', msgLeave);
        leave = true;
      } else {
        if (leave)
          message('notice', msgUpdate);
        leave = false;
      }
    } else
      leave = false;
  };
  var init = function() {
    var div = $('#' + g.id);
    centerLatLng = new google.maps.LatLng(g.centerLat, g.centerLng);
    map = new google.maps.Map(div[0], {
      center: centerLatLng,
      zoom: g.zoom,
      mapTypeId: g.mapTypeId
    });
    initBar();
    initMarker();
    initAddress();
    google.maps.event.addListener(map, 'click', function(event) {
      if (enable)
        setMarker(event.latLng);
    });
    google.maps.event.addListener(map, 'bounds_changed', checkLeave);
    div.bind('resize', function() {
      google.maps.event.trigger(map, 'resize');
      setCenter();
    });
  };
  $.extend($, {
    geolocationpicker: function(options) {
      g = $.extend(g, options || {});
      if (g.geoLocation)
        g.geoLocation = $.isFunction($.geolocation) ? $.geolocation() : false;
      if (g.evilTransform)
        g.evilTransform = $.isPlainObject($.eviltransform);
      init();
    }
  });
})(jQuery);
