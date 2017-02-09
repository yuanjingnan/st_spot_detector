// TODO: Redo state transitions in a separate module
'use strict';

angular.module('stSpots')
    .controller('MainController', [
        '$scope',
        '$http',
        '$sce',
        '$compile',
        function($scope, $http, $sce, $compile) {
            var addSpotsToastsDisplayed = false;

            // texts to display in the menu bar panel when clicking the help button
            const helpTexts = {
                state_start:         "Click on the top-most icon to select and upload image(s).",
                state_upload:        "",
                state_alignment:     "",
                state_predetection:  "Adjust the lines to align on top of the outermost spot frame.\n" +
                                     "Click on 'Detect spots' to begin spot detection.",
                state_detection:     "",
                state_adjustment:    "Left click or Ctrl+click to select spots. Hold in shift to add to a selection.\n" +
                                     "Right click to move selected spots or navigate the canvas.\n" +
                                     "Click 'Delete spots' to delete selected spots.\n" +
                                     "Click 'Add spots' to change to spot addition mode, then right click or Ctrl+click to add spots.\n" +
                                     "(HE only) Click 'Select spots within tissue' to automatically select spots within the tissue.\n" +
                                     "Click 'Finish Adding Spots' to return to selection mode.\n",
                state_autoselection: "",
                state_error:         "An error occured. Please try again."
            };

            // texts to display underneath the spinner while loading
            const spinnerTexts = {
                state_start:         "",
                state_upload:        "Processing image. This may take a few minutes.",
                state_alignment:     "",
                state_predetection:  "",
                state_detection:     "Detecting spots. This may take a few minutes.",
                state_autoselection: "Running tissue recognition. This may take" +
                                     " a few minutes.",
                state_adjustment:     "",
                state_error:         ""
            };

            // texts to display as a title on the menu bar panel
            const panelTitles = {
                button_uploader: 'Uploader',
                button_aligner: 'Alignment',
                button_detector: 'Detection Parameters',
                button_adjuster: 'Spot adjustment',
                button_exporter: 'Spot export',
                button_help: 'Help',
                button_info: 'Info'
            };

            // variables which hold more "global" important information, some shared between
            // other controllers/directives
            $scope.data = {
                state: 'state_start',
                button: 'button_uploader',
                sessionId: '',
                cy3Image: 'REMOVE_THIS',
                heImage: 'REMOVE_THIS',
                cy3Tiles: null,
                heTiles: null,
                cy3Active: null,
                errorText: '',
                imageToggleImage: {
                    Cy3: 'images/imageToggleCy3.png',
                    HE: 'images/imageToggleHE.png'
                }
            };

            $scope.classes = {
                canvas: "grabbable"
            };

            $scope.exportForm = {
                selection: 'selection',
                coordinateType: 'array'
            };

            // bools which control the visibilty of various elements on the page
            $scope.visible = {
                menuBar: true,
                menuBarPanel: true,
                zoomBar: false,
                imageToggleBar: false,
                spinner: false,
                canvas: false,
                error: false,
                panel: {
                    button_uploader: true,
                    button_aligner: false,
                    button_detector: false,
                    button_adjuster: false,
                    button_exporter: false,
                    button_help: false,
                    button_info: false
                },
                spotAdjuster: {
                    button_addSpots: true,
                    button_finishAddSpots: false,
                    button_deleteSpots: true,
                    div_insideTissue: false
                }
            };

            // strings which determine the clickable state of the menu bar buttons 
            $scope.menuButtonDisabled = {
                button_uploader: '',
                button_aligner: 'false',
                button_detector: 'false',
                button_adjuster: 'false',
                button_exporter: 'false',
                button_help: '',
                button_info: ''
            };

            var toggleMenuBarPanelVisibility = function(previousButton, thisButton) {
                // the panel is closed if the same button is pressed again
                // but stays open otherwise
                if(previousButton != thisButton) {
                    $scope.visible.menuBarPanel = true;
                }
                else {
                    $scope.visible.menuBarPanel = !$scope.visible.menuBarPanel;
                }
            };
            
            function displayToasts(toastTexts) {
                // triggers the chain of recursion
                chainToast(toastTexts, 0);
            }

            function chainToast(toastTexts, toastIndex) {
                // recursive function for displaying several toasts in a row
                // if last toast in list of toasts
                if(toastTexts.length == toastIndex) { 
                    // do nothing, end recursion
                }
                else {
                    toastr.options.onHidden = function() {
                        chainToast(toastTexts, toastIndex + 1);
                    };
                    toastr["info"](toastTexts[toastIndex]);
                }
            }

            $scope.addSpotsToasts = function() {
                if(!addSpotsToastsDisplayed) {
                    addSpotsToastsDisplayed = true;
                    toastr.options.timeOut = "100";
                    var toasts = [
                        "Left click to add spots.",
                        "Right click or Ctrl+click to navigate the canvas.",
                        "Click FINISH ADDING SPOTS to return to selection mode."
                    ];
                    displayToasts(toasts);
                }
            };

            function toast() {
                if($scope.data.state === 'state_start') {
                }
                else if($scope.data.state === 'state_upload') {
                    toastr.clear();
                }
                else if($scope.data.state === 'state_alignment') {
                    toastr.options.timeOut = "2000";
                    var toasts = ["\\-_-/"];
                    displayToasts(toasts);
                }
                else if($scope.data.state === 'state_predetection') {
                    // toastr["info"](
                    //     "Adjust the lines to frame the spots, as shown:<br>" + 
                    //     "<img src='images/framealignment.png'/><br>" +
                    //     "Click DETECT SPOTS to begin automatic spot detection."
                    // );
                }
                else if($scope.data.state === 'state_detection'
                    || $scope.data.state == 'state_autoselection') {
                        toastr.clear();
                }
                else if($scope.data.state === 'state_adjustment') {
                    toastr.options.timeOut = "100";
                    var toasts = [
                        "Detected spots are shown in red.",
                        "Left click to select spots.<br>Holding in Shift adds to the selection.",
                        "Right click or Ctrl+click to move selected spots or navigate the canvas.",
                        "Click DELETE SPOTS to deleted selected spots.<br>" + 
                        "Click ADD SPOTS to add additional spots."
                    ];
                    displayToasts(toasts);
                }
                else if($scope.data.state === 'state_error') {
                    toastr.clear();
                }
            }

            $scope.updateState = function(new_state, show_toast = true) {
                console.log(new_state);
                $scope.data.state = new_state;
                if($scope.data.state === 'state_start') {
                    // reinitialise things
                }
                else if($scope.data.state === 'state_upload') {
                    $scope.visible.menuBar = false;
                    $scope.visible.zoomBar = false;
                    $scope.visible.spinner = true;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_alignment') {
                    $scope.visible.menuBar = $scope.visible.zoomBar =
                        $scope.visible.canvas = true;
                    $scope.visible.spinner = $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_predetection') {
                    $scope.visible.menuBar = true;
                    $scope.visible.zoomBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = true;
                    $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_detection' ||
                    $scope.data.state == 'state_autoselection') {
                        $scope.visible.menuBar = false;
                        $scope.visible.zoomBar = false;
                        $scope.visible.spinner = true;
                        $scope.visible.canvas = false;
                        $scope.visible.errorText = false;
                    }
                else if($scope.data.state === 'state_adjustment') {
                    $scope.visible.menuBar = true;
                    $scope.visible.zoomBar = true;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = true;
                    $scope.visible.errorText = false;
                }
                else if($scope.data.state === 'state_error') {
                    $scope.visible.menuBar = true;
                    $scope.visible.zoomBar = false;
                    $scope.visible.spinner = false;
                    $scope.visible.canvas = false;
                    $scope.visible.errorText = true;
                }
                if($scope.data.heImage !== '')
                    // toggle bar should have the same visibility as the zoom
                    // bar if HE tiles uploaded
                    $scope.visible.imageToggleBar = $scope.visible.zoomBar;
                else
                    $scope.visible.imageToggleBar = false;

                if(show_toast)
                    toast();
            };

            function openPanel(button, openCB, closeCB) {
                // undisable the button
                $scope.menuButtonDisabled[button] = '';
                // click the button
                $scope.menuButtonClick(button, openCB, closeCB);
            }

            $scope.zoomButtonClick = function(direction) {
                $scope.zoom(direction); // defined in the viewer directive
            };

            $scope.imageToggleButtonClick = function() {
                $scope.setCy3Active(!$scope.data.cy3Active);
            };

            $scope.setCy3Active = function(active) {
              if ($scope.data.heImage === '') {
                $scope.data.cy3Active = true;
                return;
              }

              $scope.data.cy3Active = active;
              for (var [layer, visible] of[[ 'cy3', $scope.data.cy3Active ],
                                           [ 'he', !$scope.data.cy3Active ]])
                $scope.layerManager.setModifiers(layer, new Map([
                                                   [ 'visible', visible ],
                                                   [ 'alpha', 1.0 ],
                                                 ]));
            };

            $scope.menuButtonClick = (function() {
                var prevCloseCallback;
                return function(button, openCallback,
                    closeCallback) {
                    if(prevCloseCallback)
                        prevCloseCallback();
                    prevCloseCallback = closeCallback;

                    // only clickable if not disabled
                    //if($scope.menuButtonDisabled[button] != 'false') {
                    // switch off all the panel visibilities
                    for(var panel in $scope.visible.panel) {
                        $scope.visible.panel[panel] = false;
                    }
                    // except for the one we just selected
                    $scope.visible.panel[button] = true;
                    toggleMenuBarPanelVisibility($scope.data.button, button);
                    $scope.data.button = button;

                    if(openCallback)
                        openCallback();
                    //}
                };
            })();

            $scope.aligner = new (function() {
              this.prevState = undefined;
              this.open = function() {
                this.prevState = $scope.data.state;
                $scope.updateState('state_alignment');
                $scope.visible.imageToggleBar = false;
                for (var layer of ['cy3', 'he'])
                  $scope.layerManager.setModifiers(layer, new Map([
                                                     [ 'visible', true ],
                                                     [ 'alpha', 0.5 ],
                                                   ]));
              }.bind(this);
              this.exit = function() {
                console.log("exitAlignment");
                // reset to state before alignment
                if (this.prevState)
                  $scope.updateState(this.prevState, false);
                $scope.setCy3Active($scope.data.cy3Active);
              }.bind(this);
            })();

            $scope.detectSpots = function() {
                $scope.updateState('state_detection');

                var getSpotData = function() {
                    var successCallback = function(response) {
                        $scope.updateState('state_adjustment');
                        openPanel('button_exporter');
                        openPanel('button_adjuster');
                        $scope.loadSpots(response.data); // defined in the viewer directive
                    };
                    var errorCallback = function(response) {
                        $scope.data.errorText = response.data;
                        console.error(response.data);
                        $scope.updateState('state_error');
                    };

                    // we want to send the calibration data to the server,
                    // so we retrieve it from the viewer directive
                    var calibrationData = $scope.getCalibrationData();
                    // append the session id to this data so the server knows
                    // who we are
                    calibrationData.session_id = $scope.data.sessionId;

                    var config = {
                        params: calibrationData
                    };
                    $http.get('../detect_spots', config)
                        .then(successCallback, errorCallback);
                };
                getSpotData();
            };

            $scope.selectInsideTissue = function() {
                $scope.updateState('state_autoselection');

                var successCallback = function(response) {
                    $scope.updateState('state_adjustment', false);
                    $scope.loadSpots(response.data)
                };
                var errorCallback = function(response) {
                    $scope.data.errorText = response.data;
                    console.error(response.data.spots);
                    $scope.updateState('state_error');
                };

                var data = $scope.getSpots();
                $http.post('../select_spots_inside', {
                    spots: data.spots,
                    spacer: data.spacer,
                    session_id: $scope.data.sessionId
                }).then(successCallback, errorCallback);
            };

            $scope.getPanelTitle = function(button) {
                return panelTitles[button];
            };

            $scope.getHelpTexts = function(state) {
                return helpTexts[state];
            };

            $scope.getSpinnerText = function(state) {
                return spinnerTexts[state];
            };

            $scope.getImageToggleImage = function() {
                if($scope.data.cy3Active)
                    return $scope.data.imageToggleImage.HE;
                else return $scope.data.imageToggleImage.Cy3;
            };
            
            $scope.getImageToggleText = function() {
                if($scope.data.cy3Active)
                    return "HE";
                else return "Cy3";
            };

            $scope.uploadImage = function() {
                // if($scope.data.cy3Image !== '') {
                    $scope.updateState('state_upload');
                    var getTileData = function() {
                        var tileSuccessCallback = function(response) {
                            $scope.receiveTilemap(response.data);
                            $scope.setCy3Active(true);

                            if($scope.data.heImage !== undefined)
                                $scope.menuButtonDisabled.button_aligner = '';
                            // $scope.updateState('state_predetection');
                            // openPanel('button_detector');

                            $scope.updateState('state_predetection');
                            openPanel('button_detector');
                            openPanel('button_aligner', $scope.aligner.open,
                                $scope.aligner.exit);
                        };
                        var tileErrorCallback = function(response) {
                            $scope.data.errorText = response.data;
                            console.error(response.data);
                            $scope.updateState('state_error');
                        };

                        // $http.post('../tiles', {
                        //     images: {'cy3': $scope.data.cy3Image,
                        //              'he': $scope.data.heImage},
                        //     session_id: $scope.data.sessionId
                        // }).then(tileSuccessCallback, tileErrorCallback);
                        tileSuccessCallback({data: RESPONSE});
                    };

                    var getSessionId = function() {
                        var sessionSuccessCallback = function(response) {
                            $scope.data.sessionId = response.data;
                            getTileData();
                        };
                        var sessionErrorCallback = function(response) {
                            $scope.data.errorText = response.data;
                            console.error(response.data);
                            $scope.updateState('state_error');
                        };
                        $http.get('../session_id')
                            .then(sessionSuccessCallback, sessionErrorCallback);
                    };
                    getSessionId();
                // }
            };

            toastr.options = {
                "closeButton": false,
                "debug": false,
                "newestOnTop": true,
                "progressBar": false,
                "positionClass": "toast-top-center",
                "preventDuplicates": true,
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "10",
                "timeOut": "0",
                "extendedTimeOut": "100",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };
            toastr["info"]("Welcome to the Spatial Transcriptomics Spot Detection Tool. Begin by uploading a Cy3 fluorescence image.", "");
            
            $scope.uploadImage();
        }
    ]);
