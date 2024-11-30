import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zwzuqerigbhpyqombfec.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3enVxZXJpZ2JocHlxb21iZmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3OTk0MTksImV4cCI6MjA0ODM3NTQxOX0.DdtVv2F9J8cUzuurarJVlfAwTuf9F8HwBA-_vbnH48I";

export const supabase = createClient(supabaseUrl, supabaseKey);