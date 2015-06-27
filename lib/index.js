var InlineSVGError, PropTypes, React, Status, configurationError, createError, delay, getHash, http, httpplease, ieXDomain, isSupportedEnvironment, me, once, span, supportsInlineSVG, uniquifyIDs, unsupportedBrowserError,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

React = require('react');

once = require('once');

httpplease = require('httpplease');

ieXDomain = require('httpplease/plugins/oldiexdomain');

PropTypes = React.PropTypes;

span = React.DOM.span;

http = httpplease.use(ieXDomain);

Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

supportsInlineSVG = once(function() {
  var div;
  if (!document) {
    return false;
  }
  div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

delay = function(fn) {
  return function() {
    var args, newFunc;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    newFunc = function() {
      return fn.apply(null, args);
    };
    setTimeout(newFunc, 0);
  };
};

isSupportedEnvironment = once(function() {
  return ((typeof window !== "undefined" && window !== null ? window.XMLHttpRequest : void 0) || (typeof window !== "undefined" && window !== null ? window.XDomainRequest : void 0)) && supportsInlineSVG();
});

uniquifyIDs = (function() {
  var idPattern, mkAttributePattern;
  mkAttributePattern = function(attr) {
    return "(?:(?:\\s|\\:)" + attr + ")";
  };
  idPattern = RegExp("(?:(" + (mkAttributePattern('id')) + ")=\"([^\"]+)\")|(?:(" + (mkAttributePattern('href')) + "|" + (mkAttributePattern('role')) + "|" + (mkAttributePattern('arcrole')) + ")=\"\\#([^\"]+)\")|(?:=\"url\\(\\#([^\\)]+)\\)\")", "g");
  return function(svgText, svgID) {
    var uniquifyID;
    uniquifyID = function(id) {
      return "" + id + "___" + svgID;
    };
    return svgText.replace(idPattern, function(m, p1, p2, p3, p4, p5) {
      if (p2) {
        return "" + p1 + "=\"" + (uniquifyID(p2)) + "\"";
      } else if (p4) {
        return "" + p3 + "=\"#" + (uniquifyID(p4)) + "\"";
      } else if (p5) {
        return "=\"url(#" + (uniquifyID(p5)) + ")\"";
      }
    });
  };
})();

getHash = function(str) {
  var chr, hash, i, _i, _ref;
  hash = 0;
  if (!str) {
    return hash;
  }
  for (i = _i = 0, _ref = str.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash = hash & hash;
  }
  return hash;
};

InlineSVGError = (function(_super) {
  __extends(InlineSVGError, _super);

  InlineSVGError.prototype.name = 'InlineSVGError';

  InlineSVGError.prototype.isSupportedBrowser = true;

  InlineSVGError.prototype.isConfigurationError = false;

  InlineSVGError.prototype.isUnsupportedBrowserError = false;

  function InlineSVGError(message) {
    this.message = message;
  }

  return InlineSVGError;

})(Error);

createError = function(message, attrs) {
  var err, k, v;
  err = new InlineSVGError(message);
  for (k in attrs) {
    if (!__hasProp.call(attrs, k)) continue;
    v = attrs[k];
    err[k] = v;
  }
  return err;
};

unsupportedBrowserError = function(message) {
  if (message == null) {
    message = 'Unsupported Browser';
  }
  return createError(message, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

configurationError = function(message) {
  return createError(message, {
    isConfigurationError: true
  });
};

module.exports = me = React.createClass({
  statics: {
    Status: Status
  },
  displayName: 'InlineSVG',
  propTypes: {
    wrapper: PropTypes.func,
    wrapperStyle: PropTypes.object,
    src: PropTypes.string.isRequired,
    className: PropTypes.string,
    preloader: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    supportTest: PropTypes.func,
    uniquifyIDs: PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      wrapper: span,
      supportTest: isSupportedEnvironment,
      uniquifyIDs: true
    };
  },
  getInitialState: function() {
    return {
      status: Status.PENDING
    };
  },
  componentDidMount: function() {
    if (this.state.status !== Status.PENDING) {
      return;
    }
    if (this.props.supportTest()) {
      if (this.props.src) {
        return this.setState({
          status: Status.LOADING
        }, this.load);
      } else {
        return delay((function(_this) {
          return function() {
            return _this.fail(configurationError('Missing source'));
          };
        })(this))();
      }
    } else {
      return delay((function(_this) {
        return function() {
          return _this.fail(unsupportedBrowserError());
        };
      })(this))();
    }
  },
  fail: function(error) {
    var status;
    status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;
    return this.setState({
      status: status
    }, (function(_this) {
      return function() {
        var _base;
        return typeof (_base = _this.props).onError === "function" ? _base.onError(error) : void 0;
      };
    })(this));
  },
  handleLoad: function(err, res) {
    if (err) {
      return this.fail(err);
    }
    if (!this.isMounted()) {
      return;
    }
    return this.setState({
      loadedText: res.text,
      status: Status.LOADED
    }, (function(_this) {
      return function() {
        var _base;
        return typeof (_base = _this.props).onLoad === "function" ? _base.onLoad() : void 0;
      };
    })(this));
  },
  load: function() {
    var m, text;
    if (m = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/)) {
      text = m[1] ? atob(m[2]) : decodeURIComponent(m[2]);
      return this.handleLoad(null, {
        text: text
      });
    } else {
      return http.get(this.props.src, this.handleLoad);
    }
  },
  getClassName: function() {
    var className;
    className = "isvg " + this.state.status;
    if (this.props.className) {
      className += " " + this.props.className;
    }
    return className;
  },
  render: function() {
    return this.props.wrapper({
      className: this.getClassName(),
      style: this.props.wrapperStyle,
      dangerouslySetInnerHTML: this.state.loadedText ? {
        __html: this.processSVG(this.state.loadedText)
      } : void 0
    }, this.renderContents());
  },
  processSVG: function(svgText) {
    if (this.props.uniquifyIDs) {
      return uniquifyIDs(svgText, getHash(this.props.src));
    } else {
      return svgText;
    }
  },
  renderContents: function() {
    switch (this.state.status) {
      case Status.UNSUPPORTED:
        return this.props.children;
      case Status.PENDING:
      case Status.LOADING:
        if (this.props.preloader) {
          return new this.props.preloader;
        }
    }
  }
});