import logUpdate from 'log-update';
import fs from 'fs';
import punycode from 'punycode';

const matchAnyVariationSelectorOrModifier = /\s(FE0E|FE0F|1F3FB|1F3FC|1F3FD|1F3FE|1F3FF)/g;

export default function checkData({ languages, data }) {
	logUpdate('⌛︎ check-annotations');
	const normalizedDataSequences = data.map(datum =>
		datum.sequence.replace(matchAnyVariationSelectorOrModifier, '')
	);
	const results = languages.map((language) => {
		const cldrAnnotations = JSON.parse(fs.readFileSync(`./lib/annotations/cldr/${language}.json`));
		let communityAnnotations = [];
		try {
			communityAnnotations = JSON.parse(fs.readFileSync(`./lib/annotations/community/${language}.json`))
		} catch (e) {
			if (e.code !== 'ENOENT') { // ignore if file not found
				throw(e);
			}
		}
		const cldrAnnotationForSequence = cldrAnnotations.reduce((prevAnnotationForSequence, annotation) => {
			const nextAnnotationForSequence = prevAnnotationForSequence;
			nextAnnotationForSequence[annotation.sequence] = annotation;
			return nextAnnotationForSequence;
		}, {}); // make the lookup O(1)
		const communityAnnotationForSequence = communityAnnotations.reduce((prevAnnotationForSequence, annotation) => {
			const nextAnnotationForSequence = prevAnnotationForSequence;
			nextAnnotationForSequence[annotation.sequence] = annotation;
			return nextAnnotationForSequence;
		}, {}); // make the lookup O(1)
		return normalizedDataSequences.reduce((prevResult, sequence) => {
			const nextResult = prevResult;
			let cldrAnnotationForNormalizedDataSequence = cldrAnnotationForSequence[sequence];
			let communityAnnotationForNormalizedDataSequence = communityAnnotationForSequence[sequence];
			if (cldrAnnotationForNormalizedDataSequence == null) {
				cldrAnnotationForNormalizedDataSequence = {
					tts: null,
				 	keywords: null,
				};
			}
			if (communityAnnotationForNormalizedDataSequence == null) {
				communityAnnotationForNormalizedDataSequence = {
					tts: null,
				 	keywords: null,
				};
			}
			let datumMissingAnnotations = {
				sequence,
				output: punycode.ucs2.encode(sequence.split(' ').map(cp => parseInt(cp, 16))),
			};
			if (cldrAnnotationForNormalizedDataSequence.tts == null) {
				datumMissingAnnotations = {
					...datumMissingAnnotations,
					tts: 'missing',
				};
				// See if community fixes it:
				if (communityAnnotationForNormalizedDataSequence.tts != null) {
					datumMissingAnnotations.tts = 'covered';
				}
			}
			if (cldrAnnotationForNormalizedDataSequence.keywords == null) {
				datumMissingAnnotations = {
					...datumMissingAnnotations,
					keywords: 'missing',
				};
				// See if community fixes it:
				if (communityAnnotationForNormalizedDataSequence.keywords != null) {
					datumMissingAnnotations.keywords = 'covered';
				}
			}
			if (Object.keys(datumMissingAnnotations).length > 2) {
				nextResult.sequencesMissingAnnotations.push(datumMissingAnnotations);
			}
			return nextResult;
		}, {
			language,
			sequencesMissingAnnotations: [],
		});
	});
	const success = results.reduce((prevSuccess, result) => {
		const numSequencesMissingTts = result.sequencesMissingAnnotations.filter(datum => datum.tts != null).length;
		const numSequencesMissingKeywords = result.sequencesMissingAnnotations.filter(datum => datum.keywords != null).length;
		const numSequencesMissingTtsCoveredByCommunity = result.sequencesMissingAnnotations.filter(datum => datum.tts === 'covered').length;
		const numSequencesMissingKeywordsCoveredByCommunity = result.sequencesMissingAnnotations.filter(datum => datum.keywords === 'covered').length;
		if (numSequencesMissingTts > 0 || numSequencesMissingKeywords > 0) {
			logUpdate(`x check-annotations ${result.language}:`);
			logUpdate.done();
			if (numSequencesMissingTts > 0) {
				logUpdate(`  ${numSequencesMissingTts} sequences missing tts (${numSequencesMissingTtsCoveredByCommunity} covered by community)`);
				logUpdate.done();
			}
			if (numSequencesMissingKeywords > 0) {
				logUpdate(`  ${numSequencesMissingKeywords} sequences missing keywords (${numSequencesMissingKeywordsCoveredByCommunity} covered by community)`);
				logUpdate.done();
			}
			fs.writeFileSync(`./coverage/annotations/${result.language}.json`, JSON.stringify(result.sequencesMissingAnnotations, null, 2));
			logUpdate(`  coverage report saved`);
			logUpdate.done();
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
