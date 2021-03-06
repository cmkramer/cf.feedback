'use strict';

/**
 * @ngdoc function
 * @name cf.feedback:cfFeedbackManager
 * @description
 * # Feedback management service
 *
 * A support service to handle subscriptions and publications of feedback related actions.
 */
angular.module('cf.feedback')
    .provider('cfFeedback', function() {
        var translationListFn, translationFn, translate = false;
        var listeners = {
            global: [],
            identified: {}
        };
        var defaultOptions = {
            replaceTime: 300,
            cleanTimeout: 6000,
            queueTimeout: 3000,
            minTimeout: 1000,
            silentReplace: false,
            allowDuplicateStacked: false,
            maxMessages: 1
        };

        return {
            configureTranslations: function (listFn, translateFn) {
                translationListFn = listFn;
                translationFn = translateFn;
                translate = true;
            },

            configureDefaultOptions: function (options) {
                defaultOptions = angular.extend({}, defaultOptions, options);
            },

            $get: function () {
                var self = this;
                return {
                    subscribe: function (directive, contextElement) {
                        if (contextElement === '') contextElement = void 0;
                        if (contextElement === void 0) {
                            listeners.global.push(directive);
                        } else {
                            listeners.identified[contextElement] = listeners.identified[contextElement] || [];
                            listeners.identified[contextElement].push(directive);
                        }
                    },

                    unsubscribe: function (directive, contextElement) {
                        if (contextElement === '') contextElement = void 0;
                        var targetList = (contextElement === void 0 ? listeners.global : listeners.identified[contextElement]);
                        if (targetList) {
                            for (var i = 0; i < targetList.length; i++) {
                                if (targetList[i].handle === directive.handle) {
                                    targetList.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    },

                    publish: function (feedback) {
                        var targetList = feedback.contextElement === void 0 ? listeners.global : listeners.identified[feedback.contextElement];
                        if (targetList) {
                            for (var i = 0; i < targetList.length; i++) {
                                if (targetList[i] && typeof targetList[i].handle === 'function') targetList[i].handle(feedback);
                            }
                        }
                    },

                    close: function (contextElement) {
                        var targetList = contextElement === void 0 ? listeners.global : listeners.identified[contextElement];
                        if (targetList) {
                            for (var i = 0; i < targetList.length; i++) {
                                if (targetList[i] && typeof targetList[i].close === 'function') targetList[i].close();
                            }
                        }
                    },

                    getDefaultOptions: function () {
                        return defaultOptions;
                    },

                    setDefaultOptions: function (options) {
                        return self.configureDefaultOptions(options);
                    },

                    listTranslations: function () {
                        return translationListFn.apply(this, arguments);
                    },

                    translate: function () {
                        if (!translate) return arguments[0];
                        return translationFn.apply(this, arguments);
                    }
                }
            }
        }

    });


/**
 * @ngdoc function
 * @name cf.feedback:$feedback
 * @description
 * # Feedback handling service
 *
 * A generic service to handle the displaying of all feedback to the user.
 */
angular.module('cf.feedback')
    .service('$feedback', function (cfFeedback, FEEDBACK_TYPE, $timeout) {

        this.error = function (message, data, contextElement) {
            dispatchFeedback(FEEDBACK_TYPE.ERROR, message, data, contextElement);
        };

        this.notice = function (message, data, contextElement) {
            dispatchFeedback(FEEDBACK_TYPE.NOTICE, message, data, contextElement);
        };

        this.success = function (message, data, contextElement) {
            dispatchFeedback(FEEDBACK_TYPE.SUCCESS, message, data, contextElement);
        };

        this.alert = function (message, data, contextElement) {
            dispatchFeedback(FEEDBACK_TYPE.ALERT, message, data, contextElement);
        };

        this.close = function(contextElement) {
            cfFeedback.close(contextElement);
        };

        var dispatchFeedback = function (type, message, data, contextElement) {
            var feedback = {
                message: message,
                type: type
            };
            if (data !== undefined) {
                feedback.data = data;
            }
            if (contextElement !== undefined) {
                feedback.contextElement = contextElement;
            }
            cfFeedback.publish(feedback);
        };

    });
