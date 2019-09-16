(function () {
  /*
  CryptoJS v3.1.2
  build: core enc-base64 md5 sha1 hmac
  code.google.com/p/crypto-js
  (c) 2009-2013 by Jeff Mott. All rights reserved.
  code.google.com/p/crypto-js/wiki/License
  */
  var CryptoJS = CryptoJS || function (p, m) {
    var c = {}, d = c.lib = {}, l = function () { }, r = d.Base = { extend: function (b) { l.prototype = this; var n = new l; b && n.mixIn(b); n.hasOwnProperty("init") || (n.init = function () { n.$super.init.apply(this, arguments) }); n.init.prototype = n; n.$super = this; return n }, create: function () { var b = this.extend(); b.init.apply(b, arguments); return b }, init: function () { }, mixIn: function (b) { for (var n in b) b.hasOwnProperty(n) && (this[n] = b[n]); b.hasOwnProperty("toString") && (this.toString = b.toString) }, clone: function () { return this.init.prototype.extend(this) } },
    j = d.WordArray = r.extend({
      init: function (b, n) { b = this.words = b || []; this.sigBytes = n != m ? n : 4 * b.length }, toString: function (b) { return (b || t).stringify(this) }, concat: function (b) { var n = this.words, a = b.words, k = this.sigBytes; b = b.sigBytes; this.clamp(); if (k % 4) for (var c = 0; c < b; c++)n[k + c >>> 2] |= (a[c >>> 2] >>> 24 - 8 * (c % 4) & 255) << 24 - 8 * ((k + c) % 4); else if (65535 < a.length) for (c = 0; c < b; c += 4)n[k + c >>> 2] = a[c >>> 2]; else n.push.apply(n, a); this.sigBytes += b; return this }, clamp: function () {
        var b = this.words, a = this.sigBytes; b[a >>> 2] &= 4294967295 <<
          32 - 8 * (a % 4); b.length = p.ceil(a / 4)
      }, clone: function () { var b = r.clone.call(this); b.words = this.words.slice(0); return b }, random: function (b) { for (var a = [], k = 0; k < b; k += 4)a.push(4294967296 * p.random() | 0); return new j.init(a, b) }
    }), q = c.enc = {}, t = q.Hex = {
      stringify: function (b) { var a = b.words; b = b.sigBytes; for (var k = [], c = 0; c < b; c++) { var d = a[c >>> 2] >>> 24 - 8 * (c % 4) & 255; k.push((d >>> 4).toString(16)); k.push((d & 15).toString(16)) } return k.join("") }, parse: function (b) {
        for (var a = b.length, k = [], c = 0; c < a; c += 2)k[c >>> 3] |= parseInt(b.substr(c,
          2), 16) << 24 - 4 * (c % 8); return new j.init(k, a / 2)
      }
    }, a = q.Latin1 = { stringify: function (b) { var a = b.words; b = b.sigBytes; for (var c = [], k = 0; k < b; k++)c.push(String.fromCharCode(a[k >>> 2] >>> 24 - 8 * (k % 4) & 255)); return c.join("") }, parse: function (b) { for (var a = b.length, k = [], c = 0; c < a; c++)k[c >>> 2] |= (b.charCodeAt(c) & 255) << 24 - 8 * (c % 4); return new j.init(k, a) } }, s = q.Utf8 = { stringify: function (b) { try { return decodeURIComponent(escape(a.stringify(b))) } catch (c) { throw Error("Malformed UTF-8 data"); } }, parse: function (b) { return a.parse(unescape(encodeURIComponent(b))) } },
    k = d.BufferedBlockAlgorithm = r.extend({
      reset: function () { this._data = new j.init; this._nDataBytes = 0 }, _append: function (b) { "string" == typeof b && (b = s.parse(b)); this._data.concat(b); this._nDataBytes += b.sigBytes }, _process: function (b) { var a = this._data, c = a.words, k = a.sigBytes, d = this.blockSize, u = k / (4 * d), u = b ? p.ceil(u) : p.max((u | 0) - this._minBufferSize, 0); b = u * d; k = p.min(4 * b, k); if (b) { for (var l = 0; l < b; l += d)this._doProcessBlock(c, l); l = c.splice(0, b); a.sigBytes -= k } return new j.init(l, k) }, clone: function () {
        var b = r.clone.call(this);
        b._data = this._data.clone(); return b
      }, _minBufferSize: 0
    }); d.Hasher = k.extend({
      cfg: r.extend(), init: function (b) { this.cfg = this.cfg.extend(b); this.reset() }, reset: function () { k.reset.call(this); this._doReset() }, update: function (b) { this._append(b); this._process(); return this }, finalize: function (b) { b && this._append(b); return this._doFinalize() }, blockSize: 16, _createHelper: function (b) { return function (a, k) { return (new b.init(k)).finalize(a) } }, _createHmacHelper: function (b) {
        return function (a, k) {
          return (new u.HMAC.init(b,
            k)).finalize(a)
        }
      }
    }); var u = c.algo = {}; return c
  }(Math);
  (function () {
    var p = CryptoJS, m = p.lib.WordArray; p.enc.Base64 = {
      stringify: function (c) { var d = c.words, l = c.sigBytes, r = this._map; c.clamp(); c = []; for (var j = 0; j < l; j += 3)for (var q = (d[j >>> 2] >>> 24 - 8 * (j % 4) & 255) << 16 | (d[j + 1 >>> 2] >>> 24 - 8 * ((j + 1) % 4) & 255) << 8 | d[j + 2 >>> 2] >>> 24 - 8 * ((j + 2) % 4) & 255, m = 0; 4 > m && j + 0.75 * m < l; m++)c.push(r.charAt(q >>> 6 * (3 - m) & 63)); if (d = r.charAt(64)) for (; c.length % 4;)c.push(d); return c.join("") }, parse: function (c) {
        var d = c.length, l = this._map, r = l.charAt(64); r && (r = c.indexOf(r), -1 != r && (d = r)); for (var r = [], j = 0, q = 0; q <
          d; q++)if (q % 4) { var t = l.indexOf(c.charAt(q - 1)) << 2 * (q % 4), a = l.indexOf(c.charAt(q)) >>> 6 - 2 * (q % 4); r[j >>> 2] |= (t | a) << 24 - 8 * (j % 4); j++ } return m.create(r, j)
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    }
  })();
  (function (p) {
    function m(a, c, b, n, d, l, j) { a = a + (c & b | ~c & n) + d + j; return (a << l | a >>> 32 - l) + c } function c(a, c, b, n, d, l, j) { a = a + (c & n | b & ~n) + d + j; return (a << l | a >>> 32 - l) + c } function d(a, c, b, d, l, j, q) { a = a + (c ^ b ^ d) + l + q; return (a << j | a >>> 32 - j) + c } function l(a, c, b, d, l, j, q) { a = a + (b ^ (c | ~d)) + l + q; return (a << j | a >>> 32 - j) + c } for (var r = CryptoJS, j = r.lib, q = j.WordArray, t = j.Hasher, j = r.algo, a = [], s = 0; 64 > s; s++)a[s] = 4294967296 * p.abs(p.sin(s + 1)) | 0; j = j.MD5 = t.extend({
      _doReset: function () { this._hash = new q.init([1732584193, 4023233417, 2562383102, 271733878]) },
      _doProcessBlock: function (k, j) {
        for (var b = 0; 16 > b; b++) { var n = j + b, q = k[n]; k[n] = (q << 8 | q >>> 24) & 16711935 | (q << 24 | q >>> 8) & 4278255360 } var b = this._hash.words, n = k[j + 0], q = k[j + 1], r = k[j + 2], t = k[j + 3], s = k[j + 4], p = k[j + 5], v = k[j + 6], w = k[j + 7], x = k[j + 8], y = k[j + 9], z = k[j + 10], A = k[j + 11], B = k[j + 12], C = k[j + 13], D = k[j + 14], E = k[j + 15], e = b[0], f = b[1], g = b[2], h = b[3], e = m(e, f, g, h, n, 7, a[0]), h = m(h, e, f, g, q, 12, a[1]), g = m(g, h, e, f, r, 17, a[2]), f = m(f, g, h, e, t, 22, a[3]), e = m(e, f, g, h, s, 7, a[4]), h = m(h, e, f, g, p, 12, a[5]), g = m(g, h, e, f, v, 17, a[6]), f = m(f, g, h, e, w, 22, a[7]),
          e = m(e, f, g, h, x, 7, a[8]), h = m(h, e, f, g, y, 12, a[9]), g = m(g, h, e, f, z, 17, a[10]), f = m(f, g, h, e, A, 22, a[11]), e = m(e, f, g, h, B, 7, a[12]), h = m(h, e, f, g, C, 12, a[13]), g = m(g, h, e, f, D, 17, a[14]), f = m(f, g, h, e, E, 22, a[15]), e = c(e, f, g, h, q, 5, a[16]), h = c(h, e, f, g, v, 9, a[17]), g = c(g, h, e, f, A, 14, a[18]), f = c(f, g, h, e, n, 20, a[19]), e = c(e, f, g, h, p, 5, a[20]), h = c(h, e, f, g, z, 9, a[21]), g = c(g, h, e, f, E, 14, a[22]), f = c(f, g, h, e, s, 20, a[23]), e = c(e, f, g, h, y, 5, a[24]), h = c(h, e, f, g, D, 9, a[25]), g = c(g, h, e, f, t, 14, a[26]), f = c(f, g, h, e, x, 20, a[27]), e = c(e, f, g, h, C, 5, a[28]), h = c(h, e,
            f, g, r, 9, a[29]), g = c(g, h, e, f, w, 14, a[30]), f = c(f, g, h, e, B, 20, a[31]), e = d(e, f, g, h, p, 4, a[32]), h = d(h, e, f, g, x, 11, a[33]), g = d(g, h, e, f, A, 16, a[34]), f = d(f, g, h, e, D, 23, a[35]), e = d(e, f, g, h, q, 4, a[36]), h = d(h, e, f, g, s, 11, a[37]), g = d(g, h, e, f, w, 16, a[38]), f = d(f, g, h, e, z, 23, a[39]), e = d(e, f, g, h, C, 4, a[40]), h = d(h, e, f, g, n, 11, a[41]), g = d(g, h, e, f, t, 16, a[42]), f = d(f, g, h, e, v, 23, a[43]), e = d(e, f, g, h, y, 4, a[44]), h = d(h, e, f, g, B, 11, a[45]), g = d(g, h, e, f, E, 16, a[46]), f = d(f, g, h, e, r, 23, a[47]), e = l(e, f, g, h, n, 6, a[48]), h = l(h, e, f, g, w, 10, a[49]), g = l(g, h, e, f,
              D, 15, a[50]), f = l(f, g, h, e, p, 21, a[51]), e = l(e, f, g, h, B, 6, a[52]), h = l(h, e, f, g, t, 10, a[53]), g = l(g, h, e, f, z, 15, a[54]), f = l(f, g, h, e, q, 21, a[55]), e = l(e, f, g, h, x, 6, a[56]), h = l(h, e, f, g, E, 10, a[57]), g = l(g, h, e, f, v, 15, a[58]), f = l(f, g, h, e, C, 21, a[59]), e = l(e, f, g, h, s, 6, a[60]), h = l(h, e, f, g, A, 10, a[61]), g = l(g, h, e, f, r, 15, a[62]), f = l(f, g, h, e, y, 21, a[63]); b[0] = b[0] + e | 0; b[1] = b[1] + f | 0; b[2] = b[2] + g | 0; b[3] = b[3] + h | 0
      }, _doFinalize: function () {
        var a = this._data, c = a.words, b = 8 * this._nDataBytes, j = 8 * a.sigBytes; c[j >>> 5] |= 128 << 24 - j % 32; var d = p.floor(b /
          4294967296); c[(j + 64 >>> 9 << 4) + 15] = (d << 8 | d >>> 24) & 16711935 | (d << 24 | d >>> 8) & 4278255360; c[(j + 64 >>> 9 << 4) + 14] = (b << 8 | b >>> 24) & 16711935 | (b << 24 | b >>> 8) & 4278255360; a.sigBytes = 4 * (c.length + 1); this._process(); a = this._hash; c = a.words; for (b = 0; 4 > b; b++)j = c[b], c[b] = (j << 8 | j >>> 24) & 16711935 | (j << 24 | j >>> 8) & 4278255360; return a
      }, clone: function () { var a = t.clone.call(this); a._hash = this._hash.clone(); return a }
    }); r.MD5 = t._createHelper(j); r.HmacMD5 = t._createHmacHelper(j)
  })(Math);
  (function () {
    var p = CryptoJS, m = p.lib, c = m.WordArray, d = m.Hasher, l = [], m = p.algo.SHA1 = d.extend({
      _doReset: function () { this._hash = new c.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (c, j) {
        for (var d = this._hash.words, m = d[0], a = d[1], s = d[2], k = d[3], p = d[4], b = 0; 80 > b; b++) {
          if (16 > b) l[b] = c[j + b] | 0; else { var n = l[b - 3] ^ l[b - 8] ^ l[b - 14] ^ l[b - 16]; l[b] = n << 1 | n >>> 31 } n = (m << 5 | m >>> 27) + p + l[b]; n = 20 > b ? n + ((a & s | ~a & k) + 1518500249) : 40 > b ? n + ((a ^ s ^ k) + 1859775393) : 60 > b ? n + ((a & s | a & k | s & k) - 1894007588) : n + ((a ^ s ^
            k) - 899497514); p = k; k = s; s = a << 30 | a >>> 2; a = m; m = n
        } d[0] = d[0] + m | 0; d[1] = d[1] + a | 0; d[2] = d[2] + s | 0; d[3] = d[3] + k | 0; d[4] = d[4] + p | 0
      }, _doFinalize: function () { var c = this._data, d = c.words, l = 8 * this._nDataBytes, m = 8 * c.sigBytes; d[m >>> 5] |= 128 << 24 - m % 32; d[(m + 64 >>> 9 << 4) + 14] = Math.floor(l / 4294967296); d[(m + 64 >>> 9 << 4) + 15] = l; c.sigBytes = 4 * d.length; this._process(); return this._hash }, clone: function () { var c = d.clone.call(this); c._hash = this._hash.clone(); return c }
    }); p.SHA1 = d._createHelper(m); p.HmacSHA1 = d._createHmacHelper(m)
  })();
  (function () {
    var p = CryptoJS, m = p.enc.Utf8; p.algo.HMAC = p.lib.Base.extend({
      init: function (c, d) { c = this._hasher = new c.init; "string" == typeof d && (d = m.parse(d)); var l = c.blockSize, r = 4 * l; d.sigBytes > r && (d = c.finalize(d)); d.clamp(); for (var j = this._oKey = d.clone(), q = this._iKey = d.clone(), p = j.words, a = q.words, s = 0; s < l; s++)p[s] ^= 1549556828, a[s] ^= 909522486; j.sigBytes = q.sigBytes = r; this.reset() }, reset: function () { var c = this._hasher; c.reset(); c.update(this._iKey) }, update: function (c) { this._hasher.update(c); return this }, finalize: function (c) {
        var d =
          this._hasher; c = d.finalize(c); d.reset(); return d.finalize(this._oKey.clone().concat(c))
      }
    })
  })();

  const $ = require('jquery')
  // Keep keys here, outside of the S3Client object so other JS can't steal them
  var clientID = 0;
  var keys = {};

  var S3Client = function (awsKey, awsSecret) {
    this.clientID = clientID++;
    keys[this.clientID] = { key: awsKey, secret: awsSecret };
  };

  var contentMD5 = function (req) {
    if (req.method === 'GET') {
      return '';
    }

    var sum = CryptoJS.enc.Base64.stringify(CryptoJS.MD5(req.body));
    return sum;
  }

  var contentType = function (req) {
    if (req.method === 'GET') {
      return '';
    } else {
      return req.contentType;
    }
  }

  var generatePreSignedURL = function (client, req) {
    req.expires = Math.floor((new Date).getTime() / 1000) + 30000;
    var url = 'https://s3.amazonaws.com/';
    if (!!req.bucket) {
      url += req.bucket;
    }

    if (!!req.key) {
      url += '/' + req.key;
    }

    url = url.replace(/ /g, '+');

    var sig = makeAWSSignature(client, req);
    url += '?Signature=' + encodeURIComponent(sig) +
      '&Expires=' + req.expires +
      '&AWSAccessKeyId=' + keys[client.clientID].key;

    return url;
  };

  var makeDate = function (req) {
    return '' + req.expires;
  };

  var makeAWSAuthorizationHeader = function (client, request) {
    // AWS [key]:[signature]
    return 'AWS ' + keys[client.clientID].key + ':' + makeAWSSignature(client, request);
  };

  var makeAWSSignature = function (client, request) {
    var stringToSign = makeAWSStringToSign(request);

    return CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA1(stringToSign, keys[client.clientID].secret)
    );
  };

  var makeAWSStringToSign = function (request) {
    return request.method + '\n' +
      contentMD5(request) + '\n' +
      contentType(request) + '\n' +
      makeDate(request) + '\n' +
      makeCanonicalizedAmzHeaders(request) +
      makeCanonicalizedResource(request);
  };

  /**
   * If the request specifies a bucket using the HTTP Host header (virtual
   * hosted-style), append the bucket name preceded by a "/"
   * (e.g., "/bucketname").
   * For path-style requests and requests that don't address a bucket,
   * do nothing. For more information on virtual hosted-style requests,
   * see Virtual Hosting of Buckets.
   *
   * For a virtual hosted-style request
   * "https://johnsmith.s3.amazonaws.com/photos/puppy.jpg",
   * the CanonicalizedResource is "/johnsmith".
   *
   * For the path-style request,
   * "https://s3.amazonaws.com/johnsmith/photos/puppy.jpg",
   * the CanonicalizedResource is "".
   */
  var makeCanonicalizedResource = function (req) {
    var str = '/';

    if (!!req.bucket) {
      str += req.bucket;
    }

    if (!!req.key) {
      str += '/' + req.key;
    }

    str = str.replace(/ /g, '+');

    return str;
  };

  var makeCanonicalizedAmzHeaders = function (req) {
    return '';
    // return 'x-amz-date:'+req.date+'\n';
  };

  var iframe = null;
  var iframeIsLoaded = false;
  var reqId = 0;

  S3Client.prototype.getEndcodedUrl = function () {
    var req = {
      method: 'GET'
    };
   var uls =  generatePreSignedURL(this, req)
    return uls
  }


  S3Client.prototype.listBuckets = function (callback) {
    var req = {
      method: 'GET'
    };

    var myReqId = reqId++;

    var url = generatePreSignedURL(this, req);

    if (iframe === null) {
      iframe = document.createElement("iframe");
      iframe.id = 'dtjm.github.com.s3client.js.proxy'
      iframe.style.display = 'none';
      iframe.src = 'https://s3.amazonaws.com/s3browserproxy/proxy.html';
      document.body.appendChild(iframe);
    }

    var onIframeLoad = function () {
      var req = myReqId + '\n' + url;
      iframe.contentWindow.postMessage(req, 'https://s3.amazonaws.com');
      iframe.removeEventListener('load', onIframeLoad);
      iframeIsLoaded = true;
    };

    if (!iframeIsLoaded) {
      iframe.addEventListener("load", onIframeLoad);
    } else {
      onIframeLoad();
    }

    var onMessage = function (msg) {
      if (typeof msg.data == 'string' && msg.data.length > 50){
        var rsp = JSON.parse(msg.data);
      }
      
      var rspId = rsp ? rsp[0] : null;

      if (rspId !== myReqId) {
        return;
      }

      window.removeEventListener('message', onMessage);

      var statusCode = rsp[1];
      var headerText = rsp[2];
      var body = rsp[3];

      var headers = {};
      var lines = headerText.split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (lines[i] === '') continue;
        var parts = lines[i].split(': ');
        headers[parts[0].toLowerCase()] = parts[1];
      }

      if (statusCode !== 200) {
        callback({
          code: statusCode,
          headers: headers,
          body: rsp[2]
        })
      }

      var xmlDoc = (new DOMParser).parseFromString(body, 'application/xml');
      var rsp = {
        Owner: {
          ID: xmlDoc.querySelector('Owner ID').textContent,
          DisplayName: xmlDoc.querySelector('Owner DisplayName').textContent,
        },
        Buckets: []
      };

      var buckets = xmlDoc.querySelectorAll('Buckets Bucket');
      for (var i = 0; i < buckets.length; i++) {
        rsp.Buckets.push({
          name: buckets[i].querySelector('Name').textContent,
          creationdate: buckets[i].querySelector('CreationDate').textContent
        });
      }
      callback(null, rsp);
    };

    window.addEventListener('message', onMessage);
  };

  // Export to AMD if available, otherwise export to global
  if (typeof define !== 'undefined' && define.amd) {
    define("s3client", function () {
      return S3Client;
    });
  } else {
    /* this.S3Client = S3Client;
    this.CryptoJS = CryptoJS; */
  }
})();
