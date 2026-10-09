// Phrase rules. Each regex runs over one sentence's text; every match becomes a hit.
// Signals, not verdicts. Common craft and plain-language guidance, mechanically checkable. Tune freely.
const A = "['’]";
const PHRASE_RULES = {
  "sl-negpar": [ // negative parallelism: "not just X", "it's not X, it's Y"
    /\bnot (?:just|only|merely|simply)\b/gi,
    new RegExp("\\b(?:(?:it|this|that)(?:" + A + "s| is| was) not|(?:it|this|that) (?:isn" + A + "t|wasn" + A + "t))\\b[^.;!?]{1,60}?[,;:—–-]\\s*(?:it|this|that)(?:" + A + "s| is| was)\\b", "gi"),
    new RegExp("\\b(?:isn" + A + "t|wasn" + A + "t|not) about\\b[^.;!?]{1,60}?\\b(?:it" + A + "s|it is|it was|but) about\\b", "gi"),
  ],
  "sl-copdodge": [ // fake-fancy verbs dodging "is"/"are"
    /\b(?:serv(?:e|es|ed|ing)|stand(?:s|ing)?|stood|act(?:s|ed|ing)?|function(?:s|ed|ing)?) as\b/gi,
    /\b(?:boasts?|boasted|boasting|embod(?:y|ies|ied|ying))\b/gi,
  ],
  "sl-throat": [ // throat-clearing and summary openers
    new RegExp("\\bit(?:" + A + "s| is) (?:worth|important|crucial|essential|key) (?:to )?(?:noting|note|mention|remember|understand)(?: that)?\\b", "gi"),
    /\b(?:it could be said|one might (?:argue|consider)|needless to say|at the end of the day|when it comes to)\b/gi,
    /^(?:overall|ultimately|in conclusion|in the end|in summary|all in all)\b/gi,
  ],
  "sl-road": [ // roadmap and signposting: the "tidy, self-announcing" post
    /\bin this (?:post|article|essay|piece|guide)\b/gi,
    new RegExp("\\b(?:we|i)(?:" + A + "ll| will) (?:cover|walk you through|explore|look at|dive into|break down|unpack)\\b", "gi"),
    new RegExp("\\b(?:let" + A + "s (?:dive|unpack|explore|break)|let me (?:walk|show|explain)|by the end of (?:this|the)|here" + A + "s (?:the (?:thing|kicker|catch)|what|how|why))\\b", "gi"),
  ],
  "sl-concede": [ // concession markers opening a sentence; caveats belong in one place
    /^(?:that said|that being said|having said that|of course|to be fair|granted|admittedly|in fairness|to be clear|mind you|even so)\b/gi,
  ],
  "sl-wordy": [ // circumlocution
    /\b(?:in order to|the process of|due to the fact that|a number of|at this point in time|in the event that|for the purpose of|has the ability to|(?:is|are) able to|in spite of the fact that|with (?:regard|respect) to|on a (?:daily|regular) basis|in the near future|a large number of|the majority of|each and every|first and foremost|it should be noted that|as a matter of fact|at the present time|the fact that|for all intents and purposes)\b/gi,
  ],
  "sl-uncontr": [ // formal uncontracted forms
    /\b(?:do|does|did|is|are|was|were|has|have|had|will|would|could|should) not\b|\bcannot\b/gi,
    /\b(?:it|that|there|what|who) is\b|\b(?:I|we|you|they) (?:am|are|have|will|would)\b/gi,
  ],
  "sl-simile": [
    /(?<!['\u2019]d\s)(?<!\b(?:I|you|we|they|would|do|don['\u2019]t|did|didn['\u2019]t|to|really|just|also|people)\s)\blike (?:a|an|the|some|she|he|they)\b|\bas (?:if|though)\b|\bas (?!(?:well|soon|long|far|much|many|often|good|follows)\b)\w+ as\b/gi,
  ],
  "sl-vnoun": [ // vague nouns
    /\b(?:things?|stuff|aspects?|factors?|elements?|issues?|situations?|concepts?)\b/gi,
  ],
  "sl-tagadv": [ // adverb in a dialogue tag ("said sadly")
    /\b(?:said|asked|replied|answered|whispered|shouted|muttered|called|cried|added|continued|exclaimed|retorted|sighed|snapped|growled|hissed) (\w+ly)\b/gi,
  ],
  "sl-person": [ // personified abstractions
    /\b(?:silence|darkness|shadows?|night|time|fear|hope|grief|wind|morning|city|house|room|air|memory|memories|truth|doubt|sorrow|anger|despair) (?:whispered|watched|stirred|danced|crept|swallowed|embraced|wrapped|spoke|screamed|breathed|sang|waited|beckoned|loomed|hung heavy|pressed in|closed in|settled over)\b/gi,
    /\ba weight (?:lifted|settled|pressed)\b|\bthe walls came down\b/gi,
  ],
  "sl-hedge": [
    /\b(?:perhaps|maybe|might|arguably|appeared|seems?|seemed|i would argue)\b/gi,
  ],
  "sl-filter": [ // story filter words
    /\b(?:saw|felt|noticed|realized|realised|heard|seemed|thought|knew|wondered|watched|could see|tried to)\b/gi,
  ],
  "sl-misused": [ // commonly misused: spellings and context slips (its/it's, could of, then/than...)
    /\b(?:alot|irregardless|supposably|definately|seperate|occured|untill|recieve)\b/gi,
    /\b(?:could|would|should|must|might|may) of\b/gi,
    new RegExp("\\bits (?:a|an|the|is|was|were|are|been|not|going|got)\\b|\\bit" + A + "s own\\b", "gi"),
    /\btheir (?:is|are|was|were|not|going)\b/gi,
    /\bthere (?:own|favou?rite|car|house|home|dog|friends?|family|kids?|children|mother|father|parents?|job)\b/gi,
    /\byour (?:welcome|not|going|gonna|a|an|the|is|are|was|were)\b/gi,
    /\b(?:more|less|fewer|better|worse|rather|greater|higher|lower|larger|smaller|bigger|older|younger|faster|slower|stronger|weaker|easier|harder|longer|shorter|closer) then\b/gi,
    new RegExp("\\b(?:is|are|was|were|be|am|been|it" + A + "s|that" + A + "s|way|far|not) to (?:much|many)\\b", "gi"),
    new RegExp("\\b(?:will|would|could|should|can|might|may|must|don" + A + "t|doesn" + A + "t|didn" + A + "t|won" + A + "t|not) loose\\b", "gi"),
    /\b(?:the|an?|his|her|my|their|its|no|any) affects?\b/gi,
    /\baccept for\b|\bquiet an?\b|\b(?:have|has|had) lead\b/gi,
    /\b(?:peaked|peeked) (?:my|his|her|their|our|your|its) (?:interest|curiosity|attention)\b/gi,
  ],
  "sl-stock": [ // stock emotion, body language cliches and body-as-observer phrasing
    new RegExp("\\beyes (?:danced|sparkled|twinkled|glinted)\\b|\\b(?:pursed|furrowed) (?:her|his|my|their) (?:lips|brow)\\b|\\b(?:her|his|my) (?:heart|pulse) (?:raced|pounded|hammered|skipped|sank|leapt)\\b|\\bfingers (?:danced|drummed|tapped)\\b|\\ba (?:shiver|chill) (?:ran|crept|went) (?:down|up)\\b|\\bbreath (?:she|he|I) (?:didn" + A + "t|did not) know (?:she|he|I) was holding\\b|\\bbutterflies in (?:her|his|my) stomach\\b|\\bblood (?:ran|went) cold\\b|\\btime (?:seemed to )?(?:slow(?:ed)?|stop(?:ped)?|stood still)\\b", "gi"),
    /\bsomething (?:shifted|changed|cracked|broke|stirred|tightened|clicked|loosened|unfurled|settled)\b/gi,
    /\b(?:did|does) something (?:complicated|strange|funny|odd)\b/gi,
    /\b(?:jaw|throat|chest|stomach|pulse|heart|hands?|fists?|shoulders?) (?:tight(?:ened|ening)?|clench(?:ed|ing)?|racing|pounding|hammering|clos(?:ed|ing)|tensed|knotted)\b/gi,
  ],
};
const FILLER = new Set(`very really quite rather somewhat fairly pretty extremely incredibly
absolutely totally completely utterly literally actually basically simply just definitely
honestly seriously obviously clearly essentially virtually practically`.split(/\s+/));
const FILLER_PHRASES = /\b(a bit|a little bit|sort of|kind of)\b/gi;
const PUNCT = /[—;]/g; // em dash and semicolon: marked so each can be judged
const DIALOGUE = /["\u201c][^"\u201d]*(?:["\u201d]|$)/g; // quoted speech; an unclosed quote runs to the end of the paragraph
const VAGUE = new Set(["it", "this", "that", "these", "those", "they", "them", "there"]);
const RADAR_STOP = new Set(`about above after again against all also always another any because been before being below between both
could does doing down during each even every from further have having here into just like made make many more most much must never
only other over same shall should since some still such than that their them then there these they this those through under until
upon very want were what when where which while whose will with would your first one two three came come says know knew think
thought saw see seen get got go went back well really`.split(/\s+/));
const FANCY_TAGS = /\b(?:exclaimed|queried|retorted|interjected|proclaimed|declared|announced|stated|remarked|opined|quipped|chimed|breathed|murmured|cooed|gasped|bellowed|barked|croaked|purred)\b/gi; // not shouted, whispered, muttered
const NEUTRAL_TAG = /\b(?:said|asked|replied|answered|says|asks)\b/gi;
const LINKERS = new Set(["it", "they", "he", "she", "this", "that", "these", "those", "such", "which", "i", "we", "you", "my", "our", "your", "and", "but", "so", "because", "however", "then", "also", "instead", "otherwise", "meanwhile", "therefore", "thus", "now", "next", "still", "yet"]);
const CONTRACTION = /\b(?:\w+n['\u2019]t|\w+['\u2019](?:re|ve|ll|d|m)|(?:it|that|there|here|he|she|what|who|let)['\u2019]s)\b/gi;
const NOM_RE = /(?:tion|sion|ment|ness|ity|ance|ence|ism)s?$/;
const NOM_STOP = new Set(`question questions nation nations station stations section sections moment moments document documents comment comments element elements government department apartment environment equipment instrument experiment experiments tournament monument garment argument arguments community city cities university family business witness darkness kindness fitness sadness happiness weakness loneliness silence presence absence audience science conscience evidence sentence sentences difference pretence residence distance instance`.split(/\s+/));
const SPEC_TAGS = new Set(["ProperNoun", "Place", "Organization", "Person", "Month", "Weekday", "Acronym"]);
