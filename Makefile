.PHONY: reset_db
reset_db:
	rm -rf prisma/dev.db
	npx prisma migrate deploy
