/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("movimentacoes", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    produto_id: {
      type: "integer",
      notNull: true,
      references: "produtos",
      onDelete: "RESTRICT",
    },
    usuario_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    tipo: {
      type: "varchar(10)",
      notNull: true,
    },
    quantidade: {
      type: "integer",
      notNull: true,
    },
    observacao: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("movimentacoes", "movimentacoes_tipo_check", {
    check: "tipo IN ('entrada', 'saida')",
  });

  pgm.addConstraint("movimentacoes", "movimentacoes_quantidade_check", {
    check: "quantidade > 0",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("movimentacoes", { ifExists: true, cascade: true });
};
