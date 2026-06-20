/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("produtos", {
    id: {
      type: "serial",
      primaryKey: true,
    },
    nome: {
      type: "varchar(150)",
      notNull: true,
    },
    sku: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    descricao: {
      type: "text",
    },
    preco: {
      type: "numeric(10,2)",
      notNull: true,
    },
    quantidade: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    quantidade_minima: {
      type: "integer",
      notNull: true,
      default: 10,
    },
    tamanhos: {
      type: "varchar(50)",
    },
    categoria_id: {
      type: "integer",
      notNull: true,
      references: "categorias",
      onDelete: "RESTRICT",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("NOW()"),
    },
  });

  pgm.createTable(
    "produto_fornecedor",
    {
      id: {
        type: "serial",
        primaryKey: true,
      },
      produto_id: {
        type: "integer",
        notNull: true,
        references: "produtos",
        onDelete: "CASCADE",
      },
      fornecedor_id: {
        type: "integer",
        notNull: true,
        references: "fornecedores",
        onDelete: "CASCADE",
      },
      preco_custo: {
        type: "numeric(10,2)",
      },
      prazo_entrega_dias: {
        type: "integer",
      },
    },
    {
      constraints: {
        unique: ["produto_id", "fornecedor_id"],
      },
    },
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("produto_fornecedor", { ifExists: true, cascade: true });
  pgm.dropTable("produtos", { ifExists: true, cascade: true });
};
