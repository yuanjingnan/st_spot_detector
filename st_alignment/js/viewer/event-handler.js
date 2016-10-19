'use strict';

(function() {
    var self;
    var EventHandler = function(scopeData, canvas, camera, logicHandler) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.logicHandler = logicHandler;
        self.scopeData = scopeData;

        self.mousePos = {};
        self.mouseDown = false;

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        passEventToLogicHandler: function(evt) {
            // only pass events in these two states
            if(self.scopeData.state == 'state_predetection' || self.scopeData.state == 'state_adjustment') {
                if(evt.type == 'mouse') {
                    self.logicHandler.processMouseEvent(self.scopeData.state, evt.eventType, evt.data);
                }
                else if(evt.type == 'key') {
                    if(evt.keyDirection == 'down') {
                        self.logicHandler.processKeyDownEvent(self.scopeData.state, evt.keyEvent);
                    }
                    else if(evt.keyDirection == 'up') {
                        self.logicHandler.processKeyUpEvent(self.scopeData.state, evt.keyEvent);
                    }
                }
            }
        },
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = true;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.down,
                    data: {
                        position: self.mousePos,
                        button: e.button
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmouseup = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = false;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.up,
                    data: {
                        position: self.mousePos,
                        button: e.button
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };

            canvas.onmouseout = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = false;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.out,
                    data: {
                        position: self.mousePos,
                        button: e.button
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };

            canvas.onmousemove = function(e) {
                var distanceMoved = Vec2.Vec2(self.mousePos.x - e.layerX, self.mousePos.y - e.layerY);
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);

                var thisEventType;
                if(self.mouseDown) {
                    thisEventType = self.logicHandler.mouseEvent.drag;
                }
                else {
                    thisEventType = self.logicHandler.mouseEvent.move;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: thisEventType,
                    data: {
                        position: self.mousePos,
                        difference: distanceMoved,
                        button: e.button
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmousewheel = function(e) {
                if(e.deltaY < 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, keyevents.zin);
                }
                else if(e.deltaY > 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, keyevents.zout);
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.wheel,
                    data: {
                        direction: keyevents.zin
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            }
        },
        setUpKeyEvents: function(canvas, camera) {
            document.onkeydown = function(event) {
                event = event || window.event;
                var keyName;
                // iterating through the keycodes
                for(var key in keycodes) {
                    // only counts as a key if it's in a direct property
                    if(keycodes.hasOwnProperty(key)) {
                        // does the event exist in this key?
                        if(keycodes[key].includes(event.which)) {
                            // then that's the key we want
                            keyName = key;
                        }
                    }
                }
                // send it to the logic handler if not undefined
                if(keyName) {
                    var keyEvent = {
                        type: 'key',
                        keyDirection: 'down',
                        keyEvent: keyName
                    };
                    self.passEventToLogicHandler(keyEvent);
                }
            };
            document.onkeyup = function(event) {
                event = event || window.event;
                if(keycodes.shift.includes(event.which)) {
                    self.logicHandler.processKeyupEvent(keyevents.shift);
                }
                else if(keycodes.esc.includes(event.which)) {
                    // escape
                    self.logicHandler.processKeydownEvent(keyevents.esc);
                }
                else if(keycodes.del.includes(event.which)) {
                    // delete
                    self.logicHandler.processKeydownEvent(keyevents.del);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
