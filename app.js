(function() {
  var debugPane, gesturePane, visuPanes, pauseAnimations, quickScroll, scrollToTop, _animationsPaused, _debug, _visu, _defaultAnimationPauseMs, _sentMessage, _smoothingFactor, _translationFactor;

  _translationFactor = 20;

  _smoothingFactor = 4;

  _debug = false;

  _animationsPaused = false;

  _defaultAnimationPauseMs = 200;

  _sentMessage = false;

  if (_debug) {
    debugPane = document.createElement('div');
    debugPane.style.backgroundColor = 'rgba(255,255,255,0.7)';
    debugPane.style.bottom = '10px';
    debugPane.style.left = '10px';
    debugPane.style.position = 'fixed';
    document.body.appendChild(debugPane);
    gesturePane = document.createElement('div');
    gesturePane.style.backgroundColor = 'rgba(255,255,255,0.7)';
    gesturePane.style.top = '10px';
    gesturePane.style.left = '10px';
    gesturePane.style.position = 'fixed';
    document.body.appendChild(gesturePane);
  }

  //VISU
  var maxFingers = 5;
  var visuRadius = 15;

  //click
  var event;

  _visu = true;

  visuPanes = {};

  if(_visu) {
    for (var index = 0; index < maxFingers; index++) {
      var visuPane = document.createElement('canvas');
      visuPane.width = visuRadius*2.5;
      visuPane.height = visuRadius*2.5;
      var context = visuPane.getContext('2d');
      var centerX = visuPane.width / 2;
      var centerY = visuPane.height / 2;

      context.beginPath();
      context.arc(centerX, centerY, visuRadius, 0, 2 * Math.PI, false);
      context.fillStyle = "rgba(0, 255, 0, 0.4)";
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = "rgba(0, 255, 0, 0.9)";
      context.stroke();

      visuPane.id = index;
      visuPane.style.top = '-100px';
      visuPane.style.left = '-100px';
      visuPane.style.zIndex = 99999;
      visuPane.style.position = 'fixed';
      document.getElementsByTagName('body')[0].appendChild(visuPane);
      visuPanes[index] = visuPane;
    }
  }

  var myWidth = 0, myHeight = 0;

  if( typeof( window.innerWidth ) == 'number' ) {
    myWidth = window.innerWidth/2;
    myHeight = window.innerHeight/2;
  } 

  chrome.runtime.sendMessage({
    init_script: true
  });

  //previous frame
  var previousFrame, previousRefresh, previousSwipe;
  previousRefresh = 0;
  previousSwipe = 0;
  //controller option
  var controllerOptions = {enableGestures: true};

  Leap.loop(controllerOptions, function(frame) {
    var direction, duration, fingers, firstGesture, hands, speed, state, type, verticalDistance;

    if (!_sentMessage) {
      chrome.runtime.sendMessage({
        has_leap: true
      });
      _sentMessage = true;
    }
    if (_debug) {
      debugPane.innerHTML = frame.dump();
    }
    if (_visu) {
      hideVisu();
    }

    for (var index = 0; index < frame.pointables.length; index++) {
      var pointable = frame.pointables[index];
      var pos = pointable.tipPosition;
      if (_visu) {
        var posx = pos.x/100*myWidth + myWidth;
        var posy = -(pos.y/100*myHeight - myHeight)+2*myHeight;
        visuPanes[index].style.top =  posy + 'px';
        visuPanes[index].style.left = posx + 'px';


        if(frame.pointables.length <= 2 && index == 1){
          var context = visuPanes[index].getContext('2d');
          var centerX = visuPanes[index].width / 2;
          var centerY = visuPanes[index].height / 2;
          context.clearRect ( 0 , 0 , visuPanes[index].width , visuPanes[index].height );
          context.beginPath();
          context.arc(centerX, centerY, visuRadius, 0, 2 * Math.PI, false);
          context.fillStyle = "rgba(255, 0, 0, 0.4)";
          context.fill();
          context.lineWidth = 3;
          context.strokeStyle = "rgba(255, 0, 0, 0.9)";
          context.stroke();

        }else{

          var context = visuPanes[index].getContext('2d');
          var centerX = visuPanes[index].width / 2;
          var centerY = visuPanes[index].height / 2;
          context.clearRect ( 0 , 0 , visuPanes[index].width , visuPanes[index].height );
          context.beginPath();
          context.arc(centerX, centerY, visuRadius, 0, 2 * Math.PI, false);
          context.fillStyle = "rgba(0, 255, 0, 0.4)";
          context.fill();
          context.lineWidth = 3;
          context.strokeStyle = "rgba(0, 255, 0, 0.9)";
          context.stroke();
        }
      }
    }

     //Move previous

     if (previousFrame) {
      var translation = frame.translation(previousFrame);
    //frameString += "Translation: " + vectorToString(translation) + " mm <br />";

    var rotationAxis = frame.rotationAxis(previousFrame);
    var rotationAngle = frame.rotationAngle(previousFrame);
    //frameString += "Rotation axis: " + vectorToString(rotationAxis, 2) + "<br />";
    //frameString += "Rotation angle: " + rotationAngle.toFixed(2) + " radians<br />";

    var scaleFactor = frame.scaleFactor(previousFrame);
    //frameString += "Scale factor: " + scaleFactor.toFixed(2) + "<br />";
  }

  var hand;
     //HAND 
     if (frame.hands.length > 0) {
      for (var i = 0; i < frame.hands.length; i++) {
        hand = frame.hands[i];

      // Hand motion factors
      if (previousFrame) {
        var translation = hand.translation(previousFrame);
        //handString += "Translation: " + vectorToString(translation) + " mm<br />";

        var rotationAxis = hand.rotationAxis(previousFrame, 2);
        var rotationAngle = hand.rotationAngle(previousFrame);
        //handString += "Rotation axis: " + vectorToString(rotationAxis) + "<br />";
        //handString += "Rotation angle: " + rotationAngle.toFixed(2) + " radians<br />";

        var scaleFactor = hand.scaleFactor(previousFrame);
        //handString += "Scale factor: " + scaleFactor.toFixed(2) + "<br />";
      }

      // IDs of pointables (fingers and tools) associated with this hand
      if (hand.pointables.length > 0) {
        var fingerIds = [];
        var toolIds = [];

        if( hand.pointables.length == 5 ){
          if (previousFrame) {
            var translation = hand.translation(previousFrame);
            previousFrame = frame;
            return scroll(translation.x,translation.y);
          }
        }

        for (var j = 0; j < hand.pointables.length; j++) {
          var pointable = hand.pointables[j];
          if (pointable.tool) {
            toolIds.push(pointable.id);
          }
          else {
            fingerIds.push(pointable.id);
          }
        }
        if (fingerIds.length > 0) {
          //handString += "Fingers IDs: " + fingerIds.join(", ") + "<br />";
        }
        if (toolIds.length > 0) {
          //handString += "Tools IDs: " + toolIds.join(", ") + "<br />";
        }
      }
    }
  }


  //GESTURE
  if (frame.gestures.length > 0) {
    for (var i = 0; i < frame.gestures.length; i++) {
      var gesture = frame.gestures[i];

      switch (gesture.type) {
        case "circle":
        if( hand.pointables.length == 1 ){
          if( gesture.duration > 1000000 ){
            //useless, previousRefresh save in cookie before
            if(frame.timestamp - previousRefresh > 1000000){
              previousRefresh = frame.timestamp;
              return refresh();
            }
          }
        }
         /* gestureString += "center: " + vectorToString(gesture.center) + " mm, "
                        + "normal: " + vectorToString(gesture.normal, 2) + ", "
                        + "radius: " + gesture.radius.toFixed(1) + " mm, "
                        + "progress: " + gesture.progress.toFixed(2) + " rotations";*/
                        break;
                        case "swipe":
          /*gestureString += "start position: " + vectorToString(gesture.startPosition) + " mm, "
                        + "current position: " + vectorToString(gesture.position) + " mm, "
                        + "direction: " + vectorToString(gesture.direction, 2) + ", "
                        + "speed: " + gesture.speed.toFixed(1) + " mm/s";*/
                        if(frame.timestamp - previousSwipe > 1000000){
                        var distance = gesture.position.x-gesture.startPosition.x;
                        //alert(distance);
                        if(distance <= -100){
                          previousSwipe = frame.timestamp;
                          return goPrevious();
                        }else if(distance >= 100){
                          previousSwipe = frame.timestamp;
                          return goNext();
                        }

                      }
                        break;
                        case "screenTap":
                        case "keyTap":
          /*gestureString += "position: " + vectorToString(gesture.position) + " mm, "
          + "direction: " + vectorToString(gesture.direction, 2);*/
          if( hand.pointables.length == 2){  
            var x = visuPanes[1].style.left;
            var y = visuPanes[1].style.top;
            hideVisu();
            return click(x,y);
          }     
          break;
          default:
          //gestureString += "unkown gesture type";
        }
      }
    }

  // Store frame for motion functions
  previousFrame = frame;

  fingers = frame.fingers;
  hands = frame.hands;
  if (fingers.length === 0) {
    return;
  }
  if (frame.gestures.length > 0) {
    firstGesture = frame.gestures[0];
    if (_debug) {
      gesturePane.innerHTML = '<div>' + _animationsPaused + JSON.stringify(firstGesture) + '</div>' + gesturePane.innerHTML;
    }
    if (_animationsPaused) {
      return;
    }
    speed = firstGesture.speed || 0;
    if (firstGesture.direction) {
      direction = {
        x: firstGesture.direction[0],
        z: firstGesture.direction[1],
        y: firstGesture.direction[2]
      };
    }
    state = firstGesture.state || '';
    type = firstGesture.type;
    duration = (firstGesture.duration || 0) / 60000;
    if (type === 'keyTap' && fingers.length < 3) {
        //return quickScroll('down');
      } else if (type === 'swipe' && state === 'stop') {
        verticalDistance = firstGesture.position[1] - firstGesture.startPosition[1];
        if (verticalDistance > 100 && speed > 100 && fingers.length > 2) {
          if (hands.length === 2) {
            return scrollToTop();
          } else {
            return quickScroll('up');
          }
        }
      }
    }
  });

click = function(x ,y) {
  x = Math.round( parseFloat(x) )+visuRadius;
  y = Math.round( parseFloat(y) )+visuRadius;
  event = document.createEvent("MouseEvents");
  event.initEvent("click", true, false);
  return document.elementFromPoint(x, y).dispatchEvent(event);
};

goPrevious = function() {
  return history.go(-1);
};

goNext = function() {
  return history.go(1);
};

hideVisu = function() {
  for (var index = 0; index < maxFingers; index++) {
    visuPanes[index].style.top =  -100 + 'px';
    visuPanes[index].style.left = -100 + 'px';
  }
};

refresh = function() {
  return location.reload();
};

scrollToTop = function() {
  window.scrollBy(-document.height);
  return pauseAnimations();
};

scroll = function(horizontal, vertical) {
  return window.scrollBy(-horizontal*5,vertical*5);
};

quickScroll = function(dir, pause) {
  var factor;

  if (pause == null) {
    pause = _defaultAnimationPauseMs;
  }
  factor = dir === 'up' ? -1 : 1;
  window.scrollBy(0, (window.innerHeight - 120) * factor);
  return pauseAnimations(pause);
};

pauseAnimations = function(pause) {
  var _this = this;

  if (pause == null) {
    pause = _defaultAnimationPauseMs;
  }
  _animationsPaused = true;
  return setTimeout((function() {
    return _animationsPaused = false;
  }), pause);
};

}).call(this);
