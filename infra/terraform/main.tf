# CareConnect Infrastructure - Canada Dev Environment
#
# Region: northamerica-northeast1 (Montreal)
# Services: Cloud Run, Healthcare API, VPC-SC, Secret Manager, KMS

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    # bucket  = "careconnect-terraform-state-ca-dev"
    # prefix  = "terraform/state"
    # Uncomment after creating state bucket
  }
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

# Local variables
locals {
  region            = var.region
  zone              = "${var.region}-a"
  environment       = "dev"
  service_name      = "careconnect"

  # Service accounts
  services = {
    "auth-identity"  = { port = 8001 }
    "qr-session"     = { port = 8002 }
    "patient-fhir"   = { port = 8003 }
    "doctor-finder"  = { port = 8004 }
  }

  # Common labels
  labels = {
    environment = local.environment
    service     = local.service_name
    managed_by  = "terraform"
  }
}

# Data residency validation
resource "null_resource" "validate_region" {
  provisioner "local-exec" {
    command = <<-EOT
      if [ "${var.region}" != "northamerica-northeast1" ]; then
        echo "ERROR: Region must be northamerica-northeast1 (Canada) for compliance"
        exit 1
      fi
    EOT
  }
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${local.service_name}-vpc-${local.environment}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  depends_on = [null_resource.validate_region]
}

# Subnet for Cloud Run
resource "google_compute_subnetwork" "cloudrun_subnet" {
  name          = "${local.service_name}-cloudrun-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = local.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

# KMS Key Ring for CMEK
resource "google_kms_key_ring" "careconnect" {
  name     = "${local.service_name}-keyring-${local.environment}"
  location = local.region
}

# KMS Key for data-at-rest encryption
resource "google_kms_crypto_key" "data_encryption" {
  name     = "data-encryption-key"
  key_ring = google_kms_key_ring.careconnect.id

  rotation_period = "7776000s" # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

# Secret Manager for sensitive config
resource "google_secret_manager_secret" "demo_jwt_secret" {
  secret_id = "demo-jwt-secret"

  replication {
    user_managed {
      replicas {
        location = local.region
      }
    }
  }

  labels = local.labels
}

# Healthcare API Dataset (FHIR store)
resource "google_healthcare_dataset" "careconnect" {
  name     = "${local.service_name}-dataset-${local.environment}"
  location = local.region
}

resource "google_healthcare_fhir_store" "main" {
  name    = "careconnect-fhir-store"
  dataset = google_healthcare_dataset.careconnect.id
  version = "R4"

  enable_update_create          = true
  disable_referential_integrity = false

  labels = local.labels
}

# Cloud Run services (placeholder - actual images built in CI)
# Note: First deploy requires container images; will fail until built
# Use terraform plan -out=plan.tfplan (no apply in CI)

resource "google_cloud_run_service" "auth_identity" {
  name     = "auth-identity-svc"
  location = local.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/auth-identity-svc:latest"

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }

      service_account_name = google_service_account.auth_identity.email
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"  # Cold-start mitigation
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
      template[0].metadata[0].annotations["client.knative.dev/user-image"],
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }
}

# Service Accounts (least privilege)
resource "google_service_account" "auth_identity" {
  account_id   = "auth-identity-svc"
  display_name = "Auth Identity Service"
}

resource "google_service_account" "patient_fhir" {
  account_id   = "patient-fhir-svc"
  display_name = "Patient FHIR Service"
}

resource "google_service_account" "qr_session" {
  account_id   = "qr-session-svc"
  display_name = "QR Session Service"
}

resource "google_service_account" "doctor_finder" {
  account_id   = "doctor-finder-svc"
  display_name = "Doctor Finder Service"
}

# IAM: FHIR store access (patient-fhir-svc only)
resource "google_healthcare_fhir_store_iam_member" "patient_fhir_reader" {
  fhir_store_id = google_healthcare_fhir_store.main.id
  role          = "roles/healthcare.fhirResourceReader"
  member        = "serviceAccount:${google_service_account.patient_fhir.email}"
}

# VPC Service Controls (basic perimeter)
# Uncomment after enabling Access Context Manager API
#
# resource "google_access_context_manager_service_perimeter" "careconnect" {
#   parent = "accessPolicies/${var.access_policy_id}"
#   name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/careconnect_perimeter"
#   title  = "CareConnect VPC-SC Perimeter"
#
#   status {
#     restricted_services = [
#       "healthcare.googleapis.com",
#       "storage.googleapis.com",
#       "bigquery.googleapis.com",
#     ]
#
#     resources = [
#       "projects/${var.project_id}",
#     ]
#   }
# }

# Outputs
output "vpc_id" {
  value       = google_compute_network.vpc.id
  description = "VPC network ID"
}

output "region" {
  value       = local.region
  description = "Deployment region"
}

output "kms_key_id" {
  value       = google_kms_crypto_key.data_encryption.id
  description = "KMS encryption key ID"
}

output "fhir_store_name" {
  value       = google_healthcare_fhir_store.main.name
  description = "FHIR store name"
}

output "auth_service_url" {
  value       = google_cloud_run_service.auth_identity.status[0].url
  description = "Auth service URL"
}
