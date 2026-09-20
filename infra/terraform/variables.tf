variable "atlas_org_id" {
  description = "Existing MongoDB Atlas organization ID (from the Atlas UI, Org Settings)."
  type        = string
}

variable "project_name" {
  description = "Name for the Atlas project Terraform will create."
  type        = string
  default     = "appointment-app"
}

variable "cluster_name" {
  description = "Name of the free-tier (Flex) cluster."
  type        = string
  default     = "appointment-cluster"
}

variable "backing_provider_name" {
  description = "Cloud backing the Flex cluster (AWS, GCP, or AZURE)."
  type        = string
  default     = "AWS"
}

variable "region_name" {
  description = "Atlas region name for the Flex cluster, e.g. US_EAST_1."
  type        = string
  default     = "US_EAST_1"
}

variable "db_username" {
  description = "Application database user."
  type        = string
  default     = "appointment_app"
}

variable "db_password" {
  description = "Application database user password."
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name the app user gets readWrite on."
  type        = string
  default     = "appointment"
}
