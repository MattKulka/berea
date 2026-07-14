// Canonical book names used throughout the app, in canonical (Protestant) order.
export const CANONICAL_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
  "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
] as const;

// Maps the BSB.json source's raw book.name field to our canonical name.
export const BSB_NAME_TO_CANONICAL: Record<string, string> = {
  "Genesis": "Genesis", "Exodus": "Exodus", "Leviticus": "Leviticus", "Numbers": "Numbers",
  "Deuteronomy": "Deuteronomy", "Joshua": "Joshua", "Judges": "Judges", "Ruth": "Ruth",
  "I Samuel": "1 Samuel", "II Samuel": "2 Samuel", "I Kings": "1 Kings", "II Kings": "2 Kings",
  "I Chronicles": "1 Chronicles", "II Chronicles": "2 Chronicles",
  "Ezra": "Ezra", "Nehemiah": "Nehemiah", "Esther": "Esther", "Job": "Job", "Psalms": "Psalms",
  "Proverbs": "Proverbs", "Ecclesiastes": "Ecclesiastes", "Song of Solomon": "Song of Solomon",
  "Isaiah": "Isaiah", "Jeremiah": "Jeremiah", "Lamentations": "Lamentations", "Ezekiel": "Ezekiel",
  "Daniel": "Daniel", "Hosea": "Hosea", "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obadiah",
  "Jonah": "Jonah", "Micah": "Micah", "Nahum": "Nahum", "Habakkuk": "Habakkuk",
  "Zephaniah": "Zephaniah", "Haggai": "Haggai", "Zechariah": "Zechariah", "Malachi": "Malachi",
  "Matthew": "Matthew", "Mark": "Mark", "Luke": "Luke", "John": "John", "Acts": "Acts",
  "Romans": "Romans", "I Corinthians": "1 Corinthians", "II Corinthians": "2 Corinthians",
  "Galatians": "Galatians", "Ephesians": "Ephesians", "Philippians": "Philippians",
  "Colossians": "Colossians", "I Thessalonians": "1 Thessalonians",
  "II Thessalonians": "2 Thessalonians", "I Timothy": "1 Timothy", "II Timothy": "2 Timothy",
  "Titus": "Titus", "Philemon": "Philemon", "Hebrews": "Hebrews", "James": "James",
  "I Peter": "1 Peter", "II Peter": "2 Peter", "I John": "1 John", "II John": "2 John",
  "III John": "3 John", "Jude": "Jude", "Revelation of John": "Revelation",
};

// Maps OpenBible.info's OSIS-style abbreviations (used in cross_references.txt) to our canonical name.
export const OSIS_ABBR_TO_CANONICAL: Record<string, string> = {
  Gen: "Genesis", Exod: "Exodus", Lev: "Leviticus", Num: "Numbers", Deut: "Deuteronomy",
  Josh: "Joshua", Judg: "Judges", Ruth: "Ruth",
  "1Sam": "1 Samuel", "2Sam": "2 Samuel", "1Kgs": "1 Kings", "2Kgs": "2 Kings",
  "1Chr": "1 Chronicles", "2Chr": "2 Chronicles",
  Ezra: "Ezra", Neh: "Nehemiah", Esth: "Esther", Job: "Job", Ps: "Psalms", Prov: "Proverbs",
  Eccl: "Ecclesiastes", Song: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Ezek: "Ezekiel", Dan: "Daniel", Hos: "Hosea", Joel: "Joel",
  Amos: "Amos", Obad: "Obadiah", Jonah: "Jonah", Mic: "Micah", Nah: "Nahum", Hab: "Habakkuk",
  Zeph: "Zephaniah", Hag: "Haggai", Zech: "Zechariah", Mal: "Malachi",
  Matt: "Matthew", Mark: "Mark", Luke: "Luke", John: "John", Acts: "Acts", Rom: "Romans",
  "1Cor": "1 Corinthians", "2Cor": "2 Corinthians", Gal: "Galatians", Eph: "Ephesians",
  Phil: "Philippians", Col: "Colossians", "1Thess": "1 Thessalonians",
  "2Thess": "2 Thessalonians", "1Tim": "1 Timothy", "2Tim": "2 Timothy", Titus: "Titus",
  Phlm: "Philemon", Heb: "Hebrews", Jas: "James", "1Pet": "1 Peter", "2Pet": "2 Peter",
  "1John": "1 John", "2John": "2 John", "3John": "3 John", Jude: "Jude", Rev: "Revelation",
};
