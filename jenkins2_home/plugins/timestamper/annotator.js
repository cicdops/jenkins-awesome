/*
 * The MIT License
 * 
 * Copyright (c) 2013 Steven G. Brown
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function() {

// Cookie is renewed each time the page is opened and expires after 2 years
// http://googleblog.blogspot.com.au/2007/07/cookies-expiring-sooner-to-improve.html

var cookieName = 'jenkins-timestamper';

function init() {
    // Only one of these modes can be checked at a time.
    var modes = {
        'system': document.getElementById('timestamper-systemTime'),
        'elapsed': document.getElementById('timestamper-elapsedTime'),
        'none': document.getElementById('timestamper-none')
    };

    // Any combination of these options can be checked at a time (but some may be disabled depending on the mode).
    var options = {
        'local': document.getElementById('timestamper-localTime')
    };

    // Set the mode from a cookie or initialize it (also handle migrating old cookie values to new ones).
    var mode = getCookie() || 'system';
    if (mode == 'local') {
        options[mode].checked = true;
        mode = 'system';
    }
    modes[mode].checked = true;

    // Renew the cookie.
    setCookie(mode);

    // Set the click handler.
    for (mode in modes) {
        modes[mode].observe('click', function() {
            onModeClick(modes);
        });
    }

    // Set the options from cookies or initialize them.
    for (var option in options) {
        var value = getCookie(option) || 'false';
        options[option].checked = (value === 'true');

        // Renew the cookie.
        setCookie(value, option);

        // Set the click handler.
        options[option].observe('click', function() {
            onOptionClick(options);
        });
    }

    // Disable invalid options depending on the mode.
    options['local'].disabled = !modes['system'].checked;
}

function onModeClick(modes) {
    for (var mode in modes) {
        if (modes[mode].checked) {
            setCookie(mode);
            break;
        }
    }

    document.location.reload();
}

function onOptionClick(options) {
    for (var option in options) {
        setCookie(options[option].checked ? 'true' : 'false', option);
    }

    document.location.reload();
}

function setCookie(value, suffix) {
    var name = cookieName;
    if (typeof(suffix) !== 'undefined') {
        name += '-' + suffix;
    }

    var path = '/';
    if (rootURL) {
        path = rootURL;
    }
    var currentDate = new Date();
    currentDate.setTime(currentDate.getTime() + 1000 * 60 * 60 * 24 * 365 * 2); // 2 years
    var attributes = '; path=' + path + '; expires=' + currentDate.toGMTString();
    document.cookie = name + '=' + value + attributes;
}

function getCookie(suffix) {
    var name = cookieName;
    if (typeof(suffix) !== 'undefined') {
        name += '-' + suffix;
    }

    var re = new RegExp('(?:^|;\\s*)' + name + '\\s*=\\s*([^;]+)');
    var match = re.exec(document.cookie);
    if (match) {
        return match[1];
    }
    return null;
}

function displaySettings() {
    // Jenkins 1.608 displays the side panel widgets in 'side-panel-content'
    var element = document.getElementById('side-panel-content');
    if (null == element) {
        // Jenkins 1.619 has no 'side-panel-content', it displays the widgets in 'side-panel' 
        element = document.getElementById('side-panel');
        if (null == element) {
            // element not found, so return to avoid an error (JENKINS-23867)
            return;
        }
    }

    new Ajax.Updater(
        element,
        rootURL + '/extensionList/hudson.console.ConsoleAnnotatorFactory/hudson.plugins.timestamper.annotator.TimestampAnnotatorFactory2/usersettings',
        { insertion: Insertion.Bottom, onComplete: init }
    );
}

function onLoad() {
    if (!window.MutationObserver || document.querySelector('span.timestamp')) {
        displaySettings();
        return;
    }
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            var addedNodes = mutation.addedNodes;
            for (var i = 0; i < addedNodes.length; i++) {
                if (addedNodes[i].querySelector('span.timestamp')) {
                    observer.disconnect();
                    displaySettings();
                    return;
                }
            }
        });
    });
    observer.observe(document, { childList: true, subtree: true });
}

// Delete cookies added with the wrong path by Timestamper 1.7.2. See JENKINS-32074.
var attributes = '; path=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
document.cookie = 'jenkins-timestamper=' + attributes;
document.cookie = 'jenkins-timestamper-local=' + attributes;
document.cookie = 'jenkins-timestamper-offset=' + attributes;

// Make browser time zone available to the server
var offset = getCookie('offset');
var newOffset = (new Date().getTimezoneOffset() * 60 * 1000).toString();
if (newOffset !== offset) {
    setCookie(newOffset, 'offset');
    document.location.reload();
}

// Run on page load
if (document.readyState === 'complete') {
    onLoad();
} else {
    Behaviour.addLoadEvent(onLoad);
}

}());
