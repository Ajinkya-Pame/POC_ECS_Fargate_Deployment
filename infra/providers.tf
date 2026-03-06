terraform {
  required_version = "~> 1.1"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "meme-cricket-tf-state-store"
    key            = "state/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "meme-cricket-tf-state-lock"
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "ap-south-1"

}
