# COST-OPTIMIZED DEPLOYMENT SCRIPT
# This script deploys CarTalks to Azure and GitHub using the FREE tiers where possible.

# PREREQUISITES:
# 1. New PowerShell window (to load 'az' and 'gh' paths)
# 2. Run 'az login' interactively
# 3. Run 'gh auth login' interactively

# --- CONFIGURATION ---
$REPO_NAME = "cartalks-app"
$LOCATION = "westeurope" # Choose a region close to you (e.g. "eastus", "westeurope")
$GRP = "cartalks-rg"
$SWA_NAME = "cartalks-web"
$DB_NAME = "cartalks-db"
# Storage account names must be unique globally, lowercase, numbers only
$STORAGE_NAME = "cartalksstore$((Get-Random -Minimum 1000 -Maximum 9999))"

Write-Host "🚀 Starting Free Tier Deployment for CarTalks..."

# 1. Create Resource Group (Container for all resources)
Write-Host "Creating Resource Group: $GRP"
az group create --name $GRP --location $LOCATION

# 2. Create Cosmos DB (Explicitly requesting Free Tier)
# Note: Free tier applies to the FIRST database in your subscription.
Write-Host "Creating Cosmos DB (Free Tier enabled)... this takes 5-10 minutes."
az cosmosdb create --name $DB_NAME --resource-group $GRP --kind GlobalDocumentDB --locations regionName=$LOCATION failoverPriority=0 --enable-free-tier true

# Retrieve Keys
$DB_KEY = az cosmosdb keys list --name $DB_NAME --resource-group $GRP --query primaryMasterKey --output tsv
$DB_ENDPOINT = az cosmosdb show --name $DB_NAME --resource-group $GRP --query documentEndpoint --output tsv

# 3. Create Storage Account (Low Cost - No 'Always Free' standard tier exists, but very cheap)
# Uses Standard_LRS (Locally Redundant Storage) which is the cheapest option.
Write-Host "Creating Storage Account..."
az storage account create --name $STORAGE_NAME --resource-group $GRP --location $LOCATION --sku Standard_LRS

# Retrieve Connection String
$STORAGE_CONN = az storage account show-connection-string --name $STORAGE_NAME --resource-group $GRP --query connectionString --output tsv

# 4. GitHub Repository Setup
# Checks if repo exists, if not creates it.
Write-Host "Setting up GitHub Repository..."
$REPO_URL = gh repo view $REPO_NAME --json url -q .url
if (-not $REPO_URL) {
    gh repo create $REPO_NAME --public --source=. --remote=origin --push
} else {
    Write-Host "Repo already exists, pushing updates..."
    git push origin master
}

# 5. Create Azure Static Web App (Explicitly Free SKU)
Write-Host "Creating Azure Static Web App (Free SKU)..."
$GITHUB_USER = gh api user -q .login
az staticwebapp create --name $SWA_NAME --resource-group $GRP --source "https://github.com/$GITHUB_USER/$REPO_NAME" --location $LOCATION --branch master --app-location "/" --api-location "api" --output-location "dist" --sku Free --login-with-github

# 6. Configure Environment Variables
# This connects your Web App/API to the Database and Storage we just created.
Write-Host "Linking API to Database..."
az staticwebapp appsettings set --name $SWA_NAME --resource-group $GRP --setting-names "COSMOS_DB_ENDPOINT=$DB_ENDPOINT" "COSMOS_DB_KEY=$DB_KEY" "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONN"

# 7. Final Output
$APP_URL = az staticwebapp show --name $SWA_NAME --resource-group $GRP --query defaultHostname --output tsv
Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!"
Write-Host "-----------------------------------------------"
Write-Host "Web App URL: https://$APP_URL"
Write-Host "GitHub Repo: https://github.com/$GITHUB_USER/$REPO_NAME"
Write-Host "-----------------------------------------------"
Write-Host "NEXT STEPS:"
Write-Host "1. Copy the Web App URL: https://$APP_URL"
Write-Host "2. Open 'src/config/api.js' and replace 'PROD_API_URL' with this link."
Write-Host "3. Run: git add . ; git commit -m 'Update API URL' ; git push"
Write-Host "4. Build your Android app: eas build -p android"
