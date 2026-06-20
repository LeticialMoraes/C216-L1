/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("categorias", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    nome: {
      type: "varchar(100)",
      notNull: true,
      unique: true,
    },
    descricao: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("NOW()"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("categorias", { ifExists: true, cascade: true });
};
