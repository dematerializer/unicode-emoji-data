export function codepointSequenceToString(codepointSequence) {
	// string: codepointSequenceToString('0032 FE0E')
	// argument list: codepointSequenceToString('0032', 'FE0F')
	// array: codepointSequenceToString(['0032', 'FE0F', '20E3'])
	const sequence = arguments.length > 1 ? Array.prototype.slice.call(arguments) : codepointSequence;
	const codepoints = typeof sequence === 'string' ? sequence.split(' ') : sequence;
	const numericCodepoints = codepoints.map(codepoint => parseInt(codepoint, 16));
	return String.fromCodePoint(...numericCodepoints);
}
