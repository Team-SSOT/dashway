CREATE TABLE IF NOT EXISTS apps (
    id                  UUID        PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    port                INT         NOT NULL,
    is_enabled          BOOLEAN     NOT NULL    DEFAULT TRUE,
    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id                  BIGSERIAL   PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    email               VARCHAR     NOT NULL    UNIQUE,
    password            VARCHAR     NOT NULL,
    profile_img_path    VARCHAR,

    is_enabled          BOOLEAN     NOT NULL    DEFAULT TRUE,

    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE members
    ADD COLUMN IF NOT EXISTS profile_img_path VARCHAR;

CREATE TABLE IF NOT EXISTS authorities (
    id          INT         NOT NULL PRIMARY KEY,
    name        VARCHAR     NOT NULL
);

INSERT INTO authorities (id, name)
VALUES (1, 'ADMIN'),
       (2, 'LEADER'),
       (3, 'MEMBER')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS member_authorities (
    member_id       BIGINT      NOT NULL,
    authority_id    BIGINT      NOT NULL,

    PRIMARY KEY(member_id, authority_id),
    CONSTRAINT fk__member_authorities__member_id FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk__member_authorities__authority_id FOREIGN KEY (authority_id) REFERENCES authorities(id)
);

CREATE TABLE IF NOT EXISTS teams (
    id                  BIGSERIAL   PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_member (
    team_id             BIGINT      NOT NULL,
    member_id           BIGINT      NOT NULL,

    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (team_id, member_id),
    CONSTRAINT fk__team_member__team_id FOREIGN KEY (team_id) REFERENCES teams (id),
    CONSTRAINT fk__team_member__member_id FOREIGN KEY (member_id) REFERENCES members (id)
);
