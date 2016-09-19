// main application
(function() {

	'use strict';

	// register service worker
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('/service-worker.js')
			.then(function() { console.log('service worker: registered'); });
  }

	var
		// library functions
		lib = {
			id: function(idName) { return document.getElementById(idName); },
			query: function(sel, doc) { doc = doc || document; return doc.querySelector(sel); },
			int: function(num) { return Math.round(parseFloat(num) || 0); }
		},

		// DOM elements
		dom = {
			form:				lib.query('form'),
			date:				lib.id('date'),
			loader:			lib.id('loader'),
			set1: {
				currency:	lib.id('currency1'),
				number: 	lib.id('number1')
			},
			set2: {
				currency:	lib.id('currency2'),
				number:		lib.id('number2'),
			}
		},

		// initial setup
		inp = dom[localStorage.getItem('input') || 'set1'],
		out = dom[localStorage.getItem('output') || 'set2'],
		forex = { base: 'EUR', date: '', rates: {} },
		isActive = false;

	// define events
	dom.form.addEventListener('change', calculate, false);
	dom.form.addEventListener('keydown', calculate, false);
	dom.form.addEventListener('keyup', calculate, false);
	dom.form.addEventListener('submit', calculate, false);

	// populate form
	var
		currency1 = localStorage.getItem('currency1'),
		currency2 = localStorage.getItem('currency2');

	if (currency1 !== null) dom.set1.currency.selectedIndex = lib.int(currency1);
	if (currency2 !== null) dom.set2.currency.selectedIndex = lib.int(currency2);

	dom.set1.number.value = localStorage.getItem('number1') || 0;
	dom.set2.number.value = localStorage.getItem('number2') || 0;

	// fetch latest rates and activate
	getRates();


	// fetch latest rates via Ajax request
	function getRates() {

		var url = 'https://api.fixer.io/latest';
		dom.date.textContent = 'updating';

		// is data in cache?
		if ('caches' in window) {
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function cacheUpdate(json) {
						forex = json;
						refreshRates(0);
          });
        }
      });
    }

		var req = new XMLHttpRequest();
		req.open('GET', url);
		req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

		// 30 second timeout
		req.timeout = 30000;
		req.ontimeout = function() {
			req.abort();
			getRatesAgain(1);
		};

		// state change
		req.onreadystatechange = function() {

			if (req.readyState != 4) return;
			var err = (req.status != 200);
			if (!err) {
				try { forex = JSON.parse(req.response); }
				catch(e) { err = true; }
			}

			if (err) {
				// try refresh in one hour
				refreshRates(1);
			}
			else {
				// got rates - update in six hours
				refreshRates(6);
			}

		};

		// start request
		req.send();

	}


	// retry rates fetch
	function refreshRates(time) {

		dom.date.textContent = (forex.date ? 'rates at ' + forex.date : 'rates outdated');
		calculate();
		active(true);
		if (time) setTimeout(getRates, time * 3600000);

	}


	// calculate and store values
	function calculate(e) {

		// prevent submit
		if (e && e.type == 'submit') e.preventDefault();

		// invalid key?
		if (e && e.type == 'keydown') {
			var k = e.keyCode;
			if (k > 105 || (k > 57 && k < 96)) e.preventDefault();
			return;
		}

		// active value
		var t = e && e.target;
		if (t == dom.set2.number || t == dom.set2.currency) {
			inp = dom.set2;
			out = dom.set1;
			localStorage.setItem('input', 'set2');
			localStorage.setItem('output', 'set1');
		}
		else {
			inp = dom.set1;
			out = dom.set2;
			localStorage.setItem('input', 'set1');
			localStorage.setItem('output', 'set2');
		}

		// conversion calculation
		var
			valueInp = lib.int(inp.number.value),
			valueOut = lib.int(valueInp * (1 / (forex.rates[inp.currency.value] || 1)) * (forex.rates[out.currency.value] || 1));

		// output values
		if (String(valueInp) !== String(inp.number.value)) inp.number.value = valueInp;
		if (String(valueOut) !== String(out.number.value)) out.number.value = valueOut;

		// store user defaults
		localStorage.setItem('currency1', dom.set1.currency.selectedIndex);
		localStorage.setItem('number1', dom.set1.number.value);
		localStorage.setItem('currency2', dom.set2.currency.selectedIndex);
		localStorage.setItem('number2', dom.set2.number.value);

	}


	// start/stop loading spinner
	function active(on) {
		if (on && !isActive) {
			dom.form.classList.remove('off');
			dom.loader.classList.add('off');
		}
		else if (!on && isActive) {
			dom.form.classList.add('off');
			dom.loader.classList.remove('off');
		}
		isActive = on;
	}

}());
