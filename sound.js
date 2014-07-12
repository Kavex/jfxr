jfxr.Parameter = function(args) {
	this.label = args.label || '<unnamed>';
	this.unit = args.unit || '';
	this.type = args.type || 'float';
	var numeric = this.type == 'float' || this.type == 'int';
	this.value_ = args.defaultValue;
	this.defaultValue = this.value_;
	this.values = this.type == 'enum' ? (args.values || {}) : null;
	this.minValue = numeric ? args.minValue : null;
	this.maxValue = numeric ? args.maxValue : null;
	this.step = numeric ? (args.step || 'any') : null;
	this.digits = this.type == 'float' ? Math.max(0, Math.round(-Math.log(this.step) / Math.log(10))) : null;
	this.disabledReason_ = args.disabledReason || null;
};

Object.defineProperty(jfxr.Parameter.prototype, 'value', {
	enumerable: true,
	get: function() {
		return this.value_;
	},
	set: function(value) {
		switch (this.type) {
			case 'float':
			case 'int':
				value = parseFloat(value);
				if (value == NaN) {
					break;
				}
				if (this.type == 'int') {
					value = Math.round(value);
				}
				if (this.minValue !== null && value < this.minValue) {
					value = this.minValue;
				}
				if (this.maxValue !== null && value > this.maxValue) {
					value = this.maxValue;
				}
				this.value_ = value;
				break;
			case 'enum':
				var found = false;
				for (var v in this.values) {
					if (value == v) {
						this.value_ = v;
						found = true;
						break;
					}
				}
				if (!found) {
					return;
				}
				break;
			case 'boolean':
				this.value_ = !!value;
				break;
		}
	},
});

jfxr.Parameter.prototype.valueTitle = function() {
	if (this.type == 'enum') {
		return this.values[this.value_];
	}
	if (this.type == 'boolean') {
		return this.value_ ? 'Enabled' : 'Disabled';
	}
};

jfxr.Parameter.prototype.isDisabled = function(sound) {
	return !!(this.disabledReason_ && this.disabledReason_(sound));
};

jfxr.Parameter.prototype.whyDisabled = function(sound) {
	return this.disabledReason_ && this.disabledReason_(sound);
};

