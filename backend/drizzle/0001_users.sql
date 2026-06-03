CREATE TABLE "users" (
	"did" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
