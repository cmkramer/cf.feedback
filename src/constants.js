/**
 * @ngdoc overview
 * @name cf.feedback.constants:FEEDBACK_TYPE
 * @description
 * # Application constants
 *
 * Generic feedback type constant
 */

angular.module('cf.feedback')
	.constant('FEEDBACK_TYPE', {
        'SUCCESS': 'SUCCESS',
        'ERROR': 'ERROR',
        'ALERT': 'ALERT',
        'NOTICE': 'NOTICE'
    });

