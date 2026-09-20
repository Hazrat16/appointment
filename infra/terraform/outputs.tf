output "atlas_project_id" {
  value = mongodbatlas_project.this.id
}

output "cluster_connection_strings" {
  value     = mongodbatlas_flex_cluster.this.connection_strings
  sensitive = true
}

output "mongodb_uri_hint" {
  description = "Take the standard (SRV) connection string from cluster_connection_strings and append the db user credentials + database name to build MONGODB_URI for Render."
  value       = "See cluster_connection_strings output; combine with db_username/db_password and database_name."
}
