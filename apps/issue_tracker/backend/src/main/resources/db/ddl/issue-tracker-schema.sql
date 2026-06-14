CREATE SCHEMA IF NOT EXISTS issue_tracker;

CREATE TABLE issue_tracker.projects (
    id                  BIGSERIAL       PRIMARY KEY,
    key                 VARCHAR(32)     NOT NULL,
    name                TEXT            NOT NULL,
    description         TEXT                NULL,

    is_enabled          BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,

    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_datetime    TIMESTAMPTZ         NULL,

    CONSTRAINT uq_issue_tracker_projects_key UNIQUE (key)
);

CREATE TABLE issue_tracker.project_members (
    project_id          BIGINT          NOT NULL,
    member_id           BIGINT          NOT NULL,
    role                VARCHAR(16)     NOT NULL,
    joined_datetime     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (project_id, member_id),

    CONSTRAINT fk_issue_tracker_project_members_project
        FOREIGN KEY (project_id) REFERENCES issue_tracker.projects (id),
    CONSTRAINT ck_issue_tracker_project_members_role
        CHECK (role IN ('OWNER', 'MEMBER'))
);

CREATE INDEX idx_issue_tracker_project_members_member_project
    ON issue_tracker.project_members (member_id, project_id);

CREATE TABLE issue_tracker.issues (
    id                  BIGSERIAL       PRIMARY KEY,
    project_id          BIGINT          NOT NULL,
    title               TEXT            NOT NULL,
    content             TEXT                NULL,
    status              VARCHAR(32)     NOT NULL,
    priority            VARCHAR(32)     NOT NULL,
    reporter_member_id  BIGINT          NOT NULL,
    creator_member_id   BIGINT          NOT NULL,
    due_datetime        TIMESTAMPTZ         NULL,

    is_enabled          BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,

    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_datetime    TIMESTAMPTZ         NULL,

    CONSTRAINT fk_issue_tracker_issues_project
        FOREIGN KEY (project_id) REFERENCES issue_tracker.projects (id),
    CONSTRAINT ck_issue_tracker_issues_status
        CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED')),
    CONSTRAINT ck_issue_tracker_issues_priority
        CHECK (priority IN ('NO_PRIORITY', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'))
);

CREATE INDEX idx_issue_tracker_issues_project_status_created
    ON issue_tracker.issues (project_id, status, created_datetime DESC, id DESC);

CREATE INDEX idx_issue_tracker_issues_due
    ON issue_tracker.issues (due_datetime, id)
    WHERE due_datetime IS NOT NULL AND is_deleted = FALSE;

CREATE TABLE issue_tracker.issue_assignees (
    issue_id            BIGINT          NOT NULL,
    member_id           BIGINT          NOT NULL,
    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (issue_id, member_id),

    CONSTRAINT fk_issue_tracker_issue_assignees_issue
        FOREIGN KEY (issue_id) REFERENCES issue_tracker.issues (id)
);

CREATE INDEX idx_issue_tracker_issue_assignees_member_issue
    ON issue_tracker.issue_assignees (member_id, issue_id);

CREATE TABLE issue_tracker.labels (
    id                  BIGSERIAL       PRIMARY KEY,
    project_id          BIGINT          NOT NULL,
    name                TEXT            NOT NULL,
    color               VARCHAR(32)     NOT NULL,
    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_issue_tracker_labels_project
        FOREIGN KEY (project_id) REFERENCES issue_tracker.projects (id),
    CONSTRAINT uq_issue_tracker_labels_project_name
        UNIQUE (project_id, name)
);

CREATE TABLE issue_tracker.issue_labels (
    issue_id            BIGINT          NOT NULL,
    label_id            BIGINT          NOT NULL,
    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (issue_id, label_id),

    CONSTRAINT fk_issue_tracker_issue_labels_issue
        FOREIGN KEY (issue_id) REFERENCES issue_tracker.issues (id),
    CONSTRAINT fk_issue_tracker_issue_labels_label
        FOREIGN KEY (label_id) REFERENCES issue_tracker.labels (id)
);

CREATE INDEX idx_issue_tracker_issue_labels_label_issue
    ON issue_tracker.issue_labels (label_id, issue_id);

CREATE TABLE issue_tracker.issue_comments (
    id                  BIGSERIAL       PRIMARY KEY,
    issue_id            BIGINT          NOT NULL,
    author_member_id    BIGINT          NOT NULL,
    content             TEXT            NOT NULL,

    is_enabled          BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,

    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_datetime    TIMESTAMPTZ         NULL,

    CONSTRAINT fk_issue_tracker_issue_comments_issue
        FOREIGN KEY (issue_id) REFERENCES issue_tracker.issues (id)
);

CREATE INDEX idx_issue_tracker_issue_comments_issue_created
    ON issue_tracker.issue_comments (issue_id, created_datetime ASC, id ASC);

CREATE TABLE issue_tracker.issue_files (
    issue_id            BIGINT          NOT NULL,
    file_id             UUID            NOT NULL,
    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (issue_id, file_id),

    CONSTRAINT fk_issue_tracker_issue_files_issue
        FOREIGN KEY (issue_id) REFERENCES issue_tracker.issues (id),
    CONSTRAINT fk_issue_tracker_issue_files_file
        FOREIGN KEY (file_id) REFERENCES public.files (id)
);

CREATE TABLE issue_tracker.comment_files (
    comment_id          BIGINT          NOT NULL,
    file_id             UUID            NOT NULL,
    created_datetime    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (comment_id, file_id),

    CONSTRAINT fk_issue_tracker_comment_files_comment
        FOREIGN KEY (comment_id) REFERENCES issue_tracker.issue_comments (id),
    CONSTRAINT fk_issue_tracker_comment_files_file
        FOREIGN KEY (file_id) REFERENCES public.files (id)
);
