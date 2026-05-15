CREATE SCHEMA IF NOT EXISTS chat;

CREATE TABLE chat.chat_room(
	id					    UUID        PRIMARY KEY,
	type					VARCHAR(16) NOT NULL,
    title					TEXT            NULL,

	is_public				BOOLEAN     NOT NULL DEFAULT FALSE,
    is_enabled				BOOLEAN     NOT NULL DEFAULT TRUE,
    is_deleted				BOOLEAN     NOT NULL DEFAULT FALSE,

	participant_key_hash	CHAR(64)        NULL,

    created_datetime		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_datetime		TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_datetime		TIMESTAMPTZ     NULL
);

CREATE UNIQUE INDEX uq_chat_rooms_participant_key_hash
	ON chat.chat_room (participant_key_hash)
	WHERE type = 'DIRECT' AND is_deleted = FALSE;



CREATE TABLE chat.chat_room_members (
	room_id			UUID        NOT NULL,
	member_id		BIGINT      NOT NULL,
	role			VARCHAR(16) NOT NULL,
	joined_datetime	TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	PRIMARY KEY (room_id, member_id),

	CONSTRAINT fk_chat_room_members_room FOREIGN KEY (room_id) REFERENCES chat.chat_room (id),

	CONSTRAINT ck_chat_room_members_role CHECK (role IN ('OWNER', 'MEMBER'))
);

CREATE INDEX idx_chat_room_members_member_room
	ON chat.chat_room_members (room_id, member_id);


CREATE TABLE chat.chat_room_favorites (
	room_id				UUID        NOT NULL,
	member_id			BIGINT      NOT NULL,
	created_datetime	TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	PRIMARY KEY (room_id, member_id),

	CONSTRAINT fk_chat_room_favorites_member
		FOREIGN KEY (room_id, member_id)
		REFERENCES chat.chat_room_members (room_id, member_id)
);

CREATE INDEX idx_chat_room_favorites_member_room
	ON chat.chat_room_favorites (room_id, member_id);

CREATE TABLE chat.chat_message(
	id			        SERIAL          PRIMARY KEY,
	room_id				UUID            NOT NULL,
	member_id	        BIGINT          NOT NULL,
	client_message_id	TEXT            NOT NULL,
	content				TEXT            NOT NULL,

    is_enabled			BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted			BOOLEAN         NOT NULL DEFAULT FALSE,

	created_datetime	TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
	edited_datetime		TIMESTAMPTZ     NULL,
	deleted_datetime	TIMESTAMPTZ     NULL,

	CONSTRAINT fk_chat_messages_sender_member
		FOREIGN KEY (room_id, member_id)
		REFERENCES chat.chat_room_members (room_id, member_id),

	CONSTRAINT uq_chat_messages_client_message_id
		UNIQUE (room_id, member_id, client_message_id)
);

CREATE INDEX idx_chat_messages_room_created_id
	ON chat.chat_message (room_id, created_datetime DESC, id DESC);
