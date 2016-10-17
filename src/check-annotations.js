import logUpdate from 'log-update';

const matchAnyVariationSelectorOrModifier = /\s(FE0E|FE0F|1F3FB|1F3FC|1F3FD|1F3FE|1F3FF)/g;

export default function checkData({ languages, data }) {
	logUpdate('⌛︎ check-annotations');
	const normalizedDataSequences = data.map(datum =>
		datum.sequence.replace(matchAnyVariationSelectorOrModifier, '')
	);
	const results = languages.map((language) => {
		const annotations = require(`../lib/annotations/cldr/${language}.json`);
		const annotationForSequence = annotations.reduce((prevAnnotationForSequence, annotation) => {
			const nextAnnotationForSequence = prevAnnotationForSequence;
			nextAnnotationForSequence[annotation.sequence] = annotation;
			return nextAnnotationForSequence;
		}, {});
		const result = normalizedDataSequences.reduce((prevResult, sequence) => {
			const nextResult = prevResult;
			const annotationForNormalizedDataSequence = annotationForSequence[sequence];
			if (annotationForNormalizedDataSequence == null) {
				nextResult.numEmojiMissingTts += 1;
				nextResult.numEmojiMissingKeywords += 1;
			} else {
				if (annotationForNormalizedDataSequence.tts == null) {
					nextResult.numEmojiMissingTts += 1;
				}
				if (annotationForNormalizedDataSequence.keywords == null) {
					nextResult.numEmojiMissingKeywords += 1;
				}
			}
			return nextResult;
		}, {
			language,
			numEmojiMissingTts: 0,
			numEmojiMissingKeywords: 0,
		});
		return result;
	});
	const success = results.reduce((prevSuccess, result) => {
		if (result.numEmojiMissingTts > 0 || result.numEmojiMissingKeywords > 0) {
			logUpdate(`x check-annotations ${result.language}:`);
			logUpdate.done();
			if (result.numEmojiMissingTts > 0) {
				logUpdate(`  ${result.numEmojiMissingTts} sequences missing tts`);
				logUpdate.done();
			}
			if (result.numEmojiMissingKeywords > 0) {
				logUpdate(`  ${result.numEmojiMissingKeywords} sequences missing keywords`);
				logUpdate.done();
			}
			return false;
		}
		logUpdate(`✓ check-annotations ${result.language}`);
		logUpdate.done();
		return prevSuccess;
	}, true);
	logUpdate(`${success ? '✓' : 'x'} check-annotations`);
	logUpdate.done();
	return results;
}
