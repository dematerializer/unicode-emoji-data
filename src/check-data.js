import logUpdate from 'log-update';

const matchAnyTrailingVariationSelector = /\s(FE0E|FE0F)$/g;

export default function checkData({ data, emojiList }) {
	logUpdate('⌛︎ check-data');
	if (data.length === emojiList.sequences.length) {
		const diff = data.map((datum) => {
			// Compare insentitive to any trailing variation selector
			// because I believe the use of trailing variation selectors
			// in emoji-list.html does not represent current vendor support.
			const sequenceWithoutVariation = datum.sequence.replace(matchAnyTrailingVariationSelector, '');
			const contains = emojiList.sequences.find(seq => seq.includes(sequenceWithoutVariation));
			if (!contains) {
				logUpdate(`⌛︎ check-data: did not expect sequence ${datum.sequence}`);
				logUpdate.done();
			}
			return !!contains;
		});
		const numDiff = diff.filter(d => d === false).length;
		if (numDiff === 0) {
			logUpdate(`✓ check-data: ${data.length} entries verified`);
		} else {
			logUpdate(`x check-data: ${numDiff} sequences not expected (see above)`);
		}
	} else {
		logUpdate(`x check-data: numbers of entries don't match (expected ${emojiList.sequences.length} but got ${data.length})`);
	}
	logUpdate.done();
}
