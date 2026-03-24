CREATE TABLE IF NOT EXISTS apps (
    id                  UUID        PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    is_enabled          BOOLEAN     NOT NULL    DEFAULT TRUE,
    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id                  BIGSERIAL   PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    email               VARCHAR     NOT NULL    UNIQUE,
    password_hash       VARCHAR,

    is_admin            BOOLEAN     NOT NULL,

    is_enabled          BOOLEAN     NOT NULL    DEFAULT TRUE,

    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE members
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

CREATE TABLE IF NOT EXISTS teams (
    id                  BIGSERIAL   PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    created_datetime    TIMESTAMP   NOT NULL    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_member (
    team_id     BIGINT      NOT NULL,
    member_id   BIGINT      NOT NULL,

    PRIMARY KEY (team_id, member_id),
    CONSTRAINT fk__team_member__team_id FOREIGN KEY (team_id) REFERENCES teams (id),
    CONSTRAINT fk__team_member__member_id FOREIGN KEY (member_id) REFERENCES members (id)
);
