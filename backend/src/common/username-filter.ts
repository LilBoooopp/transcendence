const BLOCKED_TERMS = [
  // strong profanity
  'fuck', 'shit', 'cunt', 'cock', 'pussy', 'bastard', 'asshole', 'arsehole',
  'motherfuck', 'bullshit', 'dickhead', 'jackass', 'prick', 'twat', 'wanker',
  'bitch', 'whore', 'slut',
  // slurs — racial/ethnic
  'nigger', 'nigga', 'kike', 'spic', 'chink', 'gook', 'wetback', 'coon',
  'cracker', 'honky', 'beaner', 'raghead', 'sandnigger', 'zipperhead',
  // slurs — sexuality/gender
  'faggot', 'fag', 'dyke', 'tranny', 'shemale',
  // hate groups / figures
  'hitler', 'nazi', 'kkk', 'neonazi',
  // common leet-speak bypasses
  'fvck', 'fuk', 'phuck', 'sh1t', 'b1tch', 'n1gger', 'nigg3r',
];

export function isUsernameAllowed(username: string): boolean {
  const normalized = username.toLowerCase().replace(/[_.\-]/g, '');
  return !BLOCKED_TERMS.some(term => normalized.includes(term));
}
