PRAGMA foreign_keys = ON;


CREATE TABLE anlaute
(
	id INTEGER PRIMARY KEY,
	laut TEXT UNIQUE NOT NULL
) WITHOUT ROWID;


CREATE TABLE auslaute
(
	id INTEGER PRIMARY KEY,
	laut TEXT UNIQUE NOT NULL
) WITHOUT ROWID;


CREATE TABLE zeichen
(
	zeichen TEXT PRIMARY KEY,
	anlaut INTEGER, -- FK
	auslaut INTEGER NOT NULL, -- FK
	ton INTEGER NOT NULL,
	-- FOREIGN KEYs must be at the end, sqlite rejects them otherwise
	FOREIGN KEY (anlaut) REFERENCES anlaute (id),
	FOREIGN KEY (auslaut) REFERENCES auslaute (id)
) WITHOUT ROWID;

CREATE TABLE audruecke
(
	audruck TEXT PRIMARY KEY,
	bedeutung TEXT NOT NULL
) WITHOUT ROWID;


INSERT INTO anlaute (id, laut)
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

INSERT INTO auslaute (id, laut)
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
	(29, 'ün');
