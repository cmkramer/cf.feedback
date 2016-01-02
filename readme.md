#CF Feedback

###A dynamic feedback directive
The current version of this directive does not contain automated tests, nor does it contain styled examples, these will be added soon.

This directive allows you to easily publish and display user feedback throughout your angular application. It can be as simple as doing the following:

## Installation
Get the module using Bower by issuing the following command:

    bower install cf.feedback --save

If you're not using bower, download the cf.feedback.min.js from the dist directory.

### Configure
Load the CF Feedback module into your index. The bower.json file contains a `main` reference, so using an injector this can be done automatically in case you installed this package through Bower. If you don't use an injector, simply add the following line to your index file (assuming your index is one directory above your bower dependencies):

    <script src="../bower_components/cf.feedback/dist/cf.feedback.min.js"></script>

If you manually downloaded the file, just load it from where you put it. Next make sure to add the feedback module to your application module, i.e. `angular.module('myAwesomeApp', ['cf.feedback'])`.

That's it! You're now ready to use it.

## Using the directive
If you're using plain old untranslated feedback messages, it can't be much simpler to get started. To dispatch feedback from any controller or service, inject the `$feedback` service and call one of its feedback publication methods:

    $feedback.error('Your message here');
    $feedback.success('Your message here');
    $feedback.notice('Your message here');
    $feedback.alert('Your message here');

To use the feedback directive add it to any element that should display feedback like this:

    <div feedback class="{{feedback.type}}">{{feedback.message}}</div>
    
The `feedback.message` variable contains the actual message to display. The `feedback.type` reference allows you to style specific types of feedback as you please. It will equal `error`, `success`, `notice` or `alert` depending on the type of feedback that is displayed.

The example above allows you to display a single current global feedback message that is replaced by new feedback. Pretty convenient if you want to show one general message at a time to your user. If you want to be more specific about which message to show, you can use explicit identifiers. To publish using a specific identifier use:

    $feedback.error('Your message here', {}, 'yourUniqueId');
    
To subscribe a directive that will display a message specifically for that reference you can use:

    <div feedback="yourUniqueId" class="{{feedback.type}}">{{feedback.message}}</div>
    
### Displaying multiple messages simultaneously
Displaying feedback doesn't end here. Sometimes you just want more, you want to show the user how much you care about informing them about a lot of things at the same time. To do so, you can tell your directive that it should display more than 1 feedback message at once in case they occur at the same time, or within a designated timespan. To allow this, you will need a custom option. The following options are available for this directive which you can overrule by passing a custom options object:

    {
        replaceTime: 300,
        cleanTimeout: 6000,
        queueTimeout: 3000,
        minTimeout: 1000,
        allowDuplicateStacked: false,
        maxMessages: 1
    }
    
The one you'd be looking for is the `maxMessages` setting. If you want to tweak the behaviour of the directive you can override one or more of these options by passing an object along containing the variables to overrule. Say we want to display 3 messages at once, but we like the other settings and don't want to overrule those, we just need to pass the following object along: `{maxMessages: 3}`. Store this object in a variable within your scope, or a public variable within your controller (say `weNeedMoreFeedbackOptions`), and pass it along in your template:

    <ul feedback fb-options="weNeedMoreFeedbackOptions">
        <li ng-repeat="feedbackMessage in feedback track by feedbackMessage.index">{{feedbackMessage.message}}</li>
    </ul>
    
See how we use a repeater to display all feedback messages at once.

### Manual intervention
If you want to allow the user to manually hide feedback being displayed because that annoying message has been sticking around for too long, you can trigger the `hide` function. In case you have the default settings, that allow only one message to be displayed, you could choose a setup as follows:

    <div feedback class="{{feedback.type}}" ng-click="hide()">{{feedback.message}}</div>
    
If you've chosen the path of displaying multiple messages at once, you need to tell the directive which message to hide. You can do so as follows:

    <ul feedback fb-options="weNeedMoreFeedbackOptions">
        <li ng-repeat="feedbackMessage in feedback" ng-click="hide(feedbackMessage.index)">{{feedbackMessage.message}}</li>
    </ul>

## Queued feedback and other settings
In case you get too many feedback messages at once for a directive to display, the directive will queue the message to display them after the current message(s) are done. The directive will automatically replace the currently displayed message after a configured amount of time (this is the `queueTimeout` in the settings displayed above).

The severity of a next feedback message influences the screentime of a previous message. In case the current message displayed is a notice, and we get a queued error, success or alert message, considering the default options, the notice will only be displayed for 1 second after the error message is received. If the currently displayed message is not a notice, it will be forced to a reduced 3 second screentime. If we don't get another message in queue during the screentime of our current message, the full `cleanTimeout` is used to display the message, which is set to 6 seconds as a default.

To avoid several messages that are in essence the same, to be displayed all at once, the `allowDuplicateStacked` is set to false. This ensures that only one feedback message containing the same message is displayed. If you like to flood your users by telling them the same thing several times at once, you can set this to `true`.

Finally the `replaceTime` allows you to let the feedback rendering match any fancy transitions you do when you make a feedback message disappear using CSS. If you hook onto `.ng-leave` for the element that displays your feedback, make sure to let your transition timing match the `replaceTime` setting to make it all appear nice and smooth.

