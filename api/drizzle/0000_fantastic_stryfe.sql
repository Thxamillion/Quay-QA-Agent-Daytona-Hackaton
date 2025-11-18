CREATE TABLE "qa_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"repo_url" text NOT NULL,
	"app_name" text NOT NULL,
	"branch" text DEFAULT 'main' NOT NULL,
	"daytona_workspace_id" text NOT NULL,
	"app_local_url" text DEFAULT 'http://localhost:3000' NOT NULL,
	"test_flow_ids" jsonb NOT NULL,
	"status" text NOT NULL,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"passed_steps" integer DEFAULT 0 NOT NULL,
	"failed_steps" integer DEFAULT 0 NOT NULL,
	"video_recording_url" text,
	"video_recording_path" text,
	"error_message" text,
	"ai_analysis_summary" text,
	"ai_analysis_root_cause" text,
	"ai_analysis_recommendations" jsonb,
	"ai_analysis_severity" text,
	"started_at" text,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "test_flows" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"task" text NOT NULL,
	"is_demo" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" text NOT NULL,
	"qa_run_id" text NOT NULL,
	"test_flow_id" text NOT NULL,
	"step_number" integer NOT NULL,
	"action_name" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"executed_at" text,
	"screenshot_base64" text,
	"error_message" text,
	"error_type" text
);
--> statement-breakpoint
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_qa_run_id_qa_runs_id_fk" FOREIGN KEY ("qa_run_id") REFERENCES "public"."qa_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_test_flow_id_test_flows_id_fk" FOREIGN KEY ("test_flow_id") REFERENCES "public"."test_flows"("id") ON DELETE no action ON UPDATE no action;