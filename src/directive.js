'use strict';

/**
 * @ngdoc overview
 * @name finqApp:FeedbackCtrl
 * @description
 * # Feedback controller
 *
 * Handle rendering and iteraction with user feedback.
 */
angular.module('cf.feedback')
    .directive('feedback', function ($timeout, cfFeedback) {
        return {
            scope: {
                fbOptions: '=',
                elementId: '@feedback'
            },
            restrict: 'A',
            controller: 'FeedbackCtrl',
            transclude: true,
            compile: function (tElement, attrs, transclude) {
                return function ($scope) {
                    var handleFeedback = function(feedback) {
                        $scope.handle(feedback);
                    };
                    if ($scope.elementId === '') $scope.elementId = void 0;
                    cfFeedback.subscribe(handleFeedback, $scope.elementId);
                    $scope.$on("$destroy", function() {
                        cfFeedback.unsubscribe(handleFeedback, $scope.elementId);
                    });
                    transclude($scope, function (clone) {
                        tElement.append(clone);
                    });
                };
            }
        };
    }).controller('FeedbackCtrl', function ($scope, $timeout, cfFeedback, $translate, FEEDBACK_TYPE) {
        var that = this,
            index = 0,
            timeoutOverrulingType = null,
            queue = [],
            hiding = 0,
            options = cfFeedback.getDefaultOptions();

        if ($scope.fbOptions) {
            options = angular.extend({}, options, $scope.fbOptions);
        }

        $scope.handle = function(feedback) {
            handleFeedback(feedback);
        };

        if (options.maxMessages !== 1) $scope.feedback = [];

        this.hide = function (index, whenDone) {
            if (options.maxMessages === 1) {
                $scope.feedback = null;
                $timeout(function () {
                    hiding--;
                    if (typeof whenDone === 'function') whenDone();
                }, options.replaceTime);
                $scope.$digest();
            } else {
                angular.forEach($scope.feedback, function (message) {
                    if (message.index === index) {
                        hiding++;
                        if (message.timeout !== null) {
                            clearTimeout(message.timeout);
                        }
                        for (var i = 0; i < $scope.feedback.length; i++) {
                            if ($scope.feedback[i].index === index) {
                                $scope.feedback.splice(i, 1);
                                break;
                            }
                        }
                        $timeout(function () {
                            hiding--;
                            if (typeof whenDone === 'function') whenDone();
                        }, options.replaceTime);
                        $scope.$digest();
                    }
                })
            }
        };

        var handleFeedback = function (feedbackSpec) {
            var feedback = {
                staticType: feedbackSpec.type
            };
            var translatableMessage = translatable(feedbackSpec.message);
            if (translatableMessage) {
                feedback.paths = findRelativeFeedbackPaths(feedbackSpec.type, translatableMessage);
                translateFeedback(feedback);
                feedback.reference = feedback.paths.reference;
                feedback.message = feedback.reference + ' (untranslated)';
            } else {
                feedback.message = feedbackSpec.message;
                feedback.reference = feedback.message;
            }
            feedback.details = null;
            feedback.type = feedbackSpec.type.toLowerCase();
            feedback.data = feedbackSpec.data;
            if (allowProcessing(feedback)) {
                processNewFeedbackMessage(feedback);
            }
        };

        var translatable = function (feedbackMessage) {
            if (feedbackMessage[0] === '{' && feedbackMessage[feedbackMessage.length-1] === '}') {
                return feedbackMessage.substring(1,feedbackMessage.length-1);
            } return false;
        };

        var allowProcessing = function(feedback) {
            if (options.allowDuplicateStacked) return true;
            var allow = true;
            var validateMessage = function(currentFeedback) {
                if (currentFeedback.type === feedback.type && currentFeedback.reference === feedback.reference) {
                    allow = false;
                }
            };
            if (options.maxMessages === 1 && $scope.feedback) validateMessage($scope.feedback);
            else {
                angular.forEach($scope.feedback, function (currentFeedback) {
                    validateMessage(currentFeedback);
                });
            }

            return allow;
        };

        var processNewFeedbackMessage = function(feedback) {
            if ((options.maxMessages === 1 && $scope.feedback) || (options.maxMessages !== 1 && $scope.feedback.length+hiding >= options.maxMessages)) {
                clearOrUpdateQueued(FEEDBACK_TYPE.NOTICE);
                if (options.maxMessages === 1 && feedback.reference === $scope.feedback.reference && !queue.length) {
                    replaceFeedback(feedback);
                } else {
                    queueFeedback(feedback);
                }
            } else {
                showFeedback(feedback);
            }
        };

        var findRelativeFeedbackPaths = function (feedbackType, reference) {
            var translations = cfFeedback.listTranslations();
            if (!translations.FEEDBACK) {
                throw new Error('Cannot find a FEEDBACK root constant reference in your loaded translations file. Make sure there is a root item called FEEDBACK in your translation file which contains all structured supported feedback messages.');
            }
            var ref = reference.split('.');
            var traversed, lastMessagePath, path = '', fb;
            traversed = translations.FEEDBACK[feedbackType];
            if (!traversed) {
                throw new Error('Cannot find FEEDBACK.'+feedbackType+' in your translation file. Make sure you group your feedback by type in the translation file.');
            }
            for (var i = 0; i < ref.length; i++) {
                path += i > 0 ? '.'+ref[i] : ref[i];
                if (traversed[ref[i]]) {
                    traversed = traversed[ref[i]];
                    if (traversed._MESSAGE) {
                        lastMessagePath = path;
                    }
                } else {
                    traversed = false;
                    if (lastMessagePath) {
                        console.debug('untranslated '+feedbackType.toLowerCase()+' feedback reference provided: '+reference+'. Falling back to most specific message: '+lastMessagePath);
                    } else {
                        fb = {
                            reference: 'UNKNOWN',
                            message: 'UNKNOWN'
                        };
                        console.debug('untranslated '+feedbackType.toLowerCase()+' feedback reference provided: '+reference);
                    }
                    break;
                }
            }
            if (traversed) {
                if (typeof traversed === 'object') {
                    fb = {
                        reference: reference,
                        message: lastMessagePath
                    };
                } else fb = reference;
            }
            return fb;
        };

        var showFeedback = function (feedback, timeout) {
            feedback.index = index++;
            if (index > options.maxMessages*2) index = 0;
            if (options.maxMessages !== 1) {
                $scope.feedback.push(feedback);
            } else $scope.feedback = feedback;
            timeoutFeedback(feedback, timeout || options.cleanTimeout);
        };

        var queueFeedback = function (feedback) {
            var firstItem = options.maxMessages === 1 ? $scope.feedback : $scope.feedback[0];
            if (timeoutOverrulingType === null || (timeoutOverrulingType === FEEDBACK_TYPE.NOTICE && feedback.staticType !== FEEDBACK_TYPE.NOTICE)) {
                if (feedback.staticType !== FEEDBACK_TYPE.NOTICE) {
                    timeoutFeedback(firstItem, options.minTimeout);
                } else {
                    timeoutFeedback(firstItem, options.queueTimeout);
                }
                timeoutOverrulingType = feedback.staticType;
            }
            if (!clearOrUpdateQueued(feedback)) {
                queue.push(feedback);
            }
        };

        var replaceFeedback = function (feedback) {
            $timeout(function () {
                that.hide(feedback[0].index, function () {
                    showFeedback(feedback);
                });
                $scope.$digest();
            });
        };

        var timeoutFeedback = function (feedback, timeout) {
            feedback.timeout = setTimeout(function () {
                that.hide(feedback.index, function() {
                    if (!evaluateQueue()) {
                        timeoutOverrulingType = null;
                    }
                });
                $scope.$digest();
            }, timeout);
        };

        var evaluateQueue = function () {
            if (queue.length) {
                var nextTimeout;
                if (queue.length > 1) {
                    if (queue[1].staticType !== FEEDBACK_TYPE.NOTICE) {
                        nextTimeout = options.minTimeout;
                    } else {
                        nextTimeout = options.queueTimeout;
                    }
                } else {
                    nextTimeout = options.cleanTimeout;
                }
                showFeedback(queue[0], nextTimeout);
                queue.splice(0, 1);
            }
            return queue.length;
        };

        var clearOrUpdateQueued = function (feedback) {
            for (var i = 0; i < queue.length; i++) {
                if (queue[i].staticType === feedback.staticType && (!feedback || queue[i].reference === feedback.reference)) {
                    queue.splice(i--, 1);
                    return false;
                }
            }
        };

        var translateFeedback = function(feedback) {
            if (typeof feedback.paths === 'object') {
                $translate('FEEDBACK.' + feedback.staticType + '.' + feedback.paths.message + '._MESSAGE', feedback.data).then(function (translatedFeedback) {
                    feedback.message = translatedFeedback;
                });
                $translate('FEEDBACK.' + feedback.staticType + '.' + feedback.paths.reference + '._DETAILS', feedback.data).then(function (translatedFeedback) {
                    feedback.details = translatedFeedback;
                });
            } else {
                $translate('FEEDBACK.' + feedback.staticType + '.' + feedback.paths, feedback.data).then(function (translatedFeedback) {
                    feedback.message = translatedFeedback;
                });
            }
        }

    });
