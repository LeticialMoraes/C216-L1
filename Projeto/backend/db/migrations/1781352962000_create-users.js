/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    first_name: { type: "varchar(120)", notNull: true },
    last_name: { type: "varchar(120)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    access_profile: { type: "varchar(32)", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("users", { ifExists: true, cascade: true });
};