jfxr.Sound = function(context) {
	this.context = context;

	var frequencyIsMeaningless = function(sound) {
		var w = sound.waveform.value;
		if (w == 'whitenoise' || w == 'pinknoise' || w == 'brownnoise') {
			return 'Frequency and harmonics settings do not apply to noise';
		}
		return null;
	};
	var isNotSquare = function(sound) {
		if (sound.waveform.value != 'square') {
			return 'Duty cycle only applies to square waveforms';
		}
		return null;
	};

	// Sound properties
	
	this.sampleRate = new jfxr.Parameter({
		label: 'Sample rate',
		unit: 'Hz',
		defaultValue: 44100,
		minValue: 44100,
		maxValue: 44100,
		disabledReason: function() { return 'Sample rate is currently not configurable'; },
	});	

	// Frequency parameters

	this.waveform = new jfxr.Parameter({
		label: 'Waveform',
		defaultValue: 'sine',
		type: 'enum',
		values: {
			'sine': 'Sine',
			'triangle': 'Triangle',
			'sawtooth': 'Sawtooth',
			'square': 'Square',
			'tangent': 'Tangent',
			'whistle': 'Whistle',
			'breaker': 'Breaker',
			'whitenoise': 'White noise',
			'pinknoise': 'Pink noise',
			'brownnoise': 'Brown noise',
		},
	});
	this.frequency = new jfxr.Parameter({
		label: 'Frequency',
		unit: 'Hz',
		defaultValue: 440,
		minValue: 10,
		maxValue: 10000,
		step: 1,
		disabledReason: frequencyIsMeaningless,
	});
	this.frequencySlide = new jfxr.Parameter({
		label: 'Frequency slide',
		unit: 'Hz/s',
		defaultValue: 0,
		minValue: -10000,
		maxValue: 10000,
		step: 100,
		disabledReason: frequencyIsMeaningless,
	});
	this.frequencyDeltaSlide = new jfxr.Parameter({
		label: 'Frequency delta slide',
		unit: 'Hz/s²',
		defaultValue: 0,
		minValue: -500000,
		maxValue: 500000,
		step: 1000,
		disabledReason: frequencyIsMeaningless,
	});
	this.vibratoDepth = new jfxr.Parameter({
		label: 'Vibrato depth',
		unit: 'Hz',
		defaultValue: 0,
		minValue: 0,
		maxValue: 1000,
		step: 10,
		disabledReason: frequencyIsMeaningless,
	});
	this.vibratoFrequency = new jfxr.Parameter({
		label: 'Vibrato frequency',
		unit: 'Hz',
		defaultValue: 10,
		minValue: 1,
		maxValue: 1000,
		step: 1,
		disabledReason: frequencyIsMeaningless,
	});
	this.squareDuty = new jfxr.Parameter({
		label: 'Square duty',
		unit: '%',
		defaultValue: 50,
		minValue: 0,
		maxValue: 100,
		step: 1,
		disabledReason: isNotSquare,
	});
	this.squareDutySweep = new jfxr.Parameter({
		label: 'Square duty sweep',
		unit: '%/s',
		defaultValue: 0,
		minValue: -1000,
		maxValue: 1000,
		step: 5,
		disabledReason: isNotSquare,
	});

	// Amplitude parameters
	
	this.attack = new jfxr.Parameter({
		label: 'Attack',
		unit: 's',
		defaultValue: 0,
		minValue: 0,
		maxValue: 5,
		step: 0.01,
	});
	this.sustain = new jfxr.Parameter({
		label: 'Sustain',
		unit: 's',
		defaultValue: 0.1,
		minValue: 0,
		maxValue: 5,
		step: 0.01,
	});
	this.decay = new jfxr.Parameter({
		label: 'Decay',
		unit: 's',
		defaultValue: 0,
		minValue: 0,
		maxValue: 5,
		step: 0.01,
	});
	this.tremoloDepth = new jfxr.Parameter({
		label: 'Tremolo depth',
		unit: '%',
		defaultValue: 0,
		minValue: 0,
		maxValue: 100,
		step: 1,
	});
	this.tremoloFrequency = new jfxr.Parameter({
		label: 'Tremolo frequency',
		unit: 'Hz',
		defaultValue: 10,
		minValue: 1,
		maxValue: 1000,
		step: 1,
	});

	// Harmonics parameters
	
	this.harmonics = new jfxr.Parameter({
		label: 'Harmonics',
		type: 'int',
		defaultValue: 0,
		minValue: 0,
		maxValue: 5,
		step: 1,
		disabledReason: frequencyIsMeaningless,
	});
	this.harmonicsFalloff = new jfxr.Parameter({
		label: 'Harmonics falloff',
		defaultValue: 0.5,
		minValue: 0,
		maxValue: 1,
		step: 0.01,
		disabledReason: frequencyIsMeaningless,
	});

	// Filter parameters

	this.lowPassCutoff = new jfxr.Parameter({
		label: 'Low-pass cutoff',
		unit: 'Hz',
		defaultValue: 22050,
		minValue: 0,
		maxValue: 22050,
		step: 100,
	});
	this.lowPassCutoffSweep = new jfxr.Parameter({
		label: 'Low-pass cutoff sweep',
		unit: 'Hz/s',
		defaultValue: 0,
		minValue: -50000,
		maxValue: 50000,
		step: 100,
	});
	this.highPassCutoff = new jfxr.Parameter({
		label: 'High-pass cutoff',
		unit: 'Hz',
		defaultValue: 0,
		minValue: 0,
		maxValue: 22050,
		step: 100,
	});
	this.highPassCutoffSweep = new jfxr.Parameter({
		label: 'High-pass cutoff sweep',
		unit: 'Hz/s',
		defaultValue: 0,
		minValue: -50000,
		maxValue: 50000,
		step: 100,
	});

	// Output parameters
	
	this.compression = new jfxr.Parameter({
		label: 'Compression exponent',
		defaultValue: 1,
		minValue: 0,
		maxValue: 10,
		step: 0.1,
	});	
	this.normalization = new jfxr.Parameter({
		label: 'Normalization',
		type: 'boolean',
		defaultValue: true,
	});
	this.amplification = new jfxr.Parameter({
		label: 'Amplification',
		unit: '%',
		defaultValue: 100,
		minValue: 0,
		maxValue: 500,
		step: 10,
	});
};

jfxr.Sound.prototype.forEachParam = function(func) {
	for (var key in this) {
		var value = this[key];
		if (value instanceof jfxr.Parameter) {
			func(key, value);
		}
	}
};

jfxr.Sound.prototype.reset = function() {
	this.forEachParam(function(key, param) {
		param.value = param.defaultValue;
	});
};

jfxr.Sound.prototype.serialize = function() {
	var json = {
		_version: 1,
	};
	this.forEachParam(function(key, param) {
		json[key] = param.value;
	});
	return JSON.stringify(json);
};

jfxr.Sound.prototype.parse = function(str) {
	this.reset();
	if (str && str != '') {
		var json = JSON.parse(str);
		this.forEachParam(function(key, param) {
			if (key in json) {
				param.value = json[key];
			}
		});
	}
};
