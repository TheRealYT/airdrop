function get(func) {
    const now = Date.now();

    const value = func();
    const duration = Date.now() - now;

    return {value, duration};
}

function getRandomValueFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

function mathVal() {
    var D = Math
        , fe = function () {
        return 0;
    };

    var e = D.acos || fe
        , n = D.acosh || fe
        , t = D.asin || fe
        , o = D.asinh || fe
        , i = D.atanh || fe
        , a = D.atan || fe
        , r = D.sin || fe
        , u = D.sinh || fe
        , s = D.cos || fe
        , d = D.cosh || fe
        , l = D.tan || fe
        , m = D.tanh || fe
        , p = D.exp || fe
        , _ = D.expm1 || fe
        , w = D.log1p || fe
        , v = function (y) {
        return D.pow(D.PI, y);
    }
        , T = function (y) {
        return D.log(y + D.sqrt(y * y - 1));
    }
        , M = function (y) {
        return D.log(y + D.sqrt(y * y + 1));
    }
        , $ = function (y) {
        return D.log((1 + y) / (1 - y)) / 2;
    }
        , C = function (y) {
        return D.exp(y) - 1 / D.exp(y) / 2;
    }
        , E = function (y) {
        return (D.exp(y) + 1 / D.exp(y)) / 2;
    }
        , x = function (y) {
        return D.exp(y) - 1;
    }
        , G = function (y) {
        return (D.exp(2 * y) - 1) / (D.exp(2 * y) + 1);
    }
        , H = function (y) {
        return D.log(1 + y);
    };
    return {
        acos: e(.12312423423423424),
        acosh: n(1e308),
        acoshPf: T(1e154),
        asin: t(.12312423423423424),
        asinh: o(1),
        asinhPf: M(1),
        atanh: i(.5),
        atanhPf: $(.5),
        atan: a(.5),
        sin: r(-1e300),
        sinh: u(1),
        sinhPf: C(1),
        cos: s(10.000000000123),
        cosh: d(1),
        coshPf: E(1),
        tan: l(-1e300),
        tanh: m(1),
        tanhPf: G(1),
        exp: p(1),
        expm1: _(1),
        expm1Pf: x(1),
        log1p: w(10),
        log1pPf: H(10),
        powPI: v(-100),
    };
}

export function fingerprint() {
    const components = {
        'fonts': get(() => [getRandomValueFromArray(['sans-serif-thin', 'serif', 'monospace', 'cursive'])]),
        'domBlockers': get(() => []),
        'fontPreferences': get(() => ({
            'default': getRandomNumber(100, 200),
            'apple': getRandomNumber(100, 200),
            'serif': getRandomNumber(100, 200),
            'sans': getRandomNumber(100, 200),
            'mono': getRandomNumber(100, 200),
            'min': getRandomNumber(50, 100),
            'system': getRandomNumber(100, 200),
        })),
        'audio': get(() => getRandomNumber(0, 0.0001)),
        'screenFrame': get(() => [0, 0, 0, 0]),
        'canvas': null,
        'osCpu': get(() => navigator.oscpu),
        'languages': get(() => navigator.languages.filter(v => v.length === 2)),
        'colorDepth': get(() => screen.colorDepth),
        'deviceMemory': get(() => navigator.deviceMemory),
        'screenResolution': get(() => [screen.width, screen.height]),
        'hardwareConcurrency': get(() => navigator.hardwareConcurrency),
        'timezone': get(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
        'sessionStorage': get(() => !!window.sessionStorage),
        'localStorage': get(() => !!window.localStorage),
        'indexedDB': get(() => !!window.indexedDB),
        'openDatabase': get(() => !!window.openDatabase),
        'cpuClass': get(() => navigator.cpuClass),
        'platform': get(() => navigator.platform),
        'plugins': get(() => Array.from(navigator.plugins).map(plugin => plugin.name)),
        'touchSupport': get(() => ({
            maxTouchPoints: navigator.maxTouchPoints,
            touchEvent: 'ontouchstart' in window,
            touchStart: 'ontouchstart' in document.documentElement,
        })),
        'vendor': get(() => navigator.vendor),
        'vendorFlavors': get(() => []),
        'cookiesEnabled': get(() => navigator.cookieEnabled),
        'colorGamut': get(() => matchMedia('(color-gamut: srgb)').matches ? 'srgb' : null),
        'invertedColors': get(() => window.matchMedia('(inverted-colors: inverted)').matches),
        'forcedColors': get(() => window.matchMedia('(forced-colors: active)').matches),
        'monochrome': get(() => window.matchMedia('(monochrome)').matches ? 1 : 0),
        'contrast': get(() => window.matchMedia('(forced-colors: active)').matches ? 1 : 0),
        'reducedMotion': get(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        'reducedTransparency': get(() => window.matchMedia('(prefers-reduced-transparency: reduce)').matches),
        'hdr': get(() => matchMedia('(dynamic-range: high)').matches),
        'math': get(() => ({...mathVal()})),
        'pdfViewerEnabled': get(() => 'pdfViewerEnabled' in navigator ? navigator.pdfViewerEnabled : false),
        'architecture': get(() => Math.floor(getRandomNumber(100, 200))),
        'applePay': get(() => typeof window.ApplePaySession?.canMakePayments == 'function' ? (window.ApplePaySession.canMakePayments() ? 1 : 0) : -1),
        'privateClickMeasurement': get(() => {
            let e, n = document.createElement('a'),
                t = (e = n.attributionSourceId) !== null && e !== void 0 ? e : n.attributionsourceid;
            return (t === void 0 ? void 0 : String(t));
        }),
        'webGlBasics': get(() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

            return {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                vendorUnmasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'N/A',
                renderer: gl.getParameter(gl.RENDERER),
                rendererUnmasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'N/A',
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            };
        }),
        'webGlExtensions': null,
    };

    return {
        'version': '4.2.1',
        'visitorId': Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        components,
    };
}