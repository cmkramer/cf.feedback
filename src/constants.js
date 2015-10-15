/**
 * @ngdoc overview
 * @name finqApp.constants:EVENTS
 * @description
 * # Application Events
 *
 * Any event used throughout the application should be defined here as a constant.
 */

angular.module('cf.feedback')
	.constant('FEEDBACK_TYPE', {
        'SUCCESS': 'SUCCESS',
        'ERROR': 'ERROR',
        'ALERT': 'ALERT',
        'NOTICE': 'NOTICE'
    });

