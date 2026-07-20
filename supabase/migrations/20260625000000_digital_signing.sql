-- Migration to create the documents table, insert initial data, configure storage bucket, and set RLS policies

-- 1. Create public.documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  details jsonb NULL,
  status text NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Enable Realtime for the documents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

-- Enable Row Level Security on public.documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public.documents
DROP POLICY IF EXISTS "Allow public select" ON public.documents;
CREATE POLICY "Allow public select" ON public.documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.documents;
CREATE POLICY "Allow public insert" ON public.documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.documents;
CREATE POLICY "Allow public update" ON public.documents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.documents;
CREATE POLICY "Allow public delete" ON public.documents FOR DELETE USING (true);

-- 2. Insert initial data into documents table
INSERT INTO "public"."documents" ("id", "customer_name", "customer_email", "details", "status", "created_at") 
VALUES 
  ('9cba2124-bd4f-4b09-92fa-6c64714a1c90', 'CHILUKURI THARUN', 'tharunchilukuri542@gmail.com', '{"dob": "14/06/2004", "mobile": "6303686169", "address": "D NO 16-4-886 SRAMIKA NAGAR  DARGAMITTA NELLORE", "nominee": {"name": "", "contact": "", "relationship": ""}, "idProofType": "Aadhaar", "idProofNumber": "850829840112", "modeOfPayment": "UPI", "schemeDuration": "11 Months", "specialBenefit": "ENJOY AN EXCLUSIVE 25% DISCOUNT ON YOUR FIRST MONTH INSTALLMENT AT THE TIME OF MATURITY, WITH YOUR 11TH MONTH INSTALLMENT FULLY COVERED BY MOKSHA.", "totalContribution": "₹ 107500", "monthlyInstallment": "10000", "firstInstallmentDate": "10/4/2026", "preferredPaymentDate": "5"}', 'signed', '2026-05-27 11:30:14.428646+00'), 
  ('d36a5517-21dc-4682-9e3c-5ecc0d4bced3', 'KISTAPATI KRISHNA REDDY', 'krishnareddy.kistapati@gmail.com', '{"dob": "04/06/1991", "mobile": "9666054334", "address": "AMUDALA PALLE ANNAVARAM  PODILI MANDAL PRAKASAM", "nominee": {"name": "NARU RAJESWARI", "contact": "", "relationship": "WIFE"}, "idProofType": "Aadhaar", "idProofNumber": "731754038476", "modeOfPayment": "UPI", "schemeDuration": "11 Months", "specialBenefit": "ENJOY AN EXCLUSIVE 25% DISCOUNT ON YOUR FIRST MONTH INSTALLMENT AT THE TIME OF MATURITY, WITH YOUR 11TH MONTH INSTALLMENT FULLY COVERED BY MOKSHA.", "totalContribution": "₹ 107500", "monthlyInstallment": "10000", "firstInstallmentDate": "31.03.2026", "preferredPaymentDate": "10"}', 'signed', '2026-05-27 13:16:01.592523+00')
ON CONFLICT (id) DO NOTHING;

-- 3. Create the pdfs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up bucket policies for public access (Select, Insert, Update, Delete)
DROP POLICY IF EXISTS "Public Select Access on pdfs" ON storage.objects;
CREATE POLICY "Public Select Access on pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Insert Access on pdfs" ON storage.objects;
CREATE POLICY "Public Insert Access on pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Update Access on pdfs" ON storage.objects;
CREATE POLICY "Public Update Access on pdfs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pdfs');

DROP POLICY IF EXISTS "Public Delete Access on pdfs" ON storage.objects;
CREATE POLICY "Public Delete Access on pdfs" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdfs');
