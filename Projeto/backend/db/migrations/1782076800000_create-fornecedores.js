/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("fornecedores", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    nome: {
      type: "varchar(150)",
      notNull: true,
    },
    email: {
      type: "varchar(150)",
    },
    telefone: {
      type: "varchar(20)",
    },
    ativo: {
      type: "boolean",
      default: true,
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
  pgm.dropTable("fornecedores", { ifExists: true, cascade: true });
};
