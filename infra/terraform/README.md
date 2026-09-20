# Terraform — MongoDB Atlas

Replaces the manual "Create a project and a free M0 cluster" step in
[`deployment/PHASE1.md`](../../deployment/PHASE1.md) (section 1) with `terraform apply`.

## Setup

1. Create an Atlas API key pair (Org Settings → Access Manager → API Keys)
   with Org Owner or Project Owner permissions.
2. Export credentials (never commit these):

   ```bash
   export MONGODB_ATLAS_PUBLIC_KEY="..."
   export MONGODB_ATLAS_PRIVATE_KEY="..."
   ```

3. Set required variables, e.g. in a git-ignored `terraform.tfvars`:

   ```hcl
   atlas_org_id = "..."
   db_password  = "..."
   ```

## Usage

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

`terraform apply` creates the Atlas project, the free Flex cluster, the
app database user, and the (demo-only) `0.0.0.0/0` network access entry.
Take `cluster_connection_strings` from `terraform output` and combine with
`db_username`/`db_password` to produce the `MONGODB_URI` you currently set
by hand in the Render dashboard.

## State

Terraform state is **not** committed — it contains connection strings and
is git-ignored (`*.tfstate`, `*.tfstate.*`, `.terraform/`). For a solo
portfolio project, local state is acceptable; for anything beyond that, use
a remote backend (e.g. Terraform Cloud's free tier).

## Scope

This manages MongoDB Atlas only. Render and Vercel continue their own
git-based auto-deploy and are not managed by this Terraform config.
