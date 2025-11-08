CREATE TABLE "traffic_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"itinerary_id" integer,
	"from_place_id" integer NOT NULL,
	"to_place_id" integer NOT NULL,
	"transport_mode" varchar(20) NOT NULL,
	"duration" integer NOT NULL,
	"distance" integer
);
--> statement-breakpoint
ALTER TABLE "schedule_places" ALTER COLUMN "date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "gender" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "schedule_places" ADD COLUMN "itinerary_id" integer;--> statement-breakpoint
ALTER TABLE "schedule_places" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "schedule_places" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" varchar(120);--> statement-breakpoint
ALTER TABLE "traffic_data" ADD CONSTRAINT "traffic_data_itinerary_id_schedules_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_places" DROP COLUMN "schedule_id";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");