If you just don't like the default options, and want to use different default options for your application, well... I guess I understand. We can still be friends. There's actually a way to do that nicely during the configuration of your application module, no hard feelings. Consider the example:

    angular.module('i.dont.like.your.defaults', ['cf.feedback'])
    .config(function (cfFeedbackProvider) {
        var myOptionsAreBetter = {
            replaceTime: 500,
            cleanTimeout: 20000,
            queueTimeout: 10000,
            minTimeout: 5000,
            allowDuplicateStacked: true,
            maxMessages: 3
        }
        cfFeedbackProvider.configureDefaultOptions(myOptionsAreBetter);
    }

If you do not want to change the options during the configuration phase because you have an external configuration file that is loaded during the run phase, you can just as well override the defaults at any time while running the application by injecting `cfFeedback` and calling:

    cfFeedback.setDefaultOptions(yourMoreAwesomeOptions);

## Using translated feedback
Sometimes we like to do things the proper way. At some point you realize that it's not really maintainable to use static texts to tell your user your amazing stories. Text can be quite dynamic, sometimes it has some dynamic variables, and sometimes they just don't speak your native tongue. If you want to use translations I recommend using the `pascalprecht.translate` module (which is also used in the `test/playground` of this project). Say that you use that library to take care of your translations, you need to do some configuration to tell the feedback module that you want to enhance it with translations. The following example shows you how you would use it with a static inline json list with translations (which you should of course dynamically retrieve when you're up for the real task):

    angular.module('cf.feedback.demo', ['cf.feedback', 'pascalprecht.translate'])
        .provider('exampleTranslations', function () {
            // we need a provider that allows us to retrieve the translations when we want to render them in the feedback module
            var translator;
            // these are some ugly static translations
            var translations = {
                'FEEDBACK': {
                    'ERROR': {
                        'TEST': "This is a translated test error"
                    }
                }
            };

            return {
                // we need a listing method that returns the full translation file
                list: function () {
                    return translations;
                },
                // we need a translation function that executes the actual translation
                translate: function () {
                    return translator.apply(this, arguments);
                },
                // we initialize the translator to use the `$translate` service
                $get: function ($translate) {
                    var self = this;
                    translator = $translate;
                    return {
                        list: self.list
                    }
                }
            };
        }).factory('customLoader', function ($q, exampleTranslations) {
            // create a custom loader factory for the translations
            return function () {
                return $q.when(exampleTranslations.list());
            };
        }).config(function ($translateProvider, cfFeedbackProvider, exampleTranslationsProvider) {
            // we configure the translation module
            $translateProvider.preferredLanguage('en');
            $translateProvider.useLoader('customLoader');

            // and we make sure the module is available to the translation directive
            cfFeedbackProvider.configureTranslations(exampleTranslationsProvider.list, exampleTranslationsProvider.translate);

        })

Now to render translated feedback messages through your controllers and services, you can use curly brackets around the feedback:
 
    $feedback.error('{TEST}');

See how we're not referring to the full path `FEEDBACK.ERROR.TEST`. Your translation file should contain a `FEEDBACK` constant in its root and have an object for each type. I.e. `ERROR`, `SUCCESS`, `ALERT` and `NOTICE`, just like in the example above. This way you only have to pass the actual functional reference, which keeps your code a bit cleaner.

But wait... there is more! If you were sharp you might have noticed a second variable when calling `$feedback.error` that has not been explained yet. If you have a dynamic feedback messages, containing some variables, like `You don't have the proper credentials to edit {{name}}`, you can easily apply this with this directive. To do so, use the following syntax to publish the feedback:

    $feedback.error('{USER.SAVE.UNAUTHORIZED}', {name: 'Awesome User'});
    
This assumes that your translation library supports variable injection. If you use the one we use, you know it will work.

We still want more!! Sometimes you have this situation where you have a generic feedback message, like `Saving the user failed` and some more details explaining why, like `You don't have the proper credentials to edit {{name}}`. This basically means you have a construction where you have a generic feedback message, and multiple specific reasons. This is supported by default, when you use the following structure in your translation file:

    {
        'FEEDBACK': {
            'ERROR': {
                'UNKNOWN': "An unknown error has occurred"
                'USER': {
                    'SAVE': {
                        '_MESSAGE': "Saving the user failed",
                        'UNAUTHORIZED': {
                            '_DETAILS': "You don't have the proper credentials to edit {{name}}"
                        },
                        'NOT_AUTHENTICATED': {
                            '_DETAILS': "You need to login first before you try to edit a user"
                        }
                    }
                }
            },
            'SUCCESS': {
                'USER': {
                    'SAVE': "Your changes to {{name}} have been saved"
                }
            }
        }
    }
    
This works in a way that the directive will search for the `_MESSAGE` closest to your reference. You can specify one next to your `_DETAILS` element if you want to overrule the higher level one. Make sure you include an `UNKNOWN` root feedback element within a type to fall back on automatically when the referenced feedback seems to be missing in the translation file.

## License
Copyright 2015 Christian Kramer

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
