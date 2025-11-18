const { pgTable, serial, integer, timestamp, unique } = require('drizzle-orm/pg-core');

const favorites = pgTable(
  'favorites',
  {
    id: serial('id').primaryKey(),
    memberId: integer("member_id").notNull(),
    postId: integer('post_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uniqueFavorite: unique().on(table.memberId, table.postId),
  }),
);

module.exports = { favorites };
