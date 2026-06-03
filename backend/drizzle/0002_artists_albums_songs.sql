CREATE TABLE "albums" (
	"uri" text PRIMARY KEY NOT NULL,
	"did" text NOT NULL,
	"artist_uri" text NOT NULL,
	"title" text NOT NULL,
	"created_at" text NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"uri" text PRIMARY KEY NOT NULL,
	"did" text NOT NULL,
	"name" text NOT NULL,
	"created_at" text NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"uri" text PRIMARY KEY NOT NULL,
	"did" text NOT NULL,
	"artist_uri" text NOT NULL,
	"album_uri" text NOT NULL,
	"title" text NOT NULL,
	"audio_cid" text NOT NULL,
	"audio_mime_type" text NOT NULL,
	"created_at" text NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);
