'use strict';

angular
	.module('DigestAuthInterceptor', [
		'LocalStorageModule',
		'angular-md5'
	])
	.provider('digestAuthInterceptor', digestAuthInterceptorProvider);

function digestAuthInterceptorProvider() {
	var username = null,
		password = null,
		maximumRetries = 2,
		authenticationHeader = 'WWW-Authenticate',
		credentialsInvalidPath = '/';

	this.setMaximumRetries = function(value) { maximumRetries = value; };
	this.setCustomAuthenticationHeader = function(value) { authenticationHeader = value; };
	this.setCredentialsInvalidPath = function(value) { credentialsInvalidPath = value; };

	this.$get = digestAuthInterceptorFactory;

	digestAuthInterceptorFactory.$inject = ['$rootScope','$q', '$injector', '$location', 'md5', 'authDigestData', 'localStorageService'];
	function digestAuthInterceptorFactory($rootScope, $q, $injector, $location, md5, authDigestData, localStorageService) {
		return DigestAuthInterceptor(maximumRetries, authenticationHeader, credentialsInvalidPath, $rootScope, $q, $injector, $location, md5, authDigestData, localStorageService);
	}
}

function DigestAuthInterceptor(maximumRetries, authenticationHeader, credentialsInvalidPath, $rootScope, $q, $injector, $location, md5, authDigestData, localStorageService) {
	var authHeader = null,
		username = null,
		password = null,
		HA1 = null;
	var isInternal = false;

	var digest = {
		failedQueue: {},
		request: request,
		responseError: responseError
	};

	return digest;

	function request(config) {
        // * if there's no login need, skip it
        if ( config == null || config.isAuthenticate == null || config.isAuthenticate == false )
            return config;

        var oldUsername = username;
        var oldPassword = password;
        username = authDigestData.username;
        password = authDigestData.password;
		HA1 = authDigestData.HA1;

		// console.log( username + "|" + password + "|" + HA1 );

        // * if it is a new request and the username and password have been changed
		var isInformationValid = ( HA1 == null && username != null && password != null ) || ( HA1 != null && username == null && password == null );
		var isInformationTheSameAsLastTime = oldUsername == username && oldPassword == password;
        if ( isInformationValid && !isInformationTheSameAsLastTime ) {
            // * clear the buffer
            authHeader = null;
            HA1 = null;
            digest.failedQueue = {};
        }

		var header = createHeader(config.method, config.url);
		if (header) {
			config.headers.Authorization = header;
		}

		return config;
	}

	function responseError(rejection) {

		if ((rejection.status !== 400 && rejection.status !== 401) ||
			typeof rejection.config === 'undefined' ||
			typeof rejection.config.headers === 'undefined'
		) {
			// * Unknown error
			return $q.reject(rejection);
		}

		if ( rejection.config == null || rejection.config.isAuthenticate == null || rejection.config.isAuthenticate == false )
			return $q.reject(rejection);

		console.log( "digest-responseError: authentication process" );

		if (typeof rejection.config.headers.authorization !== 'undefined') {
			rejection.config.headers.Authorization = rejection.config.headers.authorization;
			delete rejection.config.headers.authorization;
		}

		if (rejection.status === 400) {
			// * Change (400) bad request to (401) not authenticated
			if (typeof rejection.config.headers.Authorization !== 'undefined') {
				rejection.status = 401;
				authHeader = null;
			}
		}

		if (rejection.status !== 401) {
			// * Other rejections
			return $q.reject(rejection);
		}

		if (typeof rejection.config.headers.Authorization !== 'undefined') {
			if (typeof digest.failedQueue[rejection.config.url] === 'undefined') {
				digest.failedQueue[rejection.config.url] = -1;
			}

			digest.failedQueue[rejection.config.url] += 1;
		}

		// * Queue maxed out
		if (digest.failedQueue[rejection.config.url] === maximumRetries) {
			delete digest.failedQueue[rejection.config.url];
			return $q.reject(rejection);
		}

		authHeader = rejection.headers(authenticationHeader);
		if (!authHeader) {
			// * Server failed to send header for digest response
			return $q.reject(rejection);
		}

/*		if (!username || !password) {
			username = authDigestData.username;
			password = authDigestData.password;
		}

		if ((!username || !password) && !HA1) {
			// $location.path(credentialsInvalidPath);
			alert( "reject is called" );
			return $q.reject(rejection);
		}*/

		var $http = $injector.get('$http'),
			header = createHeader(rejection.config.method, rejection.config.url),
			deferredResponse = $q.defer();

		$http.defaults.headers.common.Authorization = header;
		rejection.config.headers.Authorization = header;

		delete $http.defaults.headers.common.authorization;
		delete rejection.config.headers.authorization;

		$http({
			method:		rejection.config.method,
			url:    	rejection.config.url,
			params:		rejection.config.params,
			data:   	rejection.config.data,
			headers:	rejection.config.headers,
			crossDomain: true,
			contentType: rejection.config.contentType || 'application/json',
			transformRequest: rejection.config.transformRequest,
			transformResponse: rejection.config.transformResponse,
			timeout: $rootScope.timeoutLong
		})
		.success(function(data, status, headers, config) {
			password = null;
			deferredResponse.resolve(
				{
					data: data,
					status: status,
					headers: headers,
					config: config
				}
			);
		})
		.error(function(httpReject) {
			HA1 = null;
			deferredResponse.reject( { data:httpReject } ); // bug: deferredResponse.reject( httpReject );
		});

		return deferredResponse.promise;
	}

	// private helper
	function createHeader(method, url) {

		if (authHeader === null) {
			// * server failed to send the authHeader
			return null;
		}

		var	nonce,
			realm,
			qop,
			opaque,
			algorithm,
			// reg = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/,
			ws = '(?:(?:\\r\\n)?[ \\t])+',
			token = '(?:[\\x21\\x23-\\x27\\x2A\\x2B\\x2D\\x2E\\x30-\\x39\\x3F\\x41-\\x5A\\x5E-\\x7A\\x7C\\x7E]+)',
			quotedString = '"(?:[\\x00-\\x0B\\x0D-\\x21\\x23-\\x5B\\\\x5D-\\x7F]|' + ws + '|\\\\[\\x00-\\x7F])*"',
			tokenizer = new RegExp(token + '(?:=(?:' + quotedString + '|' + token + '))?', 'g'),
			tokens = authHeader.match(tokenizer),
			uri = '/' + url.replace(/^(?:\/\/|[^\/]+)*\//, ""), // reg.exec(url),
			cnonce = genNonce(16),
			nc = '00000001';

		if (uri === null) {
			uri = url;
		}

		for (var tokenKey in tokens) {
			if (!tokens.hasOwnProperty(tokenKey)) return;
			var value = tokens[tokenKey];

			if (value.match('nonce')) nonce = unq(value);
			if (value.match('realm')) realm = unq(value);
			if (value.match('qop')) qop = unq(value);
			if (value.match('algorithm')) algorithm = unq(value);
			if (value.match('opaque')) opaque = unq(value);
		}

		// ? Customized input for test
		// nonce = "8yDNoEqNDPEFHPgmMPDsk2sKqzddhIiC";
		// cnonce= "YTY3ZTcwNmY2NjFjNzQzNWE0ZDMzMGVjYTQyZDdlNzI=";

		// http://en.wikipedia.org/wiki/Digest_access_authentication
		if (!HA1) {
			if ( username == null || password == null )
				alert( "UserName or Password is NULL!" );
			HA1 = md5.createHash([username, realm, password].join(':'));
			localStorageService.set( "HA1", HA1 );
		}

		var HA2 = md5.createHash([method, uri].join(':'));

		var response = md5.createHash([HA1, nonce, HA2].join(':'));
		if (qop === 'auth') {
			response = md5.createHash([HA1, nonce, nc, cnonce, qop, HA2].join(':'));
		}

		var map = {
			username:	[username, true],
			realm:		[realm, true],
			nonce:		[nonce, true],
			uri:		[uri, true],
			// algorithm:	['MD5', false],
			// opaque:		[opaque, true],
			// qop:		[qop, true],
			// nc:			[nc, true],
			cnonce:		[cnonce, true],
			response:	[response, true]
		};

		var rlt = "Digest " + stringifyReturn(map) + ', nc='+ nc + ", qop=" + qop;
		return rlt;

		function genNonce(b) {
			var c = [],
				e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
				a = e.length;

			for (var i = 0; i < b; ++i) {
				c.push(e[Math.random() * a |0]);
			}

			return c.join('');
		}

		function unq(value) {
			var quotedString = getRHSValue(value);
			return quotedString.substr(1, quotedString.length - 2).replace(/(?:(?:\r\n)?[ \t])+/g, ' ');
		}

		function stringifyReturn(map) {
			var intermediateArray = [];
			for (var key in map) {
				if (!map.hasOwnProperty(key)) return;
				var valueArray = map[key];

				var value = valueArray[0];
				if (valueArray[1] === true) {
					value = '"' + value + '"';
				}

				value = key + '=' + value;
				intermediateArray.push(value);
			}

			return intermediateArray.join(', ');
		}
	}

	function getRHSValue(someString) {
		return someString.substr(someString.indexOf('=') + 1);
	}
}
