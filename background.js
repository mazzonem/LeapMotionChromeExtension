/**
This file is part of LeapMotionChromeExtension.

    LeapMotionChromeExtension is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    LeapMotionChromeExtension is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with LeapMotionChromeExtension.  If not, see <http://www.gnu.org/licenses/>.
**/
(function() {
  chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    if (req["init_script"]) {
      chrome.browserAction.setBadgeText({
        text: 'WAIT'
      });
      return chrome.browserAction.setBadgeBackgroundColor({
        color: [0, 0, 255, 255]
      });
    } else if (req["has_leap"] && req["has_leap"] === true) {
      chrome.browserAction.setBadgeBackgroundColor({
        color: [0, 255, 0, 255]
      });
      return chrome.browserAction.setBadgeText({
        text: 'OK'
      });
    } else if (req["has_leap"] && req["has_leap"] === false) {
      chrome.browserAction.setBadgeText({
        text: 'OFF'
      });
      return chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 0, 0, 255]
      });
    }
  });

}).call(this);
