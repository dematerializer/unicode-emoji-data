function codepointSequenceToString (codepointSequence) {
	// string: codepointSequenceToString('0032-FE0E')
	// argument list: codepointSequenceToString('0032', 'FE0F')
	// array: codepointSequenceToString(['0032', 'FE0F', '20E3'])
	const sequence = arguments.length > 1 ? Array.prototype.slice.call(arguments) : codepointSequence;
	const codepoints = typeof sequence === 'string' ? sequence.split('-') : sequence;
	return codepoints
		.map(codepoint => String.fromCodePoint(parseInt(codepoint, 16)))
		.reduce((str, cp) => (str + cp), '');
};

console.log(codepointSequenceToString('0032')); // '2' implicit default text representation
console.log(codepointSequenceToString('0032-20E3')); // '2' implicit default text representation with keycap
console.log(codepointSequenceToString('0032-FE0E')); // '2' explicit text representation
console.log(codepointSequenceToString('0032-FE0E-20E3')); // '2' explicit text representation with keycap
console.log(codepointSequenceToString('0032-FE0F')); // '2' explicit emoji representation
console.log(codepointSequenceToString('0032-FE0F-20E3')); // '2' explicit emoji representation with keycap

console.log(codepointSequenceToString('1F4A9')); // '💩' implicit emoji representation
console.log(codepointSequenceToString('1F4A9-FE0F')); // '💩' explicit emoji representation
console.log(codepointSequenceToString('1F4A9-FE0E')); // '💩' explicit text representation, makes no sense since this is a pure emoji, fallback to emoji representation
console.log(codepointSequenceToString('1F4A9-FE0F-20E0')); // experiment: '💩' explicit emoji representation with keycap
