create type user_role as enum ('admin', 'sales', 'qa', 'operations');

create type sales_stage as enum (
  'New Lead',
  'Contacted',
  'Qualified',
  'Sample/Trial',
  'Quote Submitted',
  'Customer Testing',
  'Negotiation',
  'Won',
  'Lost'
);

create type lead_source as enum (
  'Referral',
  'Trade Show',
  'Website Inquiry',
  'Cold Outreach',
  'Broker',
  'Distributor Inquiry',
  'Existing Customer',
  'Social Media',
  'Other'
);

create type customer_type as enum (
  'Retail/Grocery',
  'DTC/E-commerce',
  'Wholesale/Foodservice',
  'Distributor',
  'Broker',
  'Markets/Events',
  'Other'
);

create type freight_terms as enum (
  'FOB Origin',
  'FOB Destination',
  'Prepaid & Add',
  'Prepaid (Free Freight)',
  'Collect',
  'Third Party'
);

create type sample_trial_status as enum (
  'Not Required',
  'Requested',
  'Sample Sent',
  'In Trial',
  'Trial Passed',
  'Trial Failed',
  'Approved'
);

create type task_status as enum ('Open', 'In Progress', 'Done', 'Cancelled');
create type task_priority as enum ('Low', 'Medium', 'High');
create type activity_type as enum ('comment', 'stage_change', 'lead_created');
