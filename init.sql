PRAGMA foreign_keys = ON;


CREATE TABLE initials
(
	id INTEGER PRIMARY KEY,
	syllable TEXT UNIQUE NOT NULL
) WITHOUT ROWID;


CREATE TABLE finals
(
	id INTEGER PRIMARY KEY,
	syllable TEXT UNIQUE NOT NULL
) WITHOUT ROWID;


CREATE TABLE characters
(
	character TEXT PRIMARY KEY,
	initial INTEGER, -- FK
	final INTEGER NOT NULL, -- FK
	tone INTEGER NOT NULL,
	-- FOREIGN KEYs must be at the end, sqlite rejects them otherwise
	FOREIGN KEY (initial) REFERENCES initials (id),
	FOREIGN KEY (final) REFERENCES finals (id)
) WITHOUT ROWID;

CREATE TABLE expressions
(
	expression TEXT PRIMARY KEY,
	translation TEXT NOT NULL
) WITHOUT ROWID;


INSERT INTO initials (id, syllable)
VALUES
	(1, 'b'),
	(2, 'd'),
	(3, 'g'),
	(4, 'j'),
	(5, 'z'),
	(6, 'zh'),
	(7, 'y'),
	(8, 't'),
	(9, 'k'),
	(10, 'q'),
	(11, 'c'),
	(12, 'ch'),
	(13, 'w'),
	(14, 'n'),
	(15, 'h'),
	(16, 'x'),
	(17, 's'),
	(18, 'sh'),
	(19, 'l'),
	(20, 'r'),
	(21, 'm');

INSERT INTO finals (id, syllable)
VALUES
	(1, 'ai'),
	(2, 'ao'),
	(3, 'an'),
	(4, 'ang'),
	(5, 'ou'),
	(6, 'ong'),
	(7, 'ei'),
	(8, 'en'),
	(9, 'eng'),
	(10, 'er'),
	(11, 'ia'),
	(12, 'iao'),
	(13, 'ian'),
	(14, 'iang'),
	(15, 'ie'),
	(16, 'iu'),
	(17, 'in'),
	(18, 'ing'),
	(19, 'iong'),
	(20, 'ua'),
	(21, 'uai'),
	(22, 'uan'),
	(23, 'uang'),
	(24, 'uo'),
	(25, 'ui'),
	(26, 'un'),
	(27, 'üe'),
	(28, 'üan'),
	(29, 'ün'),
	(30, 'a'),
	(31, 'o'),
	(32, 'e'),
	(33, 'i'),
	(34, 'u'),
	(35, 'ü'),
	(36, 'ue'); -- ü → u wenn Anlaut y
