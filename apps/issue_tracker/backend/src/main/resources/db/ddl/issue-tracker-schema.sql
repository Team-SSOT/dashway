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

COMMENT ON SCHEMA issue_tracker IS 'Issue tracker application schema.';

COMMENT ON TABLE issue_tracker.projects IS 'Top-level project that groups issues and project members.';
COMMENT ON COLUMN issue_tracker.projects.id IS 'Surrogate project identifier.';
COMMENT ON COLUMN issue_tracker.projects.key IS 'Unique short project key used for display identifiers.';
COMMENT ON COLUMN issue_tracker.projects.name IS 'Human-readable project name.';
COMMENT ON COLUMN issue_tracker.projects.description IS 'Optional project description.';
COMMENT ON COLUMN issue_tracker.projects.is_enabled IS 'Whether the project is active for application use.';
COMMENT ON COLUMN issue_tracker.projects.is_deleted IS 'Soft-delete marker for archived projects.';
COMMENT ON COLUMN issue_tracker.projects.created_datetime IS 'Timestamp when the project was created.';
COMMENT ON COLUMN issue_tracker.projects.updated_datetime IS 'Timestamp when the project was last updated.';
COMMENT ON COLUMN issue_tracker.projects.deleted_datetime IS 'Timestamp when the project was soft deleted.';

COMMENT ON TABLE issue_tracker.project_members IS 'Project membership and role assignments by member id.';
COMMENT ON COLUMN issue_tracker.project_members.project_id IS 'Project that the member belongs to.';
COMMENT ON COLUMN issue_tracker.project_members.member_id IS 'Context-api member id for the project participant.';
COMMENT ON COLUMN issue_tracker.project_members.role IS 'Project role, either OWNER or MEMBER.';
COMMENT ON COLUMN issue_tracker.project_members.joined_datetime IS 'Timestamp when the member joined the project.';

COMMENT ON TABLE issue_tracker.issues IS 'Issue records that belong to exactly one project.';
COMMENT ON COLUMN issue_tracker.issues.id IS 'Surrogate issue identifier.';
COMMENT ON COLUMN issue_tracker.issues.project_id IS 'Project that owns the issue.';
COMMENT ON COLUMN issue_tracker.issues.title IS 'Issue title.';
COMMENT ON COLUMN issue_tracker.issues.content IS 'Optional issue body or description.';
COMMENT ON COLUMN issue_tracker.issues.status IS 'Workflow status for the issue.';
COMMENT ON COLUMN issue_tracker.issues.priority IS 'Priority level for the issue.';
COMMENT ON COLUMN issue_tracker.issues.reporter_member_id IS 'Context-api member id of the issue reporter.';
COMMENT ON COLUMN issue_tracker.issues.creator_member_id IS 'Context-api member id that created the issue.';
COMMENT ON COLUMN issue_tracker.issues.due_datetime IS 'Optional due date and time for the issue.';
COMMENT ON COLUMN issue_tracker.issues.is_enabled IS 'Whether the issue is active for application use.';
COMMENT ON COLUMN issue_tracker.issues.is_deleted IS 'Soft-delete marker for archived issues.';
COMMENT ON COLUMN issue_tracker.issues.created_datetime IS 'Timestamp when the issue was created.';
COMMENT ON COLUMN issue_tracker.issues.updated_datetime IS 'Timestamp when the issue was last updated.';
COMMENT ON COLUMN issue_tracker.issues.deleted_datetime IS 'Timestamp when the issue was soft deleted.';

COMMENT ON TABLE issue_tracker.issue_assignees IS 'Many-to-many assignment between issues and member ids.';
COMMENT ON COLUMN issue_tracker.issue_assignees.issue_id IS 'Issue assigned to the member.';
COMMENT ON COLUMN issue_tracker.issue_assignees.member_id IS 'Context-api member id assigned to the issue.';
COMMENT ON COLUMN issue_tracker.issue_assignees.created_datetime IS 'Timestamp when the assignment was created.';

COMMENT ON TABLE issue_tracker.labels IS 'Project-scoped labels that can be attached to issues.';
COMMENT ON COLUMN issue_tracker.labels.id IS 'Surrogate label identifier.';
COMMENT ON COLUMN issue_tracker.labels.project_id IS 'Project that owns the label.';
COMMENT ON COLUMN issue_tracker.labels.name IS 'Label display name, unique inside a project.';
COMMENT ON COLUMN issue_tracker.labels.color IS 'Label color token or hex value.';
COMMENT ON COLUMN issue_tracker.labels.created_datetime IS 'Timestamp when the label was created.';
COMMENT ON COLUMN issue_tracker.labels.updated_datetime IS 'Timestamp when the label was last updated.';

COMMENT ON TABLE issue_tracker.issue_labels IS 'Many-to-many relation between issues and labels.';
COMMENT ON COLUMN issue_tracker.issue_labels.issue_id IS 'Issue tagged with the label.';
COMMENT ON COLUMN issue_tracker.issue_labels.label_id IS 'Label attached to the issue.';
COMMENT ON COLUMN issue_tracker.issue_labels.created_datetime IS 'Timestamp when the label was attached.';

COMMENT ON TABLE issue_tracker.issue_comments IS 'Comments written on issues.';
COMMENT ON COLUMN issue_tracker.issue_comments.id IS 'Surrogate comment identifier.';
COMMENT ON COLUMN issue_tracker.issue_comments.issue_id IS 'Issue that owns the comment.';
COMMENT ON COLUMN issue_tracker.issue_comments.author_member_id IS 'Context-api member id of the comment author.';
COMMENT ON COLUMN issue_tracker.issue_comments.content IS 'Comment body.';
COMMENT ON COLUMN issue_tracker.issue_comments.is_enabled IS 'Whether the comment is active for application use.';
COMMENT ON COLUMN issue_tracker.issue_comments.is_deleted IS 'Soft-delete marker for deleted comments.';
COMMENT ON COLUMN issue_tracker.issue_comments.created_datetime IS 'Timestamp when the comment was created.';
COMMENT ON COLUMN issue_tracker.issue_comments.updated_datetime IS 'Timestamp when the comment was last updated.';
COMMENT ON COLUMN issue_tracker.issue_comments.deleted_datetime IS 'Timestamp when the comment was soft deleted.';

COMMENT ON TABLE issue_tracker.issue_files IS 'Files attached directly to issues.';
COMMENT ON COLUMN issue_tracker.issue_files.issue_id IS 'Issue that owns the file attachment.';
COMMENT ON COLUMN issue_tracker.issue_files.file_id IS 'File id from the shared files table.';
COMMENT ON COLUMN issue_tracker.issue_files.created_datetime IS 'Timestamp when the file was attached to the issue.';

COMMENT ON TABLE issue_tracker.comment_files IS 'Files attached to issue comments.';
COMMENT ON COLUMN issue_tracker.comment_files.comment_id IS 'Comment that owns the file attachment.';
COMMENT ON COLUMN issue_tracker.comment_files.file_id IS 'File id from the shared files table.';
COMMENT ON COLUMN issue_tracker.comment_files.created_datetime IS 'Timestamp when the file was attached to the comment.';
