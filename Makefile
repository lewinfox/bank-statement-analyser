.PHONY: reset_schema reset_db

# Reset schema: Delete database AND migrations, regenerate everything from schema.prisma
reset_schema:
	rm -rf prisma/dev.db prisma/migrations
	npx prisma migrate dev --name init
	npx prisma generate

# Reset database: Delete only database, recreate from existing migrations
reset_db:
	rm -rf prisma/dev.db
	npx prisma migrate deploy
	npx prisma generate
