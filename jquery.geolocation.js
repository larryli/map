;(function($) {
  var settings = {
    options: {
      timeout: 5000,
      maximumAge: 100
    }
  };
  
  var busy = false;
  var lat, lng, doneFunc;
  var error = '';
  
  var done = function() {
    busy = false;
    if ($.isFunction(doneFunc))
      doneFunc(error, lat, lng);
  };
  
  var get = function() {
    if (busy) {
      error = '正在获取位置。请等待定位完成。';
      return;
    }
    if (navigator.geolocation) {
      busy = true;
      navigator.geolocation.getCurrentPosition( function(pos) {
        if (pos != null && pos.coords != null)
          if (pos.coords.longitude != null && pos.coords.latitude != null) {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            done();
            return;
          }
        error = '没有获取到定位的经纬度。';
        done();
      }, function(err) {
        if (err.code == err.TIMEOUT)
          error = '获取地址信息超时。请稍后重试。';
        else if (err.code == err.PERMISSION_DENIED)
          error = '你拒绝提供地址信息。如果操作错误，请修改有关设置刷新页面。';
        else if (err.code == err.POSITION_UNAVAILABLE)
          error = '无法获取地址信息。请稍后重试。';
        else
          error = '未知错误。请稍后重试。';
        done();
      },
      settings.options);
    } else {
      error = '浏览器不支持地址定位功能。';
      done();
    }
  };
  
  $.extend($, {
    geolocation: function(arg1, arg2) {
      if ($.isFunction(arg1)) {
        doneFunc = arg1;
        get();
      } else if ($.isFunction(arg2)) {
        settings = $.extend(settings, arg1 || {});
        doneFunc = arg2;
        get();
      } else
        return (navigator.geolocation != undefined);
    }
  });

})(jQuery);
