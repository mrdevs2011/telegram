/**
 * MR Realtime Library
 * High-performance, zero-dependency smart DOM poller for real-time web applications.
 * Author: mrdevs2011 (Muhammadrasul)
 * Repository: https://github.com/mrdevs2011/library
 * License: MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MRRealtime = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var instances = {};

  /**
   * Starts smart background polling on a target DOM container.
   * @param {string|HTMLElement} target - CSS selector or DOM element to keep updated.
   * @param {Object|number} options - Interval in ms or config object.
   */
  function start(target, options) {
    var opts = typeof options === 'number' ? { interval: options } : (options || {});
    var interval = opts.interval || 1500;
    var autoScroll = opts.autoScroll !== false;
    var url = opts.url || window.location.href;

    var selector = typeof target === 'string' ? target : null;
    var el = typeof target === 'string' ? document.querySelector(target) : target;

    if (!selector && el) {
      if (el.getAttribute('data-mr-realtime') !== null) {
        selector = '[data-mr-realtime]';
      } else if (el.id) {
        selector = '#' + el.id;
      } else if (el.className) {
        selector = '.' + el.className.trim().split(/\s+/)[0];
      }
    }

    if (!el && selector) {
      document.addEventListener('DOMContentLoaded', function () {
        start(selector, options);
      });
      return;
    }

    if (!el) {
      console.warn('[MRRealtime] Target element not found:', target);
      return;
    }

    var key = selector || (el.id ? '#' + el.id : el.className);
    if (instances[key]) {
      clearInterval(instances[key]);
    }

    var timer = setInterval(function () {
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newTarget = selector ? doc.querySelector(selector) : (doc.querySelector('[data-mr-realtime]') || doc.querySelector('.' + el.className.trim().split(/\s+/)[0]));
          var currentTarget = typeof target === 'string' ? document.querySelector(target) : el;

          if (newTarget && currentTarget) {
            if (newTarget.innerHTML !== currentTarget.innerHTML) {
              currentTarget.innerHTML = newTarget.innerHTML;
              if (autoScroll) {
                currentTarget.scrollTop = currentTarget.scrollHeight;
              }
              if (typeof opts.onUpdate === 'function') {
                opts.onUpdate(currentTarget);
              }
            }
          }
        })
        .catch(function (err) {
          // Silent fallback on network stutter
        });
    }, interval);

    instances[key] = timer;
    return timer;
  }

  function stop(target) {
    var key = typeof target === 'string' ? target : (target.id ? '#' + target.id : target.className);
    if (instances[key]) {
      clearInterval(instances[key]);
      delete instances[key];
    }
  }

  // Smart Focus Engine (Telegram Desktop behavior)
  function initSmartFocus() {
    var input = document.querySelector('[autofocus]') || document.querySelector('.input-field') || document.querySelector('input[type="text"]');
    if (!input) return;

    // Immediate focus on page ready
    setTimeout(function () {
      input.focus();
    }, 50);

    // Re-focus on clicking outside
    document.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      input.focus();
    });

    // Telegram Desktop keypress capture: typing anywhere immediately focuses input
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Tab' || e.key === 'Escape') {
        return;
      }
      if (document.activeElement !== input && e.key && e.key.length === 1) {
        input.focus();
      }
    });
  }

  // Auto-initialize any elements with data-mr-realtime attribute and smart focus
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      var autoElements = document.querySelectorAll('[data-mr-realtime]');
      autoElements.forEach(function (elem) {
        var ms = parseInt(elem.getAttribute('data-mr-realtime'), 10) || 1500;
        start(elem, { interval: ms, autoScroll: true });
      });
      initSmartFocus();
    });
  }

  return {
    start: start,
    stop: stop,
    initSmartFocus: initSmartFocus
  };
});
