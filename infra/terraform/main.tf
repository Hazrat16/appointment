terraform {
  required_version = ">= 1.5.0"

  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.19"
    }
  }
}

# Auth via env vars MONGODB_ATLAS_PUBLIC_KEY / MONGODB_ATLAS_PRIVATE_KEY — no keys in code.
provider "mongodbatlas" {}

resource "mongodbatlas_project" "this" {
  name   = var.project_name
  org_id = var.atlas_org_id
}

resource "mongodbatlas_flex_cluster" "this" {
  project_id = mongodbatlas_project.this.id
  name       = var.cluster_name

  provider_settings {
    backing_provider_name = var.backing_provider_name
    region_name            = var.region_name
  }
}

resource "mongodbatlas_database_user" "app_user" {
  project_id         = mongodbatlas_project.this.id
  username           = var.db_username
  password           = var.db_password
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = var.database_name
  }
}

# DEMO-ONLY: opens the cluster to the public internet. Tighten to specific
# egress IPs (Render's static IPs, or a VPC peering setup) before anything
# beyond a portfolio demo.
resource "mongodbatlas_project_ip_access_list" "allow_all_demo" {
  project_id = mongodbatlas_project.this.id
  cidr_block = "0.0.0.0/0"
  comment    = "DEMO ONLY - allow all - tighten before real production use"
}